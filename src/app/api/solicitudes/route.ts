import { NextRequest, NextResponse, after } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { RESIDENT_PUBLIC_FIELDS } from "@/lib/schemas/resident";
import {
  CreateSolicitudBodySchema,
  type CreateSolicitudResponse,
  type SolicitudErrorResponse,
} from "@/lib/schemas/solicitud";
import { triggerMakeWebhook } from "@/lib/webhooks/make";
import { checkSolicitudRateLimit, getClientIp } from "@/lib/rate-limit";
import { log, getCorrelationId } from "@/lib/logger";

/**
 * POST /api/solicitudes
 *
 * Crea una solicitud de mantenimiento.
 *
 * Sprint 2 — D-03: Implementación completa.
 *   1. Valida el body con Zod
 *   2. Re-valida que el residente exista y esté activo (seguridad — no confiar en el cliente)
 *   3. Inserta en maintenance_requests con campos desnormalizados
 *   4. Retorna 201 inmediatamente (fire-and-forget en el webhook)
 *   5. Dispara webhook a Make.com sin await — actualiza webhook_status en background
 *
 * El fallo del webhook NO se retorna al usuario.
 * La solicitud queda guardada con webhook_status=failed para retry posterior.
 */
export async function POST(request: NextRequest) {
  const cid = getCorrelationId(request);

  try {
    // 0. Rate limiting — prevenir spam de solicitudes (5 por 5 min por IP)
    const ip = getClientIp(request);
    const { success: rateLimitOk, reset } = await checkSolicitudRateLimit(ip);

    if (!rateLimitOk) {
      const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);
      return NextResponse.json<SolicitudErrorResponse>(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Demasiadas solicitudes. Espera un momento e intenta de nuevo.",
          },
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSeconds) },
        }
      );
    }

    // 1. Parse and validate body
    const body = await request.json();
    const parsed = CreateSolicitudBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<SolicitudErrorResponse>(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Datos inválidos.",
          },
        },
        { status: 400 }
      );
    }

    const { resident_id, work_area, criticality, description } = parsed.data;

    // 2. Re-validate resident exists and is active (security: don't trust client state)
    const { data: resident, error: dbError } = await supabaseAdmin
      .from("residents")
      .select(RESIDENT_PUBLIC_FIELDS)
      .eq("id", resident_id)
      .maybeSingle();

    if (dbError) {
      log("error", "Supabase error en solicitudes", { error: dbError.message, correlation_id: cid });
      return NextResponse.json<SolicitudErrorResponse>(
        {
          error: {
            code: "INTERNAL_ERROR",
            message: "Error interno del servidor.",
          },
        },
        { status: 500 }
      );
    }

    if (!resident) {
      return NextResponse.json<SolicitudErrorResponse>(
        {
          error: {
            code: "RESIDENT_NOT_FOUND",
            message: "Residente no encontrado.",
          },
        },
        { status: 404 }
      );
    }

    if (resident.status !== "active") {
      return NextResponse.json<SolicitudErrorResponse>(
        {
          error: {
            code: "RESIDENT_INACTIVE",
            message:
              "Tu cuenta fue desactivada. Contacta a la administración de TEPUY.",
          },
        },
        { status: 403 }
      );
    }

    // 3. Insert into maintenance_requests
    const { data: insertedRequest, error: insertError } = await supabaseAdmin
      .from("maintenance_requests")
      .insert({
        resident_id,
        ci_usuario: resident.ci_usuario,
        nombre_usuario: resident.nombre_usuario,
        descripcion_inmueble: resident.descripcion_inmueble,
        nro_apto: resident.nro_apto,
        tlf_usuario: resident.tlf_usuario,
        gerencia: resident.gerencia,
        supervisor_nombre: resident.supervisor_nombre,
        supervisor_tlf: resident.supervisor_tlf,
        work_area,
        criticality,
        description,
      })
      .select("id")
      .single();

    if (insertError) {
      log("error", "Insert error en solicitudes", { error: insertError.message, correlation_id: cid });
      return NextResponse.json<SolicitudErrorResponse>(
        {
          error: {
            code: "INTERNAL_ERROR",
            message: "Error al crear la solicitud. Intenta de nuevo.",
          },
        },
        { status: 500 }
      );
    }

    // 4. Retornar 201 inmediatamente — antes de que el webhook termine
    // El usuario ve la confirmación en cuanto la solicitud queda en DB.
    const response = NextResponse.json<CreateSolicitudResponse>(
      {
        request_id: insertedRequest.id,
        status: "created",
        task_url: null, // Se actualiza en DB de forma async — no en el response inicial
      },
      { status: 201 }
    );

    // 5. after() — ejecuta DESPUÉS de enviar la response al cliente.
    // A diferencia de void (async () => {}), after() garantiza que Vercel
    // NO corte la función serverless antes de que el task termine.
    after(async () => {
      try {
        const webhookResult = await triggerMakeWebhook({
          request_id: insertedRequest.id,
          ci_usuario: resident.ci_usuario,
          nombre_usuario: resident.nombre_usuario,
          nro_apto: resident.nro_apto,
          descripcion_inmueble: resident.descripcion_inmueble,
          tlf_usuario: resident.tlf_usuario,
          gerencia: resident.gerencia,
          supervisor_nombre: resident.supervisor_nombre,
          supervisor_tlf: resident.supervisor_tlf,
          work_area,
          criticality,
          description,
          created_at: new Date().toISOString(),
        });

        if (webhookResult.status === "sent") {
          await supabaseAdmin
            .from("maintenance_requests")
            .update({
              webhook_status: "sent",
              external_reference: webhookResult.taskUrl,
            })
            .eq("id", insertedRequest.id);

          log("info", "Webhook completado", {
            request_id: insertedRequest.id,
            task_url: webhookResult.taskUrl,
            correlation_id: cid,
          });
          return;
        }

        log("error", "Webhook no confirmado — marcando para retry", {
          request_id: insertedRequest.id,
          webhook_status: webhookResult.status,
          reason: webhookResult.reason,
          correlation_id: cid,
        });

        await supabaseAdmin
          .from("maintenance_requests")
          .update({ webhook_status: "failed" })
          .eq("id", insertedRequest.id);
      } catch (err) {
        log("error", "No se pudo actualizar webhook_status", {
          request_id: insertedRequest.id,
          error: err instanceof Error ? err.message : String(err),
          correlation_id: cid,
        });
      }
    });

    return response;
  } catch (error) {
    log("error", "Error inesperado en solicitudes", { error: error instanceof Error ? error.message : String(error), correlation_id: cid });
    return NextResponse.json<SolicitudErrorResponse>(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Error interno del servidor.",
        },
      },
      { status: 500 }
    );
  }
}

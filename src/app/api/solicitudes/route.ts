import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { RESIDENT_PUBLIC_FIELDS } from "@/lib/schemas/resident";
import {
  CreateSolicitudBodySchema,
  type CreateSolicitudResponse,
  type SolicitudErrorResponse,
} from "@/lib/schemas/solicitud";
import { triggerMakeWebhook } from "@/lib/webhooks/make";

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
  try {
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

    const { resident_id, work_area, description, preferred_time, access_notes } =
      parsed.data;

    // 2. Re-validate resident exists and is active (security: don't trust client state)
    const { data: resident, error: dbError } = await supabaseAdmin
      .from("residents")
      .select(RESIDENT_PUBLIC_FIELDS)
      .eq("id", resident_id)
      .maybeSingle();

    if (dbError) {
      console.error("[solicitudes] Supabase error:", dbError.message);
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
        work_area,
        description,
        preferred_time: preferred_time || null,
        access_notes: access_notes || null,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[solicitudes] Insert error:", insertError.message);
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

    // 5. Fire-and-forget: disparar webhook a Make.com SIN await
    void (async () => {
      const webhookResult = await triggerMakeWebhook({
        request_id: insertedRequest.id,
        ci_usuario: resident.ci_usuario,
        nombre_usuario: resident.nombre_usuario,
        nro_apto: resident.nro_apto,
        descripcion_inmueble: resident.descripcion_inmueble,
        tlf_usuario: resident.tlf_usuario,
        gerencia: resident.gerencia,
        work_area,
        description,
        preferred_time: preferred_time || null,
        access_notes: access_notes || null,
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

        console.info("[solicitudes] Webhook completado", {
          request_id: insertedRequest.id,
          task_url: webhookResult.taskUrl,
        });
        return;
      }

      console.error("[solicitudes] Webhook no confirmado — marcando para retry", {
        request_id: insertedRequest.id,
        status: webhookResult.status,
        reason: webhookResult.reason,
      });

      await supabaseAdmin
        .from("maintenance_requests")
        .update({ webhook_status: "failed" })
        .eq("id", insertedRequest.id);
    })().catch(async (updateErr) => {
      // Si incluso el update falla, solo loguear — no propagar
      console.error("[solicitudes] No se pudo actualizar webhook_status", {
        request_id: insertedRequest.id,
        error: updateErr,
      });
    });

    return response;
  } catch (error) {
    console.error("[solicitudes] Unexpected error:", error);
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

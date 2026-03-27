import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { RESIDENT_PUBLIC_FIELDS } from "@/lib/schemas/resident";
import {
  CreateSolicitudBodySchema,
  type CreateSolicitudResponse,
  type SolicitudErrorResponse,
} from "@/lib/schemas/solicitud";

/**
 * POST /api/solicitudes
 *
 * Creates a maintenance request.
 *
 * MOCK ENDPOINT — Sprint 2 (Gabriele).
 * Daniel will replace this with the real implementation in D-03:
 *   - Re-validates resident status
 *   - Inserts into maintenance_requests table
 *   - Fires webhook async to Make.com
 *   - Returns 201 with request_id
 *
 * TODO(Daniel): Replace this mock with real implementation.
 * The contract (request/response shapes) is final — only the internals change.
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

    // 4. Return success
    // TODO(Daniel): After insert, fire webhook async (fire-and-forget)
    // via triggerWebhook(payload) — see D-03 spec.
    // If webhook returns task_url, update external_reference in DB
    // and include task_url in this response.

    return NextResponse.json<CreateSolicitudResponse>(
      {
        request_id: insertedRequest.id,
        status: "created",
        task_url: null, // Will be populated when webhook integration is live
      },
      { status: 201 }
    );
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

/**
 * PATCH /api/admin/solicitudes/[id]
 *
 * Actualiza el estado y/o notas de una solicitud de mantenimiento.
 * Requiere sesión de admin.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/adminAuth";
import { log, getCorrelationId } from "@/lib/logger";
import { z } from "zod";
import type { AdminErrorResponse } from "@/lib/schemas/admin";
import { SOLICITUD_ADMIN_FIELDS } from "../route";

const UpdateSolicitudSchema = z.object({
  request_status: z.enum(["pendiente", "en_proceso", "completado", "cancelado"]).optional(),
  admin_notes:    z.string().max(1000).optional().or(z.literal("")),
}).refine((d) => d.request_status !== undefined || d.admin_notes !== undefined, {
  message: "Se debe proporcionar al menos un campo para actualizar.",
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json<AdminErrorResponse>(
        { error: { code: "RESIDENT_NOT_FOUND", message: "ID de solicitud inválido." } },
        { status: 404 }
      );
    }

    const body   = await request.json();
    const parsed = UpdateSolicitudSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<AdminErrorResponse>(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Datos inválidos." } },
        { status: 400 }
      );
    }

    const updates: Record<string, string | null> = {};
    if (parsed.data.request_status !== undefined) updates.request_status = parsed.data.request_status;
    if (parsed.data.admin_notes    !== undefined) updates.admin_notes    = parsed.data.admin_notes || null;

    const { data: updated, error } = await supabaseAdmin
      .from("maintenance_requests")
      .update(updates)
      .eq("id", id)
      .select(SOLICITUD_ADMIN_FIELDS)
      .maybeSingle();

    if (error) {
      log("error", "Error actualizando solicitud", { error: error.message, id, correlation_id: getCorrelationId(request) });
      return NextResponse.json<AdminErrorResponse>(
        { error: { code: "INTERNAL_ERROR", message: "Error al actualizar la solicitud." } },
        { status: 500 }
      );
    }

    if (!updated) {
      return NextResponse.json<AdminErrorResponse>(
        { error: { code: "RESIDENT_NOT_FOUND", message: "Solicitud no encontrada." } },
        { status: 404 }
      );
    }

    log("info", "Solicitud actualizada", { id, correlation_id: getCorrelationId(request) });
    return NextResponse.json({ solicitud: updated });
  } catch (err) {
    log("error", "Error inesperado actualizando solicitud", { error: err instanceof Error ? err.message : String(err), correlation_id: getCorrelationId(request) });
    return NextResponse.json<AdminErrorResponse>(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor." } },
      { status: 500 }
    );
  }
}

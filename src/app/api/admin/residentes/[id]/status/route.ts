/**
 * /api/admin/residentes/[id]/status
 *
 * PATCH — Activar o desactivar un residente (D-04 Daniel / D-US-04)
 *
 * Endpoint dedicado al toggle de status para que sea explícito e intencional.
 * El administrador debe confirmar antes de llamar este endpoint (UI con dialog).
 *
 * Criterios de aceptación D-US-04:
 * - Un residente inactivo no puede completar el lookup en el portal público
 * - El administrador puede reactivar con el mismo flujo
 * - La acción requiere un clic de confirmación explícito (responsabilidad de la UI)
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/adminAuth";
import {
  UpdateResidentStatusSchema,
  RESIDENT_ADMIN_FIELDS,
  type AdminErrorResponse,
  type ResidentAdmin,
} from "@/lib/schemas/admin";
import { log, getCorrelationId } from "@/lib/logger";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Auth
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { id } = await params;

    // 2. Validar UUID
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json<AdminErrorResponse>(
        { error: { code: "RESIDENT_NOT_FOUND", message: "ID de residente inválido." } },
        { status: 404 }
      );
    }

    // 3. Validar body — solo acepta { status: "active" | "inactive" }
    const body = await request.json();
    const parsed = UpdateResidentStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<AdminErrorResponse>(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Status inválido.",
          },
        },
        { status: 400 }
      );
    }

    const { status } = parsed.data;

    // 4. Actualizar status
    const { data: updated, error } = await supabaseAdmin
      .from("residents")
      .update({ status })
      .eq("id", id)
      .select(RESIDENT_ADMIN_FIELDS)
      .maybeSingle();

    if (error) {
      log("error", "Error cambiando status de residente", { error: error.message, id, correlation_id: getCorrelationId(request) });
      return NextResponse.json<AdminErrorResponse>(
        { error: { code: "INTERNAL_ERROR", message: "Error al cambiar el estado del residente." } },
        { status: 500 }
      );
    }

    if (!updated) {
      return NextResponse.json<AdminErrorResponse>(
        { error: { code: "RESIDENT_NOT_FOUND", message: "Residente no encontrado." } },
        { status: 404 }
      );
    }

    const action = status === "active" ? "reactivado" : "desactivado";
    log("info", `Residente ${action}`, {
      id,
      status,
      ci_usuario: (updated as ResidentAdmin).ci_usuario,
      correlation_id: getCorrelationId(request),
    });

    return NextResponse.json({ resident: updated as ResidentAdmin });
  } catch (err) {
    log("error", "Error inesperado cambiando status", { error: err instanceof Error ? err.message : String(err), correlation_id: getCorrelationId(request) });
    return NextResponse.json<AdminErrorResponse>(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor." } },
      { status: 500 }
    );
  }
}

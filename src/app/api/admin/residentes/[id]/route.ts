/**
 * /api/admin/residentes/[id]
 *
 * PATCH — Editar campos parciales de un residente (D-04 Daniel)
 *
 * La CI (ci_usuario) está EXCLUIDA del body — es inmutable post-creación.
 * Si el cliente la envía, se ignora silenciosamente (no retorna error).
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/adminAuth";
import {
  UpdateResidentSchema,
  RESIDENT_ADMIN_FIELDS,
  type AdminErrorResponse,
  type ResidentAdmin,
} from "@/lib/schemas/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Auth
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { id } = await params;

    // 2. Validar que el id es un UUID válido
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json<AdminErrorResponse>(
        { error: { code: "RESIDENT_NOT_FOUND", message: "ID de residente inválido." } },
        { status: 404 }
      );
    }

    // 3. Parsear y validar body (todos los campos opcionales, CI excluida)
    const body = await request.json();
    const parsed = UpdateResidentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<AdminErrorResponse>(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
          },
        },
        { status: 400 }
      );
    }

    // Filtrar campos vacíos para no sobreescribir con null accidentalmente
    // Solo actualizar los campos que vienen explícitamente en el body
    const updates: Record<string, string | null> = {};
    const data = parsed.data;

    if ("nombre_usuario" in data)       updates.nombre_usuario = data.nombre_usuario || null;
    if ("tlf_usuario" in data)          updates.tlf_usuario = data.tlf_usuario || null;
    if ("descripcion_inmueble" in data) updates.descripcion_inmueble = data.descripcion_inmueble || null;
    if ("nro_apto" in data)             updates.nro_apto = data.nro_apto || null;
    if ("fase" in data)                 updates.fase = data.fase || null;
    if ("gerencia" in data)             updates.gerencia = data.gerencia || null;
    if ("nombre_propietario" in data)   updates.nombre_propietario = data.nombre_propietario || null;
    if ("ci_propietario" in data)       updates.ci_propietario = data.ci_propietario || null;
    if ("email_propietario" in data)    updates.email_propietario = data.email_propietario || null;
    if ("tlf_propietario" in data)      updates.tlf_propietario = data.tlf_propietario || null;
    if ("fecha_inicio_contrato" in data) updates.fecha_inicio_contrato = data.fecha_inicio_contrato || null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json<AdminErrorResponse>(
        { error: { code: "VALIDATION_ERROR", message: "No se proporcionaron campos para actualizar." } },
        { status: 400 }
      );
    }

    // 4. Actualizar en Supabase
    const { data: updated, error } = await supabaseAdmin
      .from("residents")
      .update(updates)
      .eq("id", id)
      .select(RESIDENT_ADMIN_FIELDS)
      .maybeSingle();

    if (error) {
      console.error("[admin/residentes PATCH] Supabase error:", error.message);
      return NextResponse.json<AdminErrorResponse>(
        { error: { code: "INTERNAL_ERROR", message: "Error al actualizar el residente." } },
        { status: 500 }
      );
    }

    if (!updated) {
      return NextResponse.json<AdminErrorResponse>(
        { error: { code: "RESIDENT_NOT_FOUND", message: "Residente no encontrado." } },
        { status: 404 }
      );
    }

    console.info("[admin/residentes PATCH] Residente actualizado", { id });
    return NextResponse.json({ resident: updated as ResidentAdmin });
  } catch (err) {
    console.error("[admin/residentes PATCH] Unexpected error:", err);
    return NextResponse.json<AdminErrorResponse>(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor." } },
      { status: 500 }
    );
  }
}

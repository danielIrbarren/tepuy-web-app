/**
 * GET /api/admin/solicitudes
 *
 * Lista las solicitudes de mantenimiento con filtros y paginación.
 * Requiere sesión de admin.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/adminAuth";
import { log, getCorrelationId } from "@/lib/logger";
import { z } from "zod";
import type { AdminErrorResponse } from "@/lib/schemas/admin";

const ListSolicitudesQuerySchema = z.object({
  page:            z.coerce.number().int().min(1).default(1),
  per_page:        z.coerce.number().int().min(1).max(100).default(25),
  search:          z.string().max(100).optional(),   // CI del residente
  residencia:      z.string().max(255).optional(),
  work_area:       z.string().max(50).optional(),
  request_status:  z.enum(["pendiente", "en_proceso", "completado", "cancelado"]).optional(),
  webhook_status:  z.enum(["pending", "sent", "failed"]).optional(),
});

export const SOLICITUD_ADMIN_FIELDS =
  "id, resident_id, ci_usuario, nombre_usuario, descripcion_inmueble, nro_apto, tlf_usuario, gerencia, supervisor_nombre, supervisor_tlf, work_area, description, request_status, admin_notes, webhook_status, external_reference, created_at, updated_at" as const;

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { searchParams } = request.nextUrl;
    const queryResult = ListSolicitudesQuerySchema.safeParse({
      page:           searchParams.get("page") ?? 1,
      per_page:       searchParams.get("per_page") ?? 25,
      search:         searchParams.get("search") ?? undefined,
      residencia:     searchParams.get("residencia") ?? undefined,
      work_area:      searchParams.get("work_area") ?? undefined,
      request_status: searchParams.get("request_status") ?? undefined,
      webhook_status: searchParams.get("webhook_status") ?? undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json<AdminErrorResponse>(
        { error: { code: "VALIDATION_ERROR", message: queryResult.error.issues[0]?.message ?? "Parámetros inválidos." } },
        { status: 400 }
      );
    }

    const { page, per_page, search, residencia, work_area, request_status, webhook_status } = queryResult.data;
    const from = (page - 1) * per_page;
    const to   = from + per_page - 1;

    let query = supabaseAdmin
      .from("maintenance_requests")
      .select(SOLICITUD_ADMIN_FIELDS, { count: "exact" });

    if (search)         query = query.ilike("ci_usuario", `%${search}%`);
    if (residencia)     query = query.ilike("descripcion_inmueble", `%${residencia}%`);
    if (work_area)      query = query.eq("work_area", work_area);
    if (request_status) query = query.eq("request_status", request_status);
    if (webhook_status) query = query.eq("webhook_status", webhook_status);

    const { data: solicitudes, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      log("error", "Error listando solicitudes", { error: error.message, correlation_id: getCorrelationId(request) });
      return NextResponse.json<AdminErrorResponse>(
        { error: { code: "INTERNAL_ERROR", message: "Error al obtener solicitudes." } },
        { status: 500 }
      );
    }

    const total       = count ?? 0;
    const total_pages = Math.ceil(total / per_page);

    return NextResponse.json({ solicitudes: solicitudes ?? [], total, page, per_page, total_pages });
  } catch (err) {
    log("error", "Error inesperado listando solicitudes", { error: err instanceof Error ? err.message : String(err), correlation_id: getCorrelationId(request) });
    return NextResponse.json<AdminErrorResponse>(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor." } },
      { status: 500 }
    );
  }
}

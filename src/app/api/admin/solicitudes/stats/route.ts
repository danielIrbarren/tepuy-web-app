/**
 * GET /api/admin/solicitudes/stats
 *
 * Métricas agregadas para el dashboard de administración ("Resumen").
 * Devuelve conteos por periodo (hoy / semana / mes), desgloses por estado,
 * área de trabajo, urgencia, tendencia de los últimos 7 días y los usuarios
 * con más solicitudes. La agregación se hace en Postgres (función RPC
 * get_solicitudes_stats) para no chocar con el límite de 1000 filas de la API.
 *
 * Requiere sesión de admin.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/adminAuth";
import { log, getCorrelationId } from "@/lib/logger";
import type { AdminErrorResponse } from "@/lib/schemas/admin";

export type SolicitudesStats = {
  today: number;
  week: number;
  month: number;
  total: number;
  by_status: { key: string; count: number }[];
  by_work_area: { key: string; count: number }[];
  by_criticality: { key: string; count: number }[];
  top_users: { ci_usuario: string; nombre_usuario: string | null; count: number }[];
  last_7_days: { date: string; count: number }[];
};

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { data, error } = await supabaseAdmin.rpc("get_solicitudes_stats");

    if (error) {
      log("error", "Error obteniendo estadísticas de solicitudes", {
        error: error.message,
        correlation_id: getCorrelationId(request),
      });
      return NextResponse.json<AdminErrorResponse>(
        { error: { code: "INTERNAL_ERROR", message: "Error al obtener estadísticas." } },
        { status: 500 }
      );
    }

    return NextResponse.json(data as SolicitudesStats);
  } catch (err) {
    log("error", "Error inesperado obteniendo estadísticas", {
      error: err instanceof Error ? err.message : String(err),
      correlation_id: getCorrelationId(request),
    });
    return NextResponse.json<AdminErrorResponse>(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor." } },
      { status: 500 }
    );
  }
}

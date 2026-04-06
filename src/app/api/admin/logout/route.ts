import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  clearAdminSession,
  clearAdminSessionCookie,
} from "@/lib/adminSession";
import { getCorrelationId, log } from "@/lib/logger";

/**
 * DELETE /api/admin/logout
 *
 * Elimina la sesión de admin de la DB y borra la cookie.
 */
export async function DELETE(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const correlationId = getCorrelationId(request);

  if (token) {
    try {
      await clearAdminSession(token);
      log("info", "Sesión admin eliminada", { correlation_id: correlationId });
    } catch (error) {
      log("warn", "No se pudo eliminar la sesión admin durante logout", {
        correlation_id: correlationId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const response = NextResponse.json({ ok: true });
  clearAdminSessionCookie(response);
  return response;
}

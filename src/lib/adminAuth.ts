/**
 * Middleware de autenticación para el panel de administración de TEPUY.
 *
 * Sprint 3 — G-03/D-04: Usado en todas las rutas /api/admin/*.
 *
 * Flujo:
 *   1. Lee la cookie "tepuy_admin_session" de la request
 *   2. Busca el token en la tabla admin_sessions de Supabase
 *   3. Verifica que la sesión no haya expirado (expires_at > now())
 *   4. Retorna null si es válida, o un NextResponse 401 si no lo es
 *
 * Uso en Route Handlers:
 *   const authError = await requireAdmin(request);
 *   if (authError) return authError;
 *   // ... resto del handler autenticado
 */

import { NextRequest, NextResponse } from "next/server";
import type { AdminErrorResponse } from "@/lib/schemas/admin";
import { log, getCorrelationId } from "@/lib/logger";
import {
  ADMIN_SESSION_COOKIE,
  clearAdminSessionCookie,
  getAdminSession,
} from "@/lib/adminSession";

function unauthorizedResponse(message: string) {
  const response = NextResponse.json<AdminErrorResponse>(
    { error: { code: "UNAUTHORIZED", message } },
    { status: 401 }
  );

  clearAdminSessionCookie(response);
  return response;
}

/**
 * Verifica que la request tenga una sesión de admin válida.
 *
 * @returns null si la sesión es válida (el handler puede continuar)
 * @returns NextResponse 401 si la sesión es inválida o no existe
 */
export async function requireAdmin(
  request: NextRequest
): Promise<NextResponse | null> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const correlationId = getCorrelationId(request);

  if (!token) {
    log("warn", "Acceso admin sin cookie de sesión", { correlation_id: correlationId });
    return unauthorizedResponse("Sesión no encontrada. Inicia sesión.");
  }

  let session;
  try {
    session = await getAdminSession(token);
  } catch (error) {
    log("error", "Error verificando sesión admin", {
      error: error instanceof Error ? error.message : String(error),
      correlation_id: correlationId,
    });
    return unauthorizedResponse("Error verificando la sesión.");
  }

  if (session.status === "invalid") {
    log("warn", "Sesión admin inválida", { correlation_id: correlationId });
    return unauthorizedResponse("Sesión inválida. Inicia sesión.");
  }

  if (session.status === "expired") {
    log("warn", "Sesión admin expirada", {
      correlation_id: correlationId,
      expires_at: session.session.expires_at,
    });
    return unauthorizedResponse("Sesión expirada. Inicia sesión nuevamente.");
  }

  return null;
}

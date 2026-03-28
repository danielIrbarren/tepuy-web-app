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
import { supabaseAdmin } from "@/lib/supabase/server";
import type { AdminErrorResponse } from "@/lib/schemas/admin";

export const ADMIN_SESSION_COOKIE = "tepuy_admin_session";
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 horas

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

  if (!token) {
    return NextResponse.json<AdminErrorResponse>(
      { error: { code: "UNAUTHORIZED", message: "Sesión no encontrada. Inicia sesión." } },
      { status: 401 }
    );
  }

  // Buscar la sesión en DB
  const { data: session, error } = await supabaseAdmin
    .from("admin_sessions")
    .select("id, expires_at")
    .eq("session_token", token)
    .maybeSingle();

  if (error) {
    console.error("[adminAuth] Supabase error:", error.message);
    return NextResponse.json<AdminErrorResponse>(
      { error: { code: "UNAUTHORIZED", message: "Error verificando la sesión." } },
      { status: 401 }
    );
  }

  if (!session) {
    return NextResponse.json<AdminErrorResponse>(
      { error: { code: "UNAUTHORIZED", message: "Sesión inválida. Inicia sesión." } },
      { status: 401 }
    );
  }

  // Verificar expiración
  if (new Date(session.expires_at) < new Date()) {
    // Limpiar sesión expirada en background
    void supabaseAdmin
      .from("admin_sessions")
      .delete()
      .eq("id", session.id);

    return NextResponse.json<AdminErrorResponse>(
      { error: { code: "UNAUTHORIZED", message: "Sesión expirada. Inicia sesión nuevamente." } },
      { status: 401 }
    );
  }

  return null; // ✅ Sesión válida
}

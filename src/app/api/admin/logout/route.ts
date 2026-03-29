import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const ADMIN_SESSION_COOKIE = "tepuy_admin_session";

/**
 * DELETE /api/admin/logout
 *
 * Elimina la sesión de admin de la DB y borra la cookie.
 */
export async function DELETE(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (token) {
    // Eliminar sesión de la DB (fire-and-forget, no bloquea el logout)
    void supabaseAdmin
      .from("admin_sessions")
      .delete()
      .eq("session_token", token);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // Eliminar cookie inmediatamente
  });

  return response;
}

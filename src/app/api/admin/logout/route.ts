/**
 * DELETE /api/admin/logout
 *
 * Sprint 3 — G-03: Cierra la sesión del admin.
 *
 * 1. Lee la cookie tepuy_admin_session
 * 2. Elimina la sesión de admin_sessions en DB
 * 3. Borra la cookie del response
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/adminAuth";

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

    if (token) {
      // Eliminar sesión del DB (best effort)
      await supabaseAdmin
        .from("admin_sessions")
        .delete()
        .eq("session_token", token);
    }

    // Borrar cookie
    const response = NextResponse.json(
      { message: "Sesión cerrada." },
      { status: 200 }
    );

    response.cookies.set(ADMIN_SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0, // Expira inmediatamente
    });

    return response;
  } catch (error) {
    console.error("[admin/logout] Unexpected error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error cerrando sesión." } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/login
 *
 * Sprint 3 — G-03: Autenticación del panel de administración.
 *
 * Flujo:
 *   1. Recibe { password } en el body
 *   2. Compara vs ADMIN_PASSWORD_HASH (bcrypt) en env
 *   3. Crea sesión en admin_sessions con token aleatorio
 *   4. Setea cookie httpOnly "tepuy_admin_session" con el token
 *   5. Retorna 200
 *
 * La sesión expira en 8 horas (SESSION_DURATION_MS).
 */

import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  ADMIN_SESSION_COOKIE,
  SESSION_DURATION_MS,
} from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Contraseña requerida." } },
        { status: 400 }
      );
    }

    // Verificar contraseña contra el hash almacenado
    const hash = process.env.ADMIN_PASSWORD_HASH;
    if (!hash) {
      console.error("[admin/login] ADMIN_PASSWORD_HASH not configured");
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Error de configuración del servidor." } },
        { status: 500 }
      );
    }

    const isValid = await compare(password, hash);

    if (!isValid) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Contraseña incorrecta." } },
        { status: 401 }
      );
    }

    // Crear sesión
    const sessionToken = randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

    const { error: insertError } = await supabaseAdmin
      .from("admin_sessions")
      .insert({
        session_token: sessionToken,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("[admin/login] Session insert error:", insertError.message);
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Error al crear la sesión." } },
        { status: 500 }
      );
    }

    // Setear cookie httpOnly
    const response = NextResponse.json(
      { message: "Sesión iniciada correctamente." },
      { status: 200 }
    );

    response.cookies.set(ADMIN_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_MS / 1000, // en segundos
    });

    console.info("[admin/login] Admin session created");
    return response;
  } catch (error) {
    console.error("[admin/login] Unexpected error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor." } },
      { status: 500 }
    );
  }
}

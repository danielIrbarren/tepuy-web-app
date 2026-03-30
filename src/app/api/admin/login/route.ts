import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import { log, getCorrelationId } from "@/lib/logger";

const ADMIN_SESSION_COOKIE = "tepuy_admin_session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 horas

/**
 * POST /api/admin/login
 *
 * Autentica al administrador con contraseña.
 * Crea una sesión en admin_sessions y setea cookie httpOnly.
 *
 * Body: { password: string }
 * Env:  ADMIN_PASSWORD_HASH (bcrypt hash)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "La contraseña es requerida." } },
        { status: 400 }
      );
    }

    const cid = getCorrelationId(request);

    const storedHash = process.env.ADMIN_PASSWORD_HASH;
    if (!storedHash) {
      log("error", "ADMIN_PASSWORD_HASH no configurado", { correlation_id: cid });
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Error de configuración del servidor." } },
        { status: 500 }
      );
    }

    const isValid = await compare(password, storedHash);
    if (!isValid) {
      return NextResponse.json(
        { error: { code: "INVALID_CREDENTIALS", message: "Contraseña incorrecta." } },
        { status: 401 }
      );
    }

    // Crear sesión en DB
    const sessionToken = randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    const { error: insertError } = await supabaseAdmin
      .from("admin_sessions")
      .insert({
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      log("error", "Error creando sesión admin", { error: insertError.message, correlation_id: cid });
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Error al crear la sesión." } },
        { status: 500 }
      );
    }

    // Setear cookie httpOnly
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_MS / 1000, // en segundos
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor." } },
      { status: 500 }
    );
  }
}

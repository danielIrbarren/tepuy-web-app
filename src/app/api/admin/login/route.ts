import { NextRequest, NextResponse } from "next/server";
import {
  createAdminSession,
  setAdminSessionCookie,
  verifyAdminPassword,
} from "@/lib/adminSession";
import { log, getCorrelationId } from "@/lib/logger";

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
    const verification = await verifyAdminPassword(password);

    if (!verification.ok && verification.reason === "MISSING_HASH") {
      log("error", "ADMIN_PASSWORD_HASH no configurado", { correlation_id: cid });
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Error de configuración del servidor." } },
        { status: 500 }
      );
    }

    if (verification.ok && verification.usedNormalization) {
      log("warn", "ADMIN_PASSWORD_HASH normalizado antes de validar login", {
        correlation_id: cid,
        had_wrapping_quotes: verification.hadWrappingQuotes,
        had_escaped_dollars: verification.hadEscapedDollars,
        raw_length: verification.rawLength,
        normalized_length: verification.normalizedLength,
      });
    }

    if (!verification.ok) {
      log("warn", "Credenciales admin inválidas", { correlation_id: cid });
      return NextResponse.json(
        { error: { code: "INVALID_CREDENTIALS", message: "Contraseña incorrecta." } },
        { status: 401 }
      );
    }

    try {
      const session = await createAdminSession();
      const response = NextResponse.json({ ok: true });

      setAdminSessionCookie(response, session.token);

      log("info", "Sesión admin creada", {
        correlation_id: cid,
        expires_at: session.expiresAt.toISOString(),
      });

      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log("error", "Error creando sesión admin", {
        error: message,
        correlation_id: cid,
      });
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Error al crear la sesión." } },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor." } },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { normalizeCi } from "@/lib/utils/normalize-ci";
import {
  RESIDENT_PUBLIC_FIELDS,
  type LookupErrorResponse,
  type LookupSuccessResponse,
} from "@/lib/schemas/resident";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { log, getCorrelationId } from "@/lib/logger";

/**
 * GET /api/residentes/lookup?ci={CI}
 *
 * Public endpoint — no auth required.
 * Uses service_role_key server-side to bypass RLS.
 * Returns only public-safe fields.
 *
 * D-02: Rate limited — 10 requests por minuto por IP (sliding window).
 * El request 11 recibe 429 con header Retry-After.
 */
export async function GET(request: NextRequest) {
  const cid = getCorrelationId(request);

  try {
    // 1. Rate limiting — verificar antes de cualquier procesamiento
    const ip = getClientIp(request);
    const { success, reset } = await checkRateLimit(ip);

    if (!success) {
      const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);
      return NextResponse.json<LookupErrorResponse>(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Demasiados intentos. Espera un momento e intenta de nuevo.",
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSeconds),
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(reset / 1000)),
          },
        }
      );
    }

    // 2. Extract and validate query param
    const { searchParams } = request.nextUrl;
    const rawCi = searchParams.get("ci");

    if (!rawCi || rawCi.trim().length < 6) {
      return NextResponse.json<LookupErrorResponse>(
        {
          error: {
            code: "INVALID_CI",
            message: "Debe proporcionar un número de cédula válido.",
          },
        },
        { status: 400 }
      );
    }

    // 2. Normalize CI
    const normalizedCi = normalizeCi(rawCi);

    if (!normalizedCi) {
      return NextResponse.json<LookupErrorResponse>(
        {
          error: {
            code: "INVALID_CI",
            message:
              "Formato de cédula inválido. Use un formato como V12345678.",
          },
        },
        { status: 400 }
      );
    }

    // 3. Query Supabase (server-side with service_role_key)
    const { data: resident, error: dbError } = await supabaseAdmin
      .from("residents")
      .select(RESIDENT_PUBLIC_FIELDS)
      .eq("ci_usuario", normalizedCi)
      .maybeSingle();

    if (dbError) {
      log("error", "Supabase error en lookup", { error: dbError.message, correlation_id: cid });
      return NextResponse.json<LookupErrorResponse>(
        {
          error: {
            code: "INTERNAL_ERROR",
            message: "Error interno del servidor. Intente nuevamente.",
          },
        },
        { status: 500 }
      );
    }

    // 4. Not found
    if (!resident) {
      return NextResponse.json<LookupErrorResponse>(
        {
          error: {
            code: "NOT_FOUND",
            message:
              "No encontramos tu cédula. Verifica el número e intenta de nuevo.",
          },
        },
        { status: 404 }
      );
    }

    // 5. Inactive
    if (resident.status !== "active") {
      return NextResponse.json<LookupErrorResponse>(
        {
          error: {
            code: "INACTIVE",
            message:
              "Tu cuenta está inactiva. Contacta a la administración de TEPUY.",
          },
        },
        { status: 403 }
      );
    }

    // 6. Success — return public-safe fields only
    return NextResponse.json<LookupSuccessResponse>(
      { resident },
      { status: 200 }
    );
  } catch (error) {
    log("error", "Error inesperado en lookup", { error: error instanceof Error ? error.message : String(error), correlation_id: cid });
    return NextResponse.json<LookupErrorResponse>(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Error interno del servidor. Intente nuevamente.",
        },
      },
      { status: 500 }
    );
  }
}

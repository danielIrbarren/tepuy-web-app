import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { normalizeCi } from "@/lib/utils/normalize-ci";
import {
  RESIDENT_PUBLIC_FIELDS,
  type LookupErrorResponse,
  type LookupSuccessResponse,
} from "@/lib/schemas/resident";

/**
 * GET /api/residentes/lookup?ci={CI}
 *
 * Public endpoint — no auth required.
 * Uses service_role_key server-side to bypass RLS.
 * Returns only public-safe fields.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Extract and validate query param
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
      console.error("[lookup] Supabase error:", dbError.message);
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
    console.error("[lookup] Unexpected error:", error);
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

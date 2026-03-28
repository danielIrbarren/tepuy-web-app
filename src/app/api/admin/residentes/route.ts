/**
 * /api/admin/residentes
 *
 * GET  — Listar residentes con búsqueda, filtros y paginación (G-03 Gabriele)
 * POST — Crear residente nuevo (D-04 Daniel)
 *
 * Todas las rutas bajo /api/admin/* requieren cookie de sesión válida.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/adminAuth";
import {
  CreateResidentSchema,
  ListResidentsQuerySchema,
  RESIDENT_ADMIN_FIELDS,
  type AdminErrorResponse,
  type ListResidentsResponse,
  type ResidentAdmin,
} from "@/lib/schemas/admin";

// ─── GET /api/admin/residentes ────────────────────────────────────────────
// G-03 (Gabriele): listado paginado con búsqueda y filtros.
// Daniel implementa el schema pero Gabriele construye la UI sobre esto.

export async function GET(request: NextRequest) {
  // 1. Auth
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    // 2. Parsear query params con defaults
    const { searchParams } = request.nextUrl;
    const queryResult = ListResidentsQuerySchema.safeParse({
      page: searchParams.get("page") ?? 1,
      per_page: searchParams.get("per_page") ?? 25,
      search: searchParams.get("search") ?? undefined,
      residencia: searchParams.get("residencia") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json<AdminErrorResponse>(
        { error: { code: "VALIDATION_ERROR", message: queryResult.error.issues[0]?.message ?? "Parámetros inválidos." } },
        { status: 400 }
      );
    }

    const { page, per_page, search, residencia, status } = queryResult.data;
    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    // 3. Construir query con filtros opcionales
    let query = supabaseAdmin
      .from("residents")
      .select(RESIDENT_ADMIN_FIELDS, { count: "exact" });

    if (search) {
      // Búsqueda parcial por CI o nombre (ilike)
      query = query.or(
        `ci_usuario.ilike.%${search}%,nombre_usuario.ilike.%${search}%`
      );
    }

    if (residencia) {
      query = query.ilike("descripcion_inmueble", `%${residencia}%`);
    }

    if (status) {
      query = query.eq("status", status);
    }

    // 4. Paginación y orden
    const { data: residents, error, count } = await query
      .order("nombre_usuario", { ascending: true, nullsFirst: false })
      .range(from, to);

    if (error) {
      console.error("[admin/residentes GET] Supabase error:", error.message);
      return NextResponse.json<AdminErrorResponse>(
        { error: { code: "INTERNAL_ERROR", message: "Error al obtener residentes." } },
        { status: 500 }
      );
    }

    const total = count ?? 0;
    const total_pages = Math.ceil(total / per_page);

    return NextResponse.json<ListResidentsResponse>({
      residents: (residents ?? []) as ResidentAdmin[],
      total,
      page,
      per_page,
      total_pages,
    });
  } catch (err) {
    console.error("[admin/residentes GET] Unexpected error:", err);
    return NextResponse.json<AdminErrorResponse>(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor." } },
      { status: 500 }
    );
  }
}

// ─── POST /api/admin/residentes ───────────────────────────────────────────
// D-04 (Daniel): crear residente nuevo.
// Retorna 409 CI_ALREADY_EXISTS si la CI ya existe — nunca un 500.

export async function POST(request: NextRequest) {
  // 1. Auth
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    // 2. Parsear y validar body
    const body = await request.json();
    const parsed = CreateResidentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<AdminErrorResponse>(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
          },
        },
        { status: 400 }
      );
    }

    const {
      ci_usuario,
      nombre_usuario,
      tlf_usuario,
      descripcion_inmueble,
      nro_apto,
      fase,
      gerencia,
      nombre_propietario,
      ci_propietario,
      email_propietario,
      tlf_propietario,
      fecha_inicio_contrato,
    } = parsed.data;

    // 3. Insertar — la constraint UNIQUE en ci_usuario dará error 23505 si ya existe
    const { data: created, error: insertError } = await supabaseAdmin
      .from("residents")
      .insert({
        ci_usuario,
        nombre_usuario: nombre_usuario || null,
        tlf_usuario: tlf_usuario || null,
        descripcion_inmueble: descripcion_inmueble || null,
        nro_apto: nro_apto || null,
        fase: fase || null,
        gerencia: gerencia || null,
        nombre_propietario: nombre_propietario || null,
        ci_propietario: ci_propietario || null,
        email_propietario: email_propietario || null,
        tlf_propietario: tlf_propietario || null,
        fecha_inicio_contrato: fecha_inicio_contrato || null,
        status: "active",
      })
      .select(RESIDENT_ADMIN_FIELDS)
      .single();

    if (insertError) {
      // Código 23505 = unique_violation en PostgreSQL
      if (insertError.code === "23505") {
        return NextResponse.json<AdminErrorResponse>(
          {
            error: {
              code: "CI_ALREADY_EXISTS",
              message: `Ya existe un residente con la cédula ${ci_usuario}.`,
            },
          },
          { status: 409 }
        );
      }

      console.error("[admin/residentes POST] Insert error:", insertError.message);
      return NextResponse.json<AdminErrorResponse>(
        { error: { code: "INTERNAL_ERROR", message: "Error al crear el residente." } },
        { status: 500 }
      );
    }

    console.info("[admin/residentes POST] Residente creado", { ci_usuario, id: created.id });
    return NextResponse.json({ resident: created as ResidentAdmin }, { status: 201 });
  } catch (err) {
    console.error("[admin/residentes POST] Unexpected error:", err);
    return NextResponse.json<AdminErrorResponse>(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor." } },
      { status: 500 }
    );
  }
}

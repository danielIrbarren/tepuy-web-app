import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/adminAuth";
import { RESIDENT_ADMIN_FIELDS } from "@/lib/schemas/admin";

const COLUMN_MAP: Record<string, string> = {
  ci_usuario:            "Cédula de Identidad",
  nombre_usuario:        "Nombre",
  tlf_usuario:           "Teléfono",
  status:                "Estado",
  descripcion_inmueble:  "Inmueble / Residencia",
  nro_apto:              "N° Apto",
  fase:                  "Fase",
  gerencia:              "Gerencia",
  nombre_propietario:    "Nombre del Propietario",
  ci_propietario:        "CI del Propietario",
  email_propietario:     "Email del Propietario",
  tlf_propietario:       "Teléfono del Propietario",
  fecha_inicio_contrato: "Fecha Inicio de Contrato",
  email_personal:        "Email Personal",
  email_institucional:   "Email Institucional",
  supervisor_nombre:     "Nombre del Supervisor",
  supervisor_tlf:        "Teléfono del Supervisor",
  supervisor_email:      "Email del Supervisor",
  created_at:            "Fecha de Registro",
  updated_at:            "Última Actualización",
};

const COLUMN_ORDER = [
  "ci_usuario", "nombre_usuario", "tlf_usuario", "status",
  "descripcion_inmueble", "nro_apto", "fase", "gerencia",
  "nombre_propietario", "ci_propietario", "email_propietario", "tlf_propietario",
  "fecha_inicio_contrato", "email_personal", "email_institucional",
  "supervisor_nombre", "supervisor_tlf", "supervisor_email",
  "created_at", "updated_at",
];

const STATUS_LABELS: Record<string, string> = {
  active:   "Activo",
  inactive: "Inactivo",
};

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const { searchParams } = request.nextUrl;
  const search     = searchParams.get("search")     ?? undefined;
  const residencia = searchParams.get("residencia") ?? undefined;
  const status     = searchParams.get("status")     ?? undefined;

  let query = supabaseAdmin.from("residents").select(RESIDENT_ADMIN_FIELDS);

  if (search)     query = query.or(`ci_usuario.ilike.%${search}%,nombre_usuario.ilike.%${search}%`);
  if (residencia) query = query.ilike("descripcion_inmueble", `%${residencia}%`);
  if (status)     query = query.eq("status", status);

  const { data, error } = await query.order("nombre_usuario", { ascending: true, nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: "Error al obtener residentes." }, { status: 500 });
  }

  const rows = (data ?? []).map((resident) =>
    COLUMN_ORDER.reduce((row, key) => {
      const raw = (resident as Record<string, unknown>)[key];
      let value = raw == null ? "" : String(raw);
      if (key === "status") value = STATUS_LABELS[value] ?? value;
      row[COLUMN_MAP[key] ?? key] = value;
      return row;
    }, {} as Record<string, string>)
  );

  const ws = XLSX.utils.json_to_sheet(rows, { header: COLUMN_ORDER.map((k) => COLUMN_MAP[k]) });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Residentes");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const date   = new Date().toISOString().split("T")[0];
  const filename = `residentes-${date}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

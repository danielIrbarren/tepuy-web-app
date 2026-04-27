/**
 * Schemas Zod para el panel de administración de TEPUY.
 *
 * Sprint 1 — D-02: Contratos compartidos entre Daniel (APIs) y Gabriele (UI).
 * Sprint 3 — D-04: Usados en POST/PATCH /api/admin/residentes y sus modales.
 *
 * REGLA: No cambiar los shapes de estos schemas una vez Gabriele los use en UI.
 * Si se necesita un campo nuevo, AGREGAR — nunca renombrar ni eliminar.
 */

import { z } from "zod";

// ─── Helpers de validación ────────────────────────────────────────────────

/**
 * Valida formato de CI venezolana: V12345678 o E12345678.
 * Normalizado — siempre en mayúsculas, sin guiones ni puntos.
 */
const CiSchema = z
  .string()
  .min(7, "La cédula debe tener al menos 7 caracteres (ej: V1234567)")
  .max(11, "La cédula no puede exceder 11 caracteres")
  .regex(
    /^[VE]\d{6,10}$/,
    "Formato inválido. Use V seguido de 6-10 dígitos (ej: V12345678)"
  );

const PhoneSchema = z
  .string()
  .max(50, "El teléfono no puede exceder 50 caracteres")
  .regex(
    /^[\d\s\-\+\(\)]+$/,
    "El teléfono solo puede contener números, espacios, guiones y paréntesis"
  )
  .optional()
  .or(z.literal(""));

const EmailSchema = z
  .string()
  .email("Formato de email inválido")
  .max(255, "El email no puede exceder 255 caracteres")
  .optional()
  .or(z.literal(""));

// ─── Crear residente (D-04: POST /api/admin/residentes) ──────────────────

/**
 * Body que recibe POST /api/admin/residentes.
 * La CI es requerida y debe ser única — el API retorna 409 si ya existe.
 */
export const CreateResidentSchema = z.object({
  // Datos del usuario (inquilino)
  ci_usuario: CiSchema,
  nombre_usuario: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(255, "El nombre no puede exceder 255 caracteres")
    .optional()
    .or(z.literal("")),
  tlf_usuario: PhoneSchema,

  // Datos de la unidad
  descripcion_inmueble: z
    .string()
    .max(255, "La descripción no puede exceder 255 caracteres")
    .optional()
    .or(z.literal("")),
  nro_apto: z
    .string()
    .max(20, "El número de apto no puede exceder 20 caracteres")
    .optional()
    .or(z.literal("")),
  fase: z
    .string()
    .max(100, "La fase no puede exceder 100 caracteres")
    .optional()
    .or(z.literal("")),
  gerencia: z
    .string()
    .max(100, "La gerencia no puede exceder 100 caracteres")
    .optional()
    .or(z.literal("")),

  // Datos del propietario (privados — no se exponen en el portal público)
  nombre_propietario: z
    .string()
    .max(255, "El nombre no puede exceder 255 caracteres")
    .optional()
    .or(z.literal("")),
  ci_propietario: z
    .string()
    .max(20, "La CI no puede exceder 20 caracteres")
    .optional()
    .or(z.literal("")),
  email_propietario: EmailSchema,
  tlf_propietario: PhoneSchema,
  fecha_inicio_contrato: z
    .string()
    .date("Formato de fecha inválido (use YYYY-MM-DD)")
    .optional()
    .or(z.literal("")),

  // Datos del supervisor asignado (interno — se envía a Make.com en cada solicitud)
  supervisor_nombre: z
    .string()
    .max(255, "El nombre del supervisor no puede exceder 255 caracteres")
    .optional()
    .or(z.literal("")),
  supervisor_tlf: PhoneSchema,
});

export type CreateResidentBody = z.infer<typeof CreateResidentSchema>;

// ─── Editar residente (D-04: PATCH /api/admin/residentes/[id]) ───────────

/**
 * Body que recibe PATCH /api/admin/residentes/[id].
 * La CI (ci_usuario) está EXCLUIDA — no puede modificarse una vez creado el residente.
 * Todos los campos son opcionales (PATCH parcial).
 */
export const UpdateResidentSchema = CreateResidentSchema
  .omit({ ci_usuario: true }) // CI inmutable post-creación
  .partial();                  // Todos los demás campos opcionales

export type UpdateResidentBody = z.infer<typeof UpdateResidentSchema>;

// ─── Toggle status (D-04: PATCH /api/admin/residentes/[id]/status) ────────

export const UpdateResidentStatusSchema = z.object({
  status: z.enum(["active", "inactive"], {
    error: "El status debe ser 'active' o 'inactive'",
  }),
});

export type UpdateResidentStatusBody = z.infer<typeof UpdateResidentStatusSchema>;

// ─── Respuestas de la API de admin ────────────────────────────────────────

/**
 * Shape del residente que devuelven las APIs de admin.
 * Incluye TODOS los campos (incluyendo datos de propietario) — solo visible
 * para el administrador autenticado, nunca expuesto en el portal público.
 */
export const ResidentAdminSchema = z.object({
  id: z.string().uuid(),
  ci_usuario: z.string(),
  nombre_usuario: z.string().nullable(),
  tlf_usuario: z.string().nullable(),
  status: z.enum(["active", "inactive"]),
  descripcion_inmueble: z.string().nullable(),
  nro_apto: z.string().nullable(),
  fase: z.string().nullable(),
  gerencia: z.string().nullable(),
  nombre_propietario: z.string().nullable(),
  ci_propietario: z.string().nullable(),
  email_propietario: z.string().nullable(),
  tlf_propietario: z.string().nullable(),
  fecha_inicio_contrato: z.string().nullable(),
  supervisor_nombre: z.string().nullable(),
  supervisor_tlf: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ResidentAdmin = z.infer<typeof ResidentAdminSchema>;

// Campos que el admin SELECT —  todos, incluyendo datos privados del propietario
export const RESIDENT_ADMIN_FIELDS =
  "id, ci_usuario, nombre_usuario, tlf_usuario, status, descripcion_inmueble, nro_apto, fase, gerencia, nombre_propietario, ci_propietario, email_propietario, tlf_propietario, fecha_inicio_contrato, supervisor_nombre, supervisor_tlf, created_at, updated_at" as const;

// ─── Listado paginado (G-03: GET /api/admin/residentes) ──────────────────

/**
 * Parámetros de query para el listado de residentes del admin.
 * Gabriele los usa en el GET y en la UI de búsqueda/filtros.
 */
export const ListResidentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().max(100).optional(), // búsqueda parcial por CI o nombre
  residencia: z.string().max(255).optional(), // filtro exacto por descripcion_inmueble
  status: z.enum(["active", "inactive"]).optional(),
});

export type ListResidentsQuery = z.infer<typeof ListResidentsQuerySchema>;

export const ListResidentsResponseSchema = z.object({
  residents: z.array(ResidentAdminSchema),
  total: z.number().int(),
  page: z.number().int(),
  per_page: z.number().int(),
  total_pages: z.number().int(),
});

export type ListResidentsResponse = z.infer<typeof ListResidentsResponseSchema>;

// ─── Códigos de error del admin ───────────────────────────────────────────

export const AdminErrorCodes = z.enum([
  "UNAUTHORIZED",           // Sin sesión válida
  "VALIDATION_ERROR",       // Body inválido
  "CI_ALREADY_EXISTS",      // 409 al crear con CI duplicada
  "RESIDENT_NOT_FOUND",     // 404 al editar/toggle un id inexistente
  "INTERNAL_ERROR",         // 500 genérico
]);

export type AdminErrorCode = z.infer<typeof AdminErrorCodes>;

export const AdminErrorResponseSchema = z.object({
  error: z.object({
    code: AdminErrorCodes,
    message: z.string(),
  }),
});

export type AdminErrorResponse = z.infer<typeof AdminErrorResponseSchema>;

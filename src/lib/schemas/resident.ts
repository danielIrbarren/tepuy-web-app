import { z } from "zod";

// --- Enums ---

export const ResidentStatus = z.enum(["active", "inactive"]);
export type ResidentStatus = z.infer<typeof ResidentStatus>;

// --- Lookup Request ---

export const CiQuerySchema = z
  .string()
  .min(6, "La cédula debe tener al menos 6 caracteres")
  .max(15, "La cédula no puede exceder 15 caracteres")
  .regex(
    /^[VvEe]?[-.]?\d[\d.\- ]*$/,
    "Formato de cédula inválido"
  );

// --- Lookup Response (public-safe fields only) ---

export const ResidentPublicSchema = z.object({
  id: z.string().uuid(),
  ci_usuario: z.string(),
  nombre_usuario: z.string().nullable(),
  tlf_usuario: z.string().nullable(),
  status: ResidentStatus,
  descripcion_inmueble: z.string().nullable(),
  nro_apto: z.string().nullable(),
  fase: z.string().nullable(),
  gerencia: z.string().nullable(),
  supervisor_nombre: z.string().nullable(),
  supervisor_tlf: z.string().nullable(),
});

export type ResidentPublic = z.infer<typeof ResidentPublicSchema>;

// Fields that the lookup endpoint selects from the DB
// Explicitly excludes: email_propietario, tlf_propietario, ci_propietario, nombre_propietario, fecha_inicio_contrato
export const RESIDENT_PUBLIC_FIELDS =
  "id, ci_usuario, nombre_usuario, tlf_usuario, status, descripcion_inmueble, nro_apto, fase, gerencia, supervisor_nombre, supervisor_tlf" as const;

// --- API Error Response ---

export const LookupErrorCodes = z.enum([
  "INVALID_CI",
  "NOT_FOUND",
  "INACTIVE",
  "INTERNAL_ERROR",
  "RATE_LIMITED", // D-02: 429 cuando se supera el límite de requests por IP
]);

export type LookupErrorCode = z.infer<typeof LookupErrorCodes>;

export const LookupErrorResponseSchema = z.object({
  error: z.object({
    code: LookupErrorCodes,
    message: z.string(),
  }),
});

export type LookupErrorResponse = z.infer<typeof LookupErrorResponseSchema>;

// --- API Success Response ---

export const LookupSuccessResponseSchema = z.object({
  resident: ResidentPublicSchema,
});

export type LookupSuccessResponse = z.infer<typeof LookupSuccessResponseSchema>;

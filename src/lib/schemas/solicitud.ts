import { z } from "zod";

// --- Work Area Enum ---
// These are the maintenance categories available in TEPUY.
// Must match the work_area_type enum that Daniel creates in DB (D-01).

export const WorkArea = z.enum([
  "plomeria",
  "electricidad",
  "pintura",
  "carpinteria",
  "cerrajeria",
  "aire_acondicionado",
  "albanileria",
  "impermeabilizacion",
  "vidrieria",
  "limpieza",
  "jardineria",
  "otro",
]);

export type WorkArea = z.infer<typeof WorkArea>;

// Display labels for the UI
export const WORK_AREA_LABELS: Record<WorkArea, string> = {
  plomeria: "Plomería",
  electricidad: "Electricidad",
  pintura: "Pintura",
  carpinteria: "Carpintería",
  cerrajeria: "Cerrajería",
  aire_acondicionado: "Aire Acondicionado",
  albanileria: "Albañilería",
  impermeabilizacion: "Impermeabilización",
  vidrieria: "Vidriería",
  limpieza: "Limpieza",
  jardineria: "Jardinería",
  otro: "Otro",
};

// --- Create Solicitud Body (what the frontend sends) ---

export const CreateSolicitudBodySchema = z.object({
  resident_id: z.string().uuid("ID de residente inválido"),
  work_area: WorkArea,
  description: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(1000, "La descripción no puede exceder 1000 caracteres"),
  preferred_time: z
    .string()
    .max(100, "El horario no puede exceder 100 caracteres")
    .optional()
    .or(z.literal("")),
  access_notes: z
    .string()
    .max(300, "Las notas de acceso no pueden exceder 300 caracteres")
    .optional()
    .or(z.literal("")),
});

export type CreateSolicitudBody = z.infer<typeof CreateSolicitudBodySchema>;

// --- Create Solicitud Response ---

export const CreateSolicitudResponseSchema = z.object({
  request_id: z.string().uuid(),
  status: z.string(),
  task_url: z.string().nullable().optional(),
});

export type CreateSolicitudResponse = z.infer<
  typeof CreateSolicitudResponseSchema
>;

// --- Solicitud Error Response ---

export const SolicitudErrorCodes = z.enum([
  "VALIDATION_ERROR",
  "RESIDENT_NOT_FOUND",
  "RESIDENT_INACTIVE",
  "INTERNAL_ERROR",
]);

export type SolicitudErrorCode = z.infer<typeof SolicitudErrorCodes>;

export const SolicitudErrorResponseSchema = z.object({
  error: z.object({
    code: SolicitudErrorCodes,
    message: z.string(),
  }),
});

export type SolicitudErrorResponse = z.infer<
  typeof SolicitudErrorResponseSchema
>;

/**
 * Validación de archivos de imagen para el endpoint de subida.
 *
 * Función pura (sin I/O) para poder testearla sin red ni Storage. El endpoint
 * /api/solicitudes/upload la usa como guarda antes de subir a Supabase Storage.
 *
 * Reglas:
 *   - entre 1 y MAX_FILES archivos
 *   - cada uno <= MAX_BYTES
 *   - tipo en ALLOWED_TYPES (las fotos ya vienen comprimidas a JPEG en el cliente)
 */

export const MAX_FILES = 5;
export const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type UploadCandidate = { type: string; size: number };

export type ValidationResult = { ok: true } | { ok: false; error: string };

export function validateUploadFiles(files: UploadCandidate[]): ValidationResult {
  if (files.length === 0) {
    return { ok: false, error: "No se recibió ninguna imagen." };
  }
  if (files.length > MAX_FILES) {
    return { ok: false, error: `Máximo ${MAX_FILES} imágenes.` };
  }
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
      return { ok: false, error: "Formato no permitido. Usa JPG, PNG o WebP." };
    }
    if (file.size > MAX_BYTES) {
      return { ok: false, error: "Cada imagen debe pesar menos de 2 MB." };
    }
  }
  return { ok: true };
}

/**
 * Compresión de imágenes en el cliente, sin dependencias (canvas nativo).
 *
 * Reduce las fotos del celular (3-8 MB) a ~1 MB JPEG antes de subir, para que
 * la subida sea rápida en red móvil y entre en el límite de WhatsApp. Re-encodear
 * en canvas borra el EXIF (incluida la ubicación GPS) como efecto colateral útil.
 *
 * Solo corre en el navegador (usa createImageBitmap + canvas). No testeable en
 * el entorno node de vitest — se valida vía E2E/manual.
 *
 *   foto 4032x3024 (5MB)  ──►  1600x1200 JPEG q0.8 (~0.9MB)
 */

export interface CompressOptions {
  /** Lado máximo (px). La imagen se escala manteniendo proporción. */
  maxDimension?: number;
  /** Calidad JPEG 0..1. */
  quality?: number;
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<Blob> {
  const maxDimension = options.maxDimension ?? 1600;
  const quality = options.quality ?? 0.8;

  // createImageBitmap decodifica JPEG/PNG/WebP y, en Safari, también HEIC de iPhone.
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("No se pudo leer la imagen. Prueba con otra foto.");
  }

  let { width, height } = bitmap;
  if (width > maxDimension || height > maxDimension) {
    const scale = Math.min(maxDimension / width, maxDimension / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("No se pudo procesar la imagen.");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
  if (!blob) {
    throw new Error("No se pudo comprimir la imagen.");
  }
  return blob;
}

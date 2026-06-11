import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkUploadRateLimit, getClientIp } from "@/lib/rate-limit";
import { validateUploadFiles } from "@/lib/images/upload-validation";
import { log, getCorrelationId } from "@/lib/logger";

/**
 * POST /api/solicitudes/upload
 *
 * Recibe 1..5 fotos (multipart/form-data, campo "files") y las sube al bucket
 * público `solicitud-images`. Devuelve las URLs públicas para que el formulario
 * las incluya luego en POST /api/solicitudes.
 *
 * Diseño: subida progresiva (el residente sube mientras llena el formulario),
 * así el envío final solo manda texto + URLs y no arriesga timeout en red lenta.
 *
 * Protección: rate limit por IP + validación de tipo/tamaño/cantidad. No se ata
 * a un residente — la verificación de fondo la hace el flujo de Make.
 */

const BUCKET = "solicitud-images";

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: NextRequest) {
  const cid = getCorrelationId(request);

  try {
    // 1. Rate limit por IP
    const ip = getClientIp(request);
    const { success: rateLimitOk, reset } = await checkUploadRateLimit(ip);
    if (!rateLimitOk) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Demasiadas subidas. Espera un momento." } },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    // 2. Parsear multipart. Si el cuerpo no es multipart válido, formData()
    //    lanza — lo tratamos como "sin imágenes" para devolver un 400 limpio
    //    (no un 500) vía la validación de abajo.
    let files: File[] = [];
    try {
      const formData = await request.formData();
      files = formData.getAll("files").filter((f): f is File => f instanceof File);
    } catch {
      // cuerpo ausente o no multipart → files queda vacío
    }

    // 3. Validar (función pura testeada)
    const validation = validateUploadFiles(files.map((f) => ({ type: f.type, size: f.size })));
    if (!validation.ok) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: validation.error } },
        { status: 400 }
      );
    }

    // 4. Subir cada foto con nombre UUID imposible de adivinar
    const urls: string[] = [];
    for (const file of files) {
      const ext = EXT_BY_TYPE[file.type] ?? "jpg";
      const path = `${randomUUID()}.${ext}`;
      const bytes = new Uint8Array(await file.arrayBuffer());

      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(path, bytes, { contentType: file.type, upsert: false });

      if (uploadError) {
        log("error", "Error subiendo foto a Storage", { error: uploadError.message, correlation_id: cid });
        return NextResponse.json(
          { error: { code: "UPLOAD_ERROR", message: "No se pudo subir la imagen. Intenta de nuevo." } },
          { status: 502 }
        );
      }

      const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
      urls.push(data.publicUrl);
    }

    log("info", "Fotos subidas", { count: urls.length, correlation_id: cid });
    return NextResponse.json({ urls }, { status: 201 });
  } catch (error) {
    log("error", "Error inesperado en upload", {
      error: error instanceof Error ? error.message : String(error),
      correlation_id: cid,
    });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor." } },
      { status: 500 }
    );
  }
}

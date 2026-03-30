/**
 * Logging estructurado para TEPUY.
 *
 * Sprint 4 — D-06: Reemplaza console.info/error sueltos con JSON
 * estructurado que incluye timestamp, nivel, y correlation_id cuando
 * está disponible (inyectado por el middleware via X-Correlation-Id).
 *
 * En Vercel, cada línea JSON aparece como un log entry individual
 * filtrable por nivel y campos en el dashboard de Functions.
 */

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  msg: string;
  ts: string;
  correlation_id?: string;
  [key: string]: unknown;
}

function emit(entry: LogEntry) {
  const json = JSON.stringify(entry);
  switch (entry.level) {
    case "error":
      console.error(json);
      break;
    case "warn":
      console.warn(json);
      break;
    default:
      console.info(json);
  }
}

/**
 * Emite un log estructurado.
 *
 * @param level - Nivel del log
 * @param msg - Mensaje descriptivo (ej: "Webhook completado")
 * @param data - Campos adicionales (ej: { request_id, status })
 *
 * @example
 *   log("info", "Lookup exitoso", { ci: "V12345678", correlation_id: cid });
 *   log("error", "Supabase error", { error: err.message });
 */
export function log(
  level: LogLevel,
  msg: string,
  data?: Record<string, unknown>
) {
  emit({
    level,
    msg,
    ts: new Date().toISOString(),
    ...data,
  });
}

/**
 * Extrae el correlation ID del request (inyectado por middleware).
 * Helper de conveniencia para no repetir el header name en cada handler.
 */
export function getCorrelationId(request: Request): string | undefined {
  return request.headers.get("x-correlation-id") ?? undefined;
}

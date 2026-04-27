/**
 * Retry logic para webhooks fallidos de TEPUY.
 *
 * Sprint 3 — D-05: Reintenta automáticamente los webhooks que fallaron
 * con backoff exponencial según el retry_count actual.
 *
 * Backoff según spec del HTML:
 *   retry_count = 0 → esperar 5 min antes de reintentar
 *   retry_count = 1 → esperar 15 min
 *   retry_count = 2 → esperar 1 hora
 *   retry_count >= 3 → webhook_status = 'failed' permanente — no más reintentos
 *
 * Esta función es invocada por el cron job en /api/cron/retry-webhooks.
 */

import { supabaseAdmin } from "@/lib/supabase/server";
import { triggerMakeWebhook, type MakeWebhookPayload } from "@/lib/webhooks/make";
import { log } from "@/lib/logger";

// ─── Backoff según retry_count ────────────────────────────────────────────

const BACKOFF_MS: Record<number, number> = {
  0: 5 * 60 * 1000,   // 5 minutos
  1: 15 * 60 * 1000,  // 15 minutos
  2: 60 * 60 * 1000,  // 1 hora
};

const MAX_RETRIES = 3;

// ─── Función principal ────────────────────────────────────────────────────

export interface RetryResult {
  processed: number;
  succeeded: number;
  failed_permanently: number;
  errors: string[];
}

/**
 * Busca solicitudes con webhook_status=failed y retry_count < 3,
 * filtrando por el tiempo de backoff apropiado, y las reintenta.
 *
 * @returns Resumen de la ejecución del cron
 */
export async function retryFailedWebhooks(): Promise<RetryResult> {
  const result: RetryResult = {
    processed: 0,
    succeeded: 0,
    failed_permanently: 0,
    errors: [],
  };

  log("info", "Iniciando ciclo de retry");

  try {
    // Obtener solicitudes fallidas elegibles para retry
    // Filtramos por updated_at + backoff para no reintentar demasiado pronto
    const now = new Date();

    const { data: failedRequests, error: fetchError } = await supabaseAdmin
      .from("maintenance_requests")
      .select(
        "id, request_id:id, ci_usuario, nombre_usuario, nro_apto, descripcion_inmueble, tlf_usuario, gerencia, supervisor_nombre, supervisor_tlf, work_area, criticality, description, created_at, retry_count, updated_at"
      )
      .eq("webhook_status", "failed")
      .lt("retry_count", MAX_RETRIES)
      .order("updated_at", { ascending: true })
      .limit(50); // Procesar máximo 50 por ciclo para no saturar

    if (fetchError) {
      log("error", "Error obteniendo solicitudes para retry", { error: fetchError.message });
      result.errors.push(fetchError.message);
      return result;
    }

    if (!failedRequests || failedRequests.length === 0) {
      log("info", "Sin solicitudes pendientes de retry");
      return result;
    }

    log("info", "Solicitudes candidatas para retry", { count: failedRequests.length });

    // Procesar cada solicitud elegible
    for (const req of failedRequests) {
      const retryCount = req.retry_count as number;
      const updatedAt = new Date(req.updated_at as string);
      const backoffMs = BACKOFF_MS[retryCount] ?? BACKOFF_MS[2];
      const eligibleAt = new Date(updatedAt.getTime() + backoffMs);

      // Verificar si ya pasó el tiempo de backoff
      if (now < eligibleAt) {
        const waitMinutes = Math.ceil((eligibleAt.getTime() - now.getTime()) / 60000);
        log("info", "Solicitud aún en backoff", { request_id: req.id, wait_minutes: waitMinutes, retry_count: retryCount });
        continue;
      }

      result.processed++;

      // Incrementar retry_count antes de intentar (para tracking)
      const newRetryCount = retryCount + 1;

      const payload: MakeWebhookPayload = {
        request_id: req.id as string,
        ci_usuario: req.ci_usuario as string,
        nombre_usuario: req.nombre_usuario as string | null,
        nro_apto: req.nro_apto as string | null,
        descripcion_inmueble: req.descripcion_inmueble as string | null,
        tlf_usuario: req.tlf_usuario as string | null,
        gerencia: req.gerencia as string | null,
        supervisor_nombre: req.supervisor_nombre as string | null,
        supervisor_tlf: req.supervisor_tlf as string | null,
        work_area: req.work_area as string,
        criticality: req.criticality as "urgente" | "importante",
        description: req.description as string,
        created_at: req.created_at as string,
      };

      try {
        const webhookResult = await triggerMakeWebhook(payload);

        if (webhookResult.status === "skipped") {
          log("warn", "Retry omitido", { request_id: req.id, reason: webhookResult.reason });
          continue;
        }

        if (webhookResult.status === "sent") {
          // Webhook exitoso; taskUrl puede ser null si Make no devuelve URL pero respondió 2xx
          await supabaseAdmin
            .from("maintenance_requests")
            .update({
              webhook_status: "sent",
              external_reference: webhookResult.taskUrl,
              retry_count: newRetryCount,
            })
            .eq("id", req.id);

          result.succeeded++;
          log("info", "Retry exitoso", { request_id: req.id, retry_count: newRetryCount });
        } else {
          throw new Error(
            webhookResult.reason ??
              "Make.com no confirmó recepción del webhook"
          );
        }
      } catch (webhookErr) {
        const errMsg = webhookErr instanceof Error ? webhookErr.message : String(webhookErr);

        if (newRetryCount >= MAX_RETRIES) {
          // Máximo de reintentos alcanzado — marcar como fallido permanente
          await supabaseAdmin
            .from("maintenance_requests")
            .update({
              webhook_status: "failed",
              retry_count: newRetryCount,
            })
            .eq("id", req.id);

          result.failed_permanently++;
          log("error", "Fallo permanente", { request_id: req.id, retry_count: newRetryCount });
        } else {
          // Aún quedan reintentos — incrementar contador y mantener failed
          await supabaseAdmin
            .from("maintenance_requests")
            .update({ retry_count: newRetryCount })
            .eq("id", req.id);

          result.errors.push(`${req.id}: ${errMsg}`);
          log("warn", "Retry falló, quedan intentos", { request_id: req.id, retry_count: newRetryCount, remaining: MAX_RETRIES - newRetryCount });
        }
      }
    }

    log("info", "Ciclo de retry completado", { ...result });
    return result;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    log("error", "Error fatal en ciclo de retry", { error: errMsg });
    result.errors.push(errMsg);
    return result;
  }
}

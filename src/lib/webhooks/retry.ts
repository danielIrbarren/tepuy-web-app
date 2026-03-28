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

  console.info("[retry-webhooks] Iniciando ciclo de retry");

  try {
    // Obtener solicitudes fallidas elegibles para retry
    // Filtramos por updated_at + backoff para no reintentar demasiado pronto
    const now = new Date();

    const { data: failedRequests, error: fetchError } = await supabaseAdmin
      .from("maintenance_requests")
      .select(
        "id, request_id:id, ci_usuario, nombre_usuario, nro_apto, descripcion_inmueble, tlf_usuario, gerencia, work_area, description, preferred_time, access_notes, created_at, retry_count, updated_at"
      )
      .eq("webhook_status", "failed")
      .lt("retry_count", MAX_RETRIES)
      .order("updated_at", { ascending: true })
      .limit(50); // Procesar máximo 50 por ciclo para no saturar

    if (fetchError) {
      console.error("[retry-webhooks] Error obteniendo solicitudes:", fetchError.message);
      result.errors.push(fetchError.message);
      return result;
    }

    if (!failedRequests || failedRequests.length === 0) {
      console.info("[retry-webhooks] Sin solicitudes pendientes de retry");
      return result;
    }

    console.info(`[retry-webhooks] ${failedRequests.length} solicitudes candidatas`);

    // Procesar cada solicitud elegible
    for (const req of failedRequests) {
      const retryCount = req.retry_count as number;
      const updatedAt = new Date(req.updated_at as string);
      const backoffMs = BACKOFF_MS[retryCount] ?? BACKOFF_MS[2];
      const eligibleAt = new Date(updatedAt.getTime() + backoffMs);

      // Verificar si ya pasó el tiempo de backoff
      if (now < eligibleAt) {
        const waitMinutes = Math.ceil((eligibleAt.getTime() - now.getTime()) / 60000);
        console.info(`[retry-webhooks] ${req.id} — esperar ${waitMinutes}min más (retry_count=${retryCount})`);
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
        work_area: req.work_area as string,
        description: req.description as string,
        preferred_time: req.preferred_time as string | null,
        access_notes: req.access_notes as string | null,
        created_at: req.created_at as string,
      };

      try {
        const taskUrl = await triggerMakeWebhook(payload);

        if (taskUrl !== null || process.env.MAKE_WEBHOOK_URL) {
          // Webhook exitoso (taskUrl puede ser null si Make no devuelve URL pero respondió 2xx)
          await supabaseAdmin
            .from("maintenance_requests")
            .update({
              webhook_status: "sent",
              external_reference: taskUrl,
              retry_count: newRetryCount,
            })
            .eq("id", req.id);

          result.succeeded++;
          console.info(`[retry-webhooks] ✅ ${req.id} — reintento ${newRetryCount} exitoso`);
        } else if (!process.env.MAKE_WEBHOOK_URL) {
          // MAKE_WEBHOOK_URL no configurado — skip sin contar como fallo permanente
          console.warn(`[retry-webhooks] MAKE_WEBHOOK_URL no configurado — skip ${req.id}`);
        } else {
          throw new Error("triggerMakeWebhook retornó null con URL configurada");
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
          console.error(`[retry-webhooks] ❌ ${req.id} — fallo permanente tras ${newRetryCount} intentos`);
        } else {
          // Aún quedan reintentos — incrementar contador y mantener failed
          await supabaseAdmin
            .from("maintenance_requests")
            .update({ retry_count: newRetryCount })
            .eq("id", req.id);

          result.errors.push(`${req.id}: ${errMsg}`);
          console.error(`[retry-webhooks] ⚠️  ${req.id} — intento ${newRetryCount} falló, quedan ${MAX_RETRIES - newRetryCount} intentos`);
        }
      }
    }

    console.info("[retry-webhooks] Ciclo completado", result);
    return result;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[retry-webhooks] Error fatal en el ciclo:", errMsg);
    result.errors.push(errMsg);
    return result;
  }
}

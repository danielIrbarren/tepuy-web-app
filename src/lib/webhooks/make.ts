/**
 * Integración con Make.com (ex Integromat) para TEPUY.
 *
 * Sprint 2 — D-03: Dispara el webhook a Make.com después de insertar
 * una solicitud de mantenimiento. Fire-and-forget — no bloquea el response
 * al usuario.
 *
 * El escenario Make.com:
 *   Custom Webhook → ClickUp Create Task → Airtable Create Record → Response
 *
 * Retorna el task_url de ClickUp si Make.com lo devuelve en la respuesta,
 * null si falla o no está configurado. El fallo del webhook NUNCA
 * debe llegar al usuario — la solicitud queda guardada con webhook_status=failed.
 */

// ─── Payload que se envía a Make.com ─────────────────────────────────────

export interface MakeWebhookPayload {
  request_id: string;
  // Datos del residente (desnormalizados en el momento del submit)
  ci_usuario: string;
  nombre_usuario: string | null;
  nro_apto: string | null;
  descripcion_inmueble: string | null;
  tlf_usuario: string | null;
  gerencia: string | null;
  // Datos de la solicitud
  work_area: string;
  criticality: "urgente" | "importante";
  description: string;
  preferred_time: string | null;
  access_notes: string | null;
  // Metadatos
  created_at: string;
}

// ─── Respuesta esperada de Make.com ──────────────────────────────────────

interface MakeWebhookResponse {
  task_url?: string;  // URL de la tarea en ClickUp (si Make la devuelve)
  task_id?: string;   // ID interno de ClickUp (opcional)
}

import { log } from "@/lib/logger";

export interface MakeWebhookResult {
  status: "sent" | "failed" | "skipped";
  taskUrl: string | null;
  reason?: string;
}

// ─── Función principal ───────────────────────────────────────────────────

/**
 * Dispara el webhook a Make.com con el payload de la solicitud.
 *
 * @returns estado del intento; "sent" solo cuando Make.com respondió 2xx.
 */
export async function triggerMakeWebhook(
  payload: MakeWebhookPayload
): Promise<MakeWebhookResult> {
  const webhookUrl = process.env.MAKE_WEBHOOK_URL;

  if (!webhookUrl) {
    log("warn", "MAKE_WEBHOOK_URL no configurado — webhook omitido", { request_id: payload.request_id });
    return {
      status: "skipped",
      taskUrl: null,
      reason: "MAKE_WEBHOOK_URL no configurado",
    };
  }

  const controller = new AbortController();
  // Timeout de 10 segundos como especifica D-03
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    log("info", "Disparando webhook Make.com", { request_id: payload.request_id, work_area: payload.work_area, criticality: payload.criticality });

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Header de identificación para Make.com
        "X-Tepuy-Source": "tepuy-web-app",
        "X-Tepuy-Request-Id": payload.request_id,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      log("error", "Make.com respondió con error", { request_id: payload.request_id, status: response.status, statusText: response.statusText });
      return {
        status: "failed",
        taskUrl: null,
        reason: `Make.com respondió ${response.status} ${response.statusText}`,
      };
    }

    // Make.com puede responder con JSON vacío o con datos de la tarea
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      log("info", "Webhook recibido sin task_url", { request_id: payload.request_id });
      return {
        status: "sent",
        taskUrl: null,
      };
    }

    const data: MakeWebhookResponse = await response.json();
    const taskUrl = data?.task_url ?? null;

    log("info", "Webhook exitoso", { request_id: payload.request_id, task_url: taskUrl });

    return {
      status: "sent",
      taskUrl,
    };
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof Error && err.name === "AbortError") {
      log("error", "Webhook timeout después de 10s", { request_id: payload.request_id });
      return {
        status: "failed",
        taskUrl: null,
        reason: "Timeout después de 10s",
      };
    } else {
      log("error", "Webhook error de red", { request_id: payload.request_id, error: err instanceof Error ? err.message : String(err) });
      return {
        status: "failed",
        taskUrl: null,
        reason: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

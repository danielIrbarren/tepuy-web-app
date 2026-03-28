/**
 * GET /api/cron/retry-webhooks
 *
 * Sprint 3 — D-05: Cron job de Vercel que ejecuta el retry de webhooks fallidos.
 *
 * Configuración en vercel.json:
 *   Crons: path=/api/cron/retry-webhooks, schedule= every 15 minutes (vercel.json)
 *
 * El endpoint verifica el header Authorization con CRON_SECRET para evitar
 * que cualquiera lo invoque manualmente en producción.
 *
 * Seguridad:
 * - En producción Vercel inyecta automáticamente el header con el CRON_SECRET
 * - Si CRON_SECRET no está configurado, solo acepta requests de localhost
 */

import { NextRequest, NextResponse } from "next/server";
import { retryFailedWebhooks } from "@/lib/webhooks/retry";

export async function GET(request: NextRequest) {
  // Verificar que la llamada viene de Vercel Cron o de un entorno autorizado
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    // En producción: verificar el secret
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
  } else {
    // Sin CRON_SECRET configurado: solo permitir desde localhost
    const host = request.headers.get("host") ?? "";
    const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
    if (!isLocal) {
      return NextResponse.json(
        { error: "CRON_SECRET not configured — endpoint restricted to localhost" },
        { status: 401 }
      );
    }
  }

  const startTime = Date.now();

  try {
    const result = await retryFailedWebhooks();

    const duration = Date.now() - startTime;

    console.info("[cron/retry-webhooks] Ejecución completada", {
      ...result,
      duration_ms: duration,
    });

    return NextResponse.json({
      ok: true,
      duration_ms: duration,
      ...result,
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error("[cron/retry-webhooks] Error fatal:", err);

    return NextResponse.json(
      {
        ok: false,
        duration_ms: duration,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

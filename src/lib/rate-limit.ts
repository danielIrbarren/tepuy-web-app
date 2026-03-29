/**
 * Rate limiting para endpoints públicos de TEPUY.
 *
 * Sprint 1 — D-02: slidingWindow(10, "60 s") por IP.
 * El request 11 desde la misma IP en 1 minuto recibe 429 con Retry-After.
 *
 * Usa Upstash Redis si las variables de entorno están configuradas.
 * Si NO están configuradas (dev local sin cuenta Upstash), cae en un
 * fallback en memoria que cumple el mismo contrato — útil para tests locales.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ─── Upstash (producción / staging) ────────────────────────────────────────

function createUpstashLimiter() {
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    analytics: true,
    prefix: "tepuy:lookup",
  });
}

// ─── Fallback en memoria (dev sin Upstash configurado) ────────────────────

/**
 * Implementación mínima del mismo contrato { success, limit, remaining, reset }
 * usando un Map en memoria anclado a globalThis para sobrevivir hot-reloads de
 * Turbopack/Webpack en desarrollo. Se resetea al reiniciar el servidor.
 * SOLO para desarrollo local — en producción siempre usa Upstash.
 */

// Anclar el store en globalThis para que sobreviva hot-reloads de Next.js dev
declare global {
  var __tepuy_ratelimit_store: Map<string, { count: number; resetAt: number }> | undefined;
}

const inMemoryStore: Map<string, { count: number; resetAt: number }> =
  globalThis.__tepuy_ratelimit_store ??
  (globalThis.__tepuy_ratelimit_store = new Map());

const IN_MEMORY_WINDOW_MS = 60_000; // 60 segundos
const IN_MEMORY_LIMIT = 10;

async function inMemoryLimit(
  key: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const now = Date.now();
  const entry = inMemoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    // Primera request o ventana expirada — resetear contador
    inMemoryStore.set(key, { count: 1, resetAt: now + IN_MEMORY_WINDOW_MS });
    return {
      success: true,
      limit: IN_MEMORY_LIMIT,
      remaining: IN_MEMORY_LIMIT - 1,
      reset: now + IN_MEMORY_WINDOW_MS,
    };
  }

  entry.count += 1;
  const remaining = Math.max(0, IN_MEMORY_LIMIT - entry.count);
  const success = entry.count <= IN_MEMORY_LIMIT;

  return {
    success,
    limit: IN_MEMORY_LIMIT,
    remaining,
    reset: entry.resetAt,
  };
}

// ─── Instancia lazy — no falla en build si faltan vars ────────────────────

let _upstashLimiter: Ratelimit | null = null;

function getUpstashLimiter(): Ratelimit | null {
  if (_upstashLimiter) return _upstashLimiter;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  try {
    _upstashLimiter = createUpstashLimiter();
    return _upstashLimiter;
  } catch {
    return null;
  }
}

// ─── API pública ────────────────────────────────────────────────────────────

export interface RateLimitResult {
  success: boolean;
  /** Límite máximo de requests en la ventana */
  limit: number;
  /** Requests restantes en la ventana actual */
  remaining: number;
  /** Timestamp (ms) en que se resetea la ventana */
  reset: number;
}

/**
 * Aplica rate limiting a un identificador (generalmente la IP del cliente).
 *
 * @param identifier - IP u otro identificador único del cliente
 * @returns RateLimitResult con success=false si se superó el límite
 */
export async function checkRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  const upstash = getUpstashLimiter();

  if (upstash) {
    // Producción: Upstash Redis distribuido
    return upstash.limit(identifier);
  }

  // Dev fallback: en memoria
  console.warn(
    "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN no configurados — usando fallback en memoria"
  );
  return inMemoryLimit(identifier);
}

/**
 * Extrae la IP real del cliente de los headers de Next.js / Vercel.
 * Vercel inyecta x-forwarded-for con la IP original antes del proxy.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for puede tener múltiples IPs separadas por coma
    // La primera es siempre la del cliente original
    return forwarded.split(",")[0].trim();
  }
  // Fallback para entornos locales sin proxy
  return "anonymous";
}

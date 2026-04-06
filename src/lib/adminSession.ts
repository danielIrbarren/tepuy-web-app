import { compare } from "bcryptjs";
import { randomUUID } from "crypto";
import type { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const ADMIN_SESSION_COOKIE = "tepuy_admin_session";
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 horas

type AdminSessionRow = {
  id: string;
  expires_at: string;
};

export type AdminSessionLookupResult =
  | { status: "valid"; session: AdminSessionRow }
  | { status: "invalid" }
  | { status: "expired"; session: AdminSessionRow };

type PasswordVerificationResult =
  | {
      ok: true;
      hashSource: "raw" | "base64";
      normalizedHash: string;
      usedNormalization: boolean;
      hadWrappingQuotes: boolean;
      hadEscapedDollars: boolean;
      hasEmbeddedQuotes: boolean;
      backslashCount: number;
      looksLikeBcrypt: boolean;
      rawLength: number;
      normalizedLength: number;
    }
  | {
      ok: false;
      reason: "MISSING_HASH" | "INVALID_HASH_ENCODING" | "INVALID_PASSWORD";
      hashSource?: "raw" | "base64";
      normalizedHash?: string;
      usedNormalization?: boolean;
      hadWrappingQuotes?: boolean;
      hadEscapedDollars?: boolean;
      hasEmbeddedQuotes?: boolean;
      backslashCount?: number;
      looksLikeBcrypt?: boolean;
      rawLength?: number;
      normalizedLength?: number;
    };

function getSessionCookieBaseOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

export function normalizeAdminPasswordHash(rawHash: string) {
  let normalized = rawHash.trim();

  // Handle env providers that serialize secrets as JSON strings.
  if (normalized.startsWith('"') && normalized.endsWith('"')) {
    try {
      const parsed = JSON.parse(normalized);
      if (typeof parsed === "string") {
        normalized = parsed.trim();
      }
    } catch {
      // Fall through to quote stripping below.
    }
  }

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1);
  }

  normalized = normalized.replace(/\\+\$/g, "$");

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }

  return normalized;
}

function decodeAdminPasswordHashBase64(encodedHash: string) {
  const trimmed = encodedHash.trim();

  if (!trimmed) {
    return null;
  }

  const decoded = Buffer.from(trimmed, "base64").toString("utf8");

  if (!decoded) {
    return null;
  }

  const canonical = Buffer.from(decoded, "utf8")
    .toString("base64")
    .replace(/=+$/g, "");
  const normalizedInput = trimmed.replace(/\s+/g, "").replace(/=+$/g, "");

  if (canonical !== normalizedInput) {
    return null;
  }

  return decoded;
}

function getConfiguredAdminPasswordHash(
  rawHash = process.env.ADMIN_PASSWORD_HASH,
  base64Hash = process.env.ADMIN_PASSWORD_HASH_B64
) {
  if (base64Hash) {
    const decodedHash = decodeAdminPasswordHashBase64(base64Hash);

    if (!decodedHash) {
      return { status: "invalid-base64" as const };
    }

    return {
      status: "ok" as const,
      hashSource: "base64" as const,
      rawHash: decodedHash,
    };
  }

  if (!rawHash) {
    return { status: "missing" as const };
  }

  return {
    status: "ok" as const,
    hashSource: "raw" as const,
    rawHash,
  };
}

export async function verifyAdminPassword(
  password: string,
  rawHash = process.env.ADMIN_PASSWORD_HASH,
  base64Hash = process.env.ADMIN_PASSWORD_HASH_B64
): Promise<PasswordVerificationResult> {
  const configuredHash = getConfiguredAdminPasswordHash(rawHash, base64Hash);

  if (configuredHash.status === "missing") {
    return { ok: false, reason: "MISSING_HASH" };
  }

  if (configuredHash.status === "invalid-base64") {
    return {
      ok: false,
      reason: "INVALID_HASH_ENCODING",
      hashSource: "base64",
    };
  }

  const normalizedHash = normalizeAdminPasswordHash(configuredHash.rawHash);
  const usedNormalization = normalizedHash !== configuredHash.rawHash;
  const hadWrappingQuotes = /^["'].*["']$/.test(configuredHash.rawHash.trim());
  const hadEscapedDollars = configuredHash.rawHash.includes("\\$");
  const hasEmbeddedQuotes =
    normalizedHash.includes('"') || normalizedHash.includes("'");
  const backslashCount = (configuredHash.rawHash.match(/\\/g) ?? []).length;
  const looksLikeBcrypt = /^\$2[abxy]\$\d{2}\$/.test(normalizedHash);
  const isValid = await compare(password, normalizedHash);

  if (!isValid) {
    return {
      ok: false,
      reason: "INVALID_PASSWORD",
      hashSource: configuredHash.hashSource,
      normalizedHash,
      usedNormalization,
      hadWrappingQuotes,
      hadEscapedDollars,
      hasEmbeddedQuotes,
      backslashCount,
      looksLikeBcrypt,
      rawLength: configuredHash.rawHash.length,
      normalizedLength: normalizedHash.length,
    };
  }

  return {
    ok: true,
    hashSource: configuredHash.hashSource,
    normalizedHash,
    usedNormalization,
    hadWrappingQuotes,
    hadEscapedDollars,
    hasEmbeddedQuotes,
    backslashCount,
    looksLikeBcrypt,
    rawLength: configuredHash.rawHash.length,
    normalizedLength: normalizedHash.length,
  };
}

export async function createAdminSession() {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const { error } = await supabaseAdmin
    .from("admin_sessions")
    .insert({
      session_token: token,
      expires_at: expiresAt.toISOString(),
    });

  if (error) {
    throw new Error(error.message);
  }

  return { token, expiresAt };
}

export async function getAdminSession(
  token: string
): Promise<AdminSessionLookupResult> {
  const { data: session, error } = await supabaseAdmin
    .from("admin_sessions")
    .select("id, expires_at")
    .eq("session_token", token)
    .maybeSingle<AdminSessionRow>();

  if (error) {
    throw new Error(error.message);
  }

  if (!session) {
    return { status: "invalid" };
  }

  if (new Date(session.expires_at) < new Date()) {
    void clearAdminSession(token, session.id);
    return { status: "expired", session };
  }

  return { status: "valid", session };
}

export async function clearAdminSession(
  token?: string,
  sessionId?: string
) {
  if (!token && !sessionId) return;

  let query = supabaseAdmin.from("admin_sessions").delete();

  if (sessionId) {
    query = query.eq("id", sessionId);
  } else if (token) {
    query = query.eq("session_token", token);
  }

  const { error } = await query;
  if (error) {
    throw new Error(error.message);
  }
}

export function setAdminSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    ...getSessionCookieBaseOptions(),
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    ...getSessionCookieBaseOptions(),
    maxAge: 0,
  });
}

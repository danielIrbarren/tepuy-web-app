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
      reason: "MISSING_HASH" | "INVALID_PASSWORD";
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

export async function verifyAdminPassword(
  password: string,
  rawHash = process.env.ADMIN_PASSWORD_HASH
): Promise<PasswordVerificationResult> {
  if (!rawHash) {
    return { ok: false, reason: "MISSING_HASH" };
  }

  const normalizedHash = normalizeAdminPasswordHash(rawHash);
  const usedNormalization = normalizedHash !== rawHash;
  const hadWrappingQuotes = /^["'].*["']$/.test(rawHash.trim());
  const hadEscapedDollars = rawHash.includes("\\$");
  const hasEmbeddedQuotes =
    normalizedHash.includes('"') || normalizedHash.includes("'");
  const backslashCount = (rawHash.match(/\\/g) ?? []).length;
  const looksLikeBcrypt = /^\$2[abxy]\$\d{2}\$/.test(normalizedHash);
  const isValid = await compare(password, normalizedHash);

  if (!isValid) {
    return {
      ok: false,
      reason: "INVALID_PASSWORD",
      normalizedHash,
      usedNormalization,
      hadWrappingQuotes,
      hadEscapedDollars,
      hasEmbeddedQuotes,
      backslashCount,
      looksLikeBcrypt,
      rawLength: rawHash.length,
      normalizedLength: normalizedHash.length,
    };
  }

  return {
    ok: true,
    normalizedHash,
    usedNormalization,
    hadWrappingQuotes,
    hadEscapedDollars,
    hasEmbeddedQuotes,
    backslashCount,
    looksLikeBcrypt,
    rawLength: rawHash.length,
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

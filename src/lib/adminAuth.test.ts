import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAdminSessionMock, clearAdminSessionCookieMock, logMock } = vi.hoisted(() => ({
  getAdminSessionMock: vi.fn(),
  clearAdminSessionCookieMock: vi.fn(),
  logMock: vi.fn(),
}));

vi.mock("@/lib/adminSession", () => ({
  ADMIN_SESSION_COOKIE: "tepuy_admin_session",
  getAdminSession: getAdminSessionMock,
  clearAdminSessionCookie: clearAdminSessionCookieMock,
}));

vi.mock("@/lib/logger", () => ({
  log: logMock,
  getCorrelationId: vi.fn(() => "test-cid"),
}));

import { requireAdmin } from "@/lib/adminAuth";

function makeRequest(cookieValue?: string) {
  return new NextRequest("http://localhost/api/admin/residentes", {
    headers: cookieValue
      ? { cookie: `tepuy_admin_session=${cookieValue}` }
      : undefined,
  });
}

describe("requireAdmin", () => {
  beforeEach(() => {
    getAdminSessionMock.mockReset();
    clearAdminSessionCookieMock.mockReset();
  });

  it("retorna 401 cuando falta la cookie", async () => {
    const response = await requireAdmin(makeRequest());

    expect(response?.status).toBe(401);
  });

  it("retorna 401 cuando el token es inválido", async () => {
    getAdminSessionMock.mockResolvedValue({ status: "invalid" });

    const response = await requireAdmin(makeRequest("token-invalido"));

    expect(response?.status).toBe(401);
    expect(getAdminSessionMock).toHaveBeenCalledWith("token-invalido");
  });

  it("retorna 401 cuando la sesión expiró", async () => {
    getAdminSessionMock.mockResolvedValue({
      status: "expired",
      session: {
        id: "session-id",
        expires_at: "2026-01-01T00:00:00.000Z",
      },
    });

    const response = await requireAdmin(makeRequest("token-expirado"));

    expect(response?.status).toBe(401);
  });

  it("permite continuar cuando la sesión es válida", async () => {
    getAdminSessionMock.mockResolvedValue({
      status: "valid",
      session: {
        id: "session-id",
        expires_at: "2099-01-01T00:00:00.000Z",
      },
    });

    const response = await requireAdmin(makeRequest("token-valido"));

    expect(response).toBeNull();
  });
});

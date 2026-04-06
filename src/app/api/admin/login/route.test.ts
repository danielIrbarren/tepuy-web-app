import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock, insertMock, logMock, getCorrelationIdMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  insertMock: vi.fn(),
  logMock: vi.fn(),
  getCorrelationIdMock: vi.fn(() => "test-cid"),
}));

vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: {
    from: fromMock,
  },
}));

vi.mock("@/lib/logger", () => ({
  log: logMock,
  getCorrelationId: getCorrelationIdMock,
}));

import { POST } from "@/app/api/admin/login/route";

const VALID_PASSWORD = "tepuy-admin-2026";
const VALID_HASH = "$2b$12$UN9pNADhEa9vbAyUe/5ic.6FqGQc9FRUInwrGgxV0ZICRpSnJazma";

function makeRequest(password: string) {
  return new NextRequest("http://localhost/api/admin/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-correlation-id": "test-cid",
    },
    body: JSON.stringify({ password }),
  });
}

describe("POST /api/admin/login", () => {
  beforeEach(() => {
    fromMock.mockReturnValue({
      insert: insertMock,
    });
    insertMock.mockResolvedValue({ error: null });
    process.env.ADMIN_PASSWORD_HASH = VALID_HASH;
    delete process.env.ADMIN_PASSWORD_HASH_B64;
  });

  it("retorna 200 y set-cookie con un hash válido", async () => {
    const response = await POST(makeRequest(VALID_PASSWORD));

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("tepuy_admin_session=");
    expect(fromMock).toHaveBeenCalledWith("admin_sessions");
  });

  it("retorna 401 con contraseña inválida", async () => {
    const response = await POST(makeRequest("incorrecta"));

    expect(response.status).toBe(401);
  });

  it("retorna 200 con hash normalizable por comillas", async () => {
    process.env.ADMIN_PASSWORD_HASH = `"${VALID_HASH}"`;

    const response = await POST(makeRequest(VALID_PASSWORD));

    expect(response.status).toBe(200);
  });

  it("retorna 200 con hash normalizable por dolares escapados", async () => {
    process.env.ADMIN_PASSWORD_HASH =
      "\\$2b\\$12\\$UN9pNADhEa9vbAyUe/5ic.6FqGQc9FRUInwrGgxV0ZICRpSnJazma";

    const response = await POST(makeRequest(VALID_PASSWORD));

    expect(response.status).toBe(200);
  });

  it("retorna 500 cuando falta el env del hash", async () => {
    delete process.env.ADMIN_PASSWORD_HASH;

    const response = await POST(makeRequest(VALID_PASSWORD));

    expect(response.status).toBe(500);
  });

  it("retorna 200 cuando el hash viene en base64", async () => {
    delete process.env.ADMIN_PASSWORD_HASH;
    process.env.ADMIN_PASSWORD_HASH_B64 = Buffer.from(
      VALID_HASH,
      "utf8"
    ).toString("base64");

    const response = await POST(makeRequest(VALID_PASSWORD));

    expect(response.status).toBe(200);
  });

  it("retorna 500 cuando el hash base64 es inválido", async () => {
    delete process.env.ADMIN_PASSWORD_HASH;
    process.env.ADMIN_PASSWORD_HASH_B64 = "@@@";

    const response = await POST(makeRequest(VALID_PASSWORD));

    expect(response.status).toBe(500);
  });
});

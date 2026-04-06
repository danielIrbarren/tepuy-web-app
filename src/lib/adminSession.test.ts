import { describe, expect, it } from "vitest";
import {
  normalizeAdminPasswordHash,
  verifyAdminPassword,
} from "@/lib/adminSession";

const VALID_PASSWORD = "tepuy-admin-2026";
const VALID_HASH = "$2b$12$UN9pNADhEa9vbAyUe/5ic.6FqGQc9FRUInwrGgxV0ZICRpSnJazma";

describe("adminSession", () => {
  it("normaliza un hash con comillas envolventes", () => {
    expect(normalizeAdminPasswordHash(`"${VALID_HASH}"`)).toBe(VALID_HASH);
  });

  it("normaliza un hash con dolares escapados", () => {
    expect(normalizeAdminPasswordHash("\\$2b\\$12\\$UN9pNADhEa9vbAyUe/5ic.6FqGQc9FRUInwrGgxV0ZICRpSnJazma")).toBe(VALID_HASH);
  });

  it("valida una contraseña contra un hash bcrypt limpio", async () => {
    await expect(verifyAdminPassword(VALID_PASSWORD, VALID_HASH)).resolves.toMatchObject({
      ok: true,
      usedNormalization: false,
    });
  });

  it("valida una contraseña contra un hash con comillas", async () => {
    await expect(verifyAdminPassword(VALID_PASSWORD, `"${VALID_HASH}"`)).resolves.toMatchObject({
      ok: true,
      usedNormalization: true,
      hadWrappingQuotes: true,
    });
  });

  it("valida una contraseña contra un hash con dolares escapados", async () => {
    await expect(
      verifyAdminPassword(
        VALID_PASSWORD,
        "\\$2b\\$12\\$UN9pNADhEa9vbAyUe/5ic.6FqGQc9FRUInwrGgxV0ZICRpSnJazma"
      )
    ).resolves.toMatchObject({
      ok: true,
      usedNormalization: true,
      hadEscapedDollars: true,
    });
  });

  it("retorna missing hash cuando el env no existe", async () => {
    await expect(verifyAdminPassword(VALID_PASSWORD, undefined)).resolves.toEqual({
      ok: false,
      reason: "MISSING_HASH",
    });
  });
});

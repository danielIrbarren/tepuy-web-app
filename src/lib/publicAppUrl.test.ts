import { describe, expect, it } from "vitest";
import {
  DEFAULT_PUBLIC_APP_URL,
  getPublicAppUrl,
} from "@/lib/publicAppUrl";

describe("publicAppUrl", () => {
  it("usa NEXT_PUBLIC_APP_URL cuando existe", () => {
    expect(getPublicAppUrl("https://mi-app.vercel.app")).toBe("https://mi-app.vercel.app");
  });

  it("usa fallback cuando la variable está vacía", () => {
    expect(getPublicAppUrl("")).toBe(DEFAULT_PUBLIC_APP_URL);
  });

  it("usa fallback cuando la variable no existe", () => {
    expect(getPublicAppUrl(undefined)).toBe(DEFAULT_PUBLIC_APP_URL);
  });
});

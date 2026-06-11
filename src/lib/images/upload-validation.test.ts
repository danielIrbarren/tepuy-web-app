import { describe, it, expect } from "vitest";
import { validateUploadFiles, MAX_FILES, MAX_BYTES } from "./upload-validation";

const ok = (over: Partial<{ type: string; size: number }> = {}) => ({
  type: "image/jpeg",
  size: 500_000,
  ...over,
});

describe("validateUploadFiles", () => {
  it("acepta de 1 a 5 imágenes válidas", () => {
    expect(validateUploadFiles([ok()]).ok).toBe(true);
    expect(validateUploadFiles(Array.from({ length: MAX_FILES }, () => ok())).ok).toBe(true);
  });

  it("rechaza cuando no hay archivos", () => {
    expect(validateUploadFiles([]).ok).toBe(false);
  });

  it("rechaza más de 5 archivos", () => {
    const r = validateUploadFiles(Array.from({ length: MAX_FILES + 1 }, () => ok()));
    expect(r.ok).toBe(false);
  });

  it("rechaza un archivo que excede el tamaño máximo", () => {
    const r = validateUploadFiles([ok({ size: MAX_BYTES + 1 })]);
    expect(r.ok).toBe(false);
  });

  it("rechaza un tipo de archivo no permitido", () => {
    expect(validateUploadFiles([ok({ type: "application/pdf" })]).ok).toBe(false);
    expect(validateUploadFiles([ok({ type: "image/gif" })]).ok).toBe(false);
  });

  it("acepta png y webp además de jpeg", () => {
    expect(validateUploadFiles([ok({ type: "image/png" })]).ok).toBe(true);
    expect(validateUploadFiles([ok({ type: "image/webp" })]).ok).toBe(true);
  });
});

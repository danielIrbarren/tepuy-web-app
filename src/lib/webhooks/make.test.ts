import { describe, it, expect } from "vitest";
import { collapseBlankLines } from "./make";

describe("collapseBlankLines", () => {
  it("colapsa líneas en blanco entre párrafos en un solo salto", () => {
    expect(collapseBlankLines("Hay una fuga.\n\n\nViene del techo.")).toBe(
      "Hay una fuga.\nViene del techo."
    );
  });

  it("conserva los saltos de línea simples", () => {
    expect(collapseBlankLines("Línea 1\nLínea 2\nLínea 3")).toBe(
      "Línea 1\nLínea 2\nLínea 3"
    );
  });

  it("quita espacios al final de línea que dejan huecos", () => {
    expect(collapseBlankLines("Párrafo 1\n   \nPárrafo 2")).toBe(
      "Párrafo 1\nPárrafo 2"
    );
  });

  it("normaliza saltos estilo Windows (\\r\\n)", () => {
    expect(collapseBlankLines("a\r\n\r\nb")).toBe("a\nb");
  });

  it("recorta espacios y saltos al inicio y al final", () => {
    expect(collapseBlankLines("\n\n  Texto  \n\n")).toBe("Texto");
  });

  it("deja intacto un texto sin líneas en blanco", () => {
    expect(collapseBlankLines("Texto normal sin saltos")).toBe(
      "Texto normal sin saltos"
    );
  });
});

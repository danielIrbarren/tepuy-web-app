import { describe, it, expect } from "vitest";
import { collapseBlankLines, buildMakePayload, type MakeRequestRow } from "./make";

const baseRow: MakeRequestRow = {
  id: "11111111-2222-3333-4444-555566667777",
  ci_usuario: "V-12345678",
  nombre_usuario: "Juan Pérez",
  nro_apto: "3-B",
  descripcion_inmueble: "Torre A",
  tlf_usuario: "0424-6897123",
  gerencia: "Mantenimiento",
  supervisor_nombre: "Ana Gómez",
  supervisor_tlf: "0212-5551234",
  work_area: "fumigacion",
  criticality: "urgente",
  description: "Gran presencia de chiripas en la cocina",
  image_urls: null,
  created_at: "2026-06-10T17:46:00.000Z",
};

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

describe("buildMakePayload", () => {
  it("mapea una fila al payload del webhook con reference_number derivado del id", () => {
    const payload = buildMakePayload(baseRow);

    expect(payload).toEqual({
      request_id: "11111111-2222-3333-4444-555566667777",
      reference_number: "55566667777".slice(-8).toUpperCase(),
      ci_usuario: "V-12345678",
      nombre_usuario: "Juan Pérez",
      nro_apto: "3-B",
      descripcion_inmueble: "Torre A",
      tlf_usuario: "0424-6897123",
      gerencia: "Mantenimiento",
      supervisor_nombre: "Ana Gómez",
      supervisor_tlf: "0212-5551234",
      work_area: "fumigacion",
      criticality: "urgente",
      description: "Gran presencia de chiripas en la cocina",
      image_urls: [],
      created_at: "2026-06-10T17:46:00.000Z",
    });
  });

  it("pasa las image_urls tal cual cuando la fila trae fotos", () => {
    const urls = [
      "https://x.supabase.co/storage/v1/object/public/solicitud-images/a.jpg",
      "https://x.supabase.co/storage/v1/object/public/solicitud-images/b.jpg",
    ];
    const payload = buildMakePayload({ ...baseRow, image_urls: urls });
    expect(payload.image_urls).toEqual(urls);
  });
});

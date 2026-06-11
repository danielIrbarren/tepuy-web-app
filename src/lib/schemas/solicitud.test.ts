import { describe, it, expect } from "vitest";
import { CreateSolicitudBodySchema } from "./solicitud";

const validBase = {
  resident_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  work_area: "fumigacion",
  criticality: "urgente",
  description: "Gran presencia de chiripas en la cocina",
};

describe("CreateSolicitudBodySchema — image_urls", () => {
  it("acepta un body sin image_urls (retrocompatible)", () => {
    const result = CreateSolicitudBodySchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("acepta y conserva una lista válida de URLs", () => {
    const image_urls = [
      "https://x.supabase.co/storage/v1/object/public/solicitud-images/a.jpg",
      "https://x.supabase.co/storage/v1/object/public/solicitud-images/b.jpg",
    ];
    const result = CreateSolicitudBodySchema.safeParse({ ...validBase, image_urls });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.image_urls).toEqual(image_urls);
    }
  });

  it("rechaza más de 5 URLs", () => {
    const image_urls = Array.from(
      { length: 6 },
      (_, i) => `https://x.supabase.co/storage/v1/object/public/solicitud-images/${i}.jpg`
    );
    const result = CreateSolicitudBodySchema.safeParse({ ...validBase, image_urls });
    expect(result.success).toBe(false);
  });

  it("rechaza strings que no son URL", () => {
    const result = CreateSolicitudBodySchema.safeParse({
      ...validBase,
      image_urls: ["no-soy-una-url"],
    });
    expect(result.success).toBe(false);
  });
});

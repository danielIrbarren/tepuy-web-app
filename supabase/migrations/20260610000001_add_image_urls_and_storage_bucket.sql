-- Migration: add_image_urls_and_storage_bucket
-- Adds image_urls to maintenance_requests and a public Storage bucket for
-- solicitud photos. Idempotent.
--
-- - image_urls: lista de URLs públicas de las fotos adjuntas. Default '{}' para
--   que nunca sea null (el payload del webhook siempre lleva una lista).
-- - bucket solicitud-images: lectura pública (Make/WhatsApp deben leer la URL);
--   escritura solo vía service_role desde el backend. file_size_limit y
--   allowed_mime_types son defensa en profundidad además de la validación del
--   endpoint.

ALTER TABLE maintenance_requests
  ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'solicitud-images',
  'solicitud-images',
  true,
  2097152, -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

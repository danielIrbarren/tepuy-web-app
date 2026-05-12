-- Migration: add_email_fields_to_residents
-- Applied: 2026-05-11
-- Adds three email fields to residents to match the source-of-truth CSV
-- (tepuy_correos_consolidado.csv). Idempotent.
--
-- email_personal       — CORREO PERSONAL (Gmail) del trabajador
-- email_institucional  — INDICADOR (correo @PDVSA.COM.VE) del trabajador
-- supervisor_email     — INDICADOR2 (correo del supervisor); completa el
--                        bloque supervisor (ya existían supervisor_nombre y
--                        supervisor_tlf).

ALTER TABLE residents
  ADD COLUMN IF NOT EXISTS email_personal      VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email_institucional VARCHAR(255),
  ADD COLUMN IF NOT EXISTS supervisor_email    VARCHAR(255);

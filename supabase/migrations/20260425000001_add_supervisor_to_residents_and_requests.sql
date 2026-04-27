-- Migration: add_supervisor_to_residents_and_requests
-- Applied: 2026-04-25
-- Adds supervisor contact fields to residents (idempotent — already exist in prod)
-- and denormalizes them into maintenance_requests for webhook payload integrity.

ALTER TABLE residents
  ADD COLUMN IF NOT EXISTS supervisor_nombre VARCHAR(255),
  ADD COLUMN IF NOT EXISTS supervisor_tlf    VARCHAR(50);

ALTER TABLE maintenance_requests
  ADD COLUMN IF NOT EXISTS supervisor_nombre VARCHAR(255),
  ADD COLUMN IF NOT EXISTS supervisor_tlf    VARCHAR(50);

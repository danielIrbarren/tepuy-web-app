-- Migration: add_request_status
-- Applied: 2026-03-30
-- Adds a user-facing request status to maintenance_requests
-- (separate from webhook_status which tracks internal delivery).

CREATE TYPE request_status_type AS ENUM (
  'pendiente',
  'en_proceso',
  'completado',
  'cancelado'
);

ALTER TABLE maintenance_requests
  ADD COLUMN request_status request_status_type NOT NULL DEFAULT 'pendiente',
  ADD COLUMN admin_notes     TEXT;

CREATE INDEX idx_maintenance_requests_request_status
  ON maintenance_requests (request_status);

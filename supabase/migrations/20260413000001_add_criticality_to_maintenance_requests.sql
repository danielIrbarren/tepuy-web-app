-- Migration: add_criticality_to_maintenance_requests
-- Applied: 2026-04-13
-- Adds criticality_type enum and criticality column missing from initial migration.

CREATE TYPE criticality_type AS ENUM (
  'urgente',
  'importante'
);

ALTER TABLE maintenance_requests
  ADD COLUMN criticality criticality_type NOT NULL DEFAULT 'importante';

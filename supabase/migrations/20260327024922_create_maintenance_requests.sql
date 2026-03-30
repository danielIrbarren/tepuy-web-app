-- Migration: create_maintenance_requests
-- Applied: 2026-03-27
-- Creates the maintenance_requests table with FK, indexes, and constraints.

CREATE TABLE maintenance_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id           UUID NOT NULL REFERENCES residents(id) ON DELETE RESTRICT,
  -- Denormalized fields (webhook payload + historical integrity)
  ci_usuario            VARCHAR(20) NOT NULL,
  nombre_usuario        VARCHAR(255),
  descripcion_inmueble  VARCHAR(255),
  nro_apto              VARCHAR(20),
  tlf_usuario           VARCHAR(50),
  gerencia              VARCHAR(100),
  -- Request data
  work_area             work_area_type NOT NULL,
  description           TEXT NOT NULL CHECK (length(description) <= 1000),
  preferred_time        VARCHAR(255),
  access_notes          TEXT CHECK (access_notes IS NULL OR length(access_notes) <= 300),
  -- Webhook lifecycle
  webhook_status        webhook_status_type NOT NULL DEFAULT 'pending',
  retry_count           INTEGER NOT NULL DEFAULT 0,
  external_reference    TEXT,
  -- Observability
  correlation_id        UUID NOT NULL DEFAULT gen_random_uuid(),
  -- Audit
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_maintenance_requests_resident_id ON maintenance_requests (resident_id);
CREATE INDEX idx_maintenance_requests_webhook_status ON maintenance_requests (webhook_status);
CREATE INDEX idx_maintenance_requests_created_at ON maintenance_requests (created_at DESC);

-- Auto-update trigger
CREATE TRIGGER trg_maintenance_requests_updated_at
  BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

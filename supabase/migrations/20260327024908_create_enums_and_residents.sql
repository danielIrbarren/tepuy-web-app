-- Migration: create_enums_and_residents
-- Applied: 2026-03-27
-- Creates custom enums and the residents table with all indexes.

-- Enums
CREATE TYPE resident_status AS ENUM ('active', 'inactive');
CREATE TYPE work_area_type AS ENUM (
  'plomeria', 'electricidad', 'pintura', 'carpinteria',
  'cerrajeria', 'aire_acondicionado', 'albanileria',
  'impermeabilizacion', 'vidrieria', 'limpieza', 'jardineria', 'otro'
);
CREATE TYPE webhook_status_type AS ENUM ('pending', 'sent', 'failed');

-- Function for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Residents table
CREATE TABLE residents (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ci_usuario            VARCHAR(20) NOT NULL UNIQUE,
  nombre_usuario        VARCHAR(255),
  tlf_usuario           VARCHAR(50),
  status                resident_status NOT NULL DEFAULT 'active',
  descripcion_inmueble  VARCHAR(255),
  nro_apto              VARCHAR(20),
  fase                  VARCHAR(100),
  gerencia              VARCHAR(100),
  nombre_propietario    VARCHAR(255),
  ci_propietario        VARCHAR(20),
  email_propietario     VARCHAR(255),
  tlf_propietario       VARCHAR(50),
  fecha_inicio_contrato DATE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_residents_descripcion_inmueble ON residents (descripcion_inmueble);
CREATE INDEX idx_residents_status ON residents (status);

-- Auto-update trigger
CREATE TRIGGER trg_residents_updated_at
  BEFORE UPDATE ON residents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

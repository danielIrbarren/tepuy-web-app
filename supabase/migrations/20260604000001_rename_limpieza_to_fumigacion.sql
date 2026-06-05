-- Migration: rename_limpieza_to_fumigacion
-- Applied: 2026-06-04
-- Renames the 'limpieza' value of the work_area_type enum to 'fumigacion'.
-- Atomic, in-place rename — all existing maintenance_requests rows with
-- work_area = 'limpieza' will automatically read as 'fumigacion' after this.

ALTER TYPE work_area_type RENAME VALUE 'limpieza' TO 'fumigacion';

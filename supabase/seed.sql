-- TEPUY — safe development seed
-- Datos sintéticos para pruebas locales y demos.

BEGIN;

TRUNCATE TABLE maintenance_requests CASCADE;
TRUNCATE TABLE residents CASCADE;

INSERT INTO residents (
  ci_usuario,
  nombre_usuario,
  tlf_usuario,
  status,
  descripcion_inmueble,
  nro_apto,
  fase,
  gerencia,
  nombre_propietario,
  ci_propietario,
  email_propietario,
  tlf_propietario,
  fecha_inicio_contrato
) VALUES
  ('V12345678', 'Mariana Gonzalez', '04141234567', 'active', 'Residencias Tepuy Torre A', '101', 'Fase 1', 'Gerencia Norte', 'Laura Gonzalez', 'V99887766', 'laura@example.com', '04140000001', '2025-01-15'),
  ('V23456789', 'Carlos Perez', '04241234567', 'active', 'Residencias Tepuy Torre B', '205', 'Fase 1', 'Gerencia Sur', 'Pedro Perez', 'V88776655', 'pedro@example.com', '04140000002', '2025-02-01'),
  ('V34567890', 'Ana Martinez', '04121234567', 'active', 'Residencias Tepuy Torre C', '302', 'Fase 2', 'Gerencia Este', 'Ana Maria Ruiz', 'V77665544', 'ana.ruiz@example.com', '04140000003', '2025-02-15'),
  ('V45678901', 'Jorge Salazar', '04161230000', 'inactive', 'Residencias Tepuy Torre A', '410', 'Fase 2', 'Gerencia Norte', 'Lucia Salazar', 'V66554433', 'lucia@example.com', '04140000004', '2025-03-01'),
  ('E56789012', 'Daniela Rossi', '04141239999', 'active', 'Residencias Tepuy Torre D', '5-B', 'Fase 3', 'Gerencia Centro', 'Marco Rossi', 'E55443322', 'marco@example.com', '04140000005', '2025-03-20'),
  ('V67890123', NULL, NULL, 'inactive', 'Residencias Tepuy Torre E', 'PB-2', 'Fase 3', NULL, NULL, NULL, NULL, NULL, '2025-04-05');

COMMIT;

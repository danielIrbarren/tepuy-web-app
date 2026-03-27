-- Sprint 1 (Gabriele): 5 seed residents for development/testing
-- 3 active, 1 inactive, 1 without proper CI

INSERT INTO public.residents (ci_usuario, nombre_usuario, tlf_usuario, status, descripcion_inmueble, nro_apto, fase, gerencia)
VALUES
  ('V12345678', 'María González', '04141234567', 'active', 'Residencias Tepuy Torre A', '101', 'Fase 1', 'Gerencia Norte'),
  ('V87654321', 'Carlos Pérez', '04241234567', 'active', 'Residencias Tepuy Torre B', '205', 'Fase 2', 'Gerencia Sur'),
  ('V11223344', 'Ana Martínez', '04121234567', 'active', 'Residencias Tepuy Torre A', '302', 'Fase 1', 'Gerencia Norte'),
  ('V99887766', 'Pedro Rodríguez', '04161234567', 'inactive', 'Residencias Tepuy Torre C', '410', 'Fase 3', 'Gerencia Este'),
  ('V00000000', NULL, NULL, 'inactive', NULL, NULL, NULL, NULL)
ON CONFLICT (ci_usuario) DO NOTHING;

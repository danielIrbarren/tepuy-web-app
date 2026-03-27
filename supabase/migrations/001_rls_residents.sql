-- Sprint 1 (Gabriele): Enable RLS on residents table
-- The table and enum already exist in Supabase. This migration adds security.

-- Enable RLS (blocks all access by default)
ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;

-- No policies for anon key = anon_key cannot read residents at all.
-- The service_role_key bypasses RLS, used in the lookup API route handler.
-- Daniel will add admin policies in Sprint 3.

-- Verify: the unique index on ci_usuario should already exist from table creation.
-- If not, uncomment:
-- CREATE UNIQUE INDEX IF NOT EXISTS residents_ci_usuario_unique ON public.residents(ci_usuario);

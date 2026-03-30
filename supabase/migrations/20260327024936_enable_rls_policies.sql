-- Migration: enable_rls_policies
-- Applied: 2026-03-27
-- Enables RLS on all tables. No anon policies — only service_role has access.
-- All interactions go through Next.js Route Handlers with SUPABASE_SERVICE_ROLE_KEY.

ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

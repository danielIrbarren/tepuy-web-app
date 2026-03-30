-- Migration: create_admin_sessions
-- Applied: 2026-03-27
-- Creates the admin_sessions table for server-side session management.

CREATE TABLE admin_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token   VARCHAR(255) NOT NULL UNIQUE,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for expiry-based queries and cleanup
CREATE INDEX idx_admin_sessions_expires_at ON admin_sessions (expires_at);

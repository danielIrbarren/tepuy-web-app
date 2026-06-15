-- Migration: add_solicitudes_stats_function
-- Applied: 2026-06-15
-- Adds an aggregation function used by the admin "Resumen" dashboard.
-- Computes time-bucket counts (today / this week / this month) plus
-- breakdowns by status, work area, criticality, a 7-day trend and the
-- top users by number of requests. All date boundaries are resolved in
-- America/Caracas (the locale used across the app) so "hoy" matches what
-- the admin sees on their clock — not UTC.

CREATE OR REPLACE FUNCTION get_solicitudes_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  WITH bounds AS (
    SELECT
      (date_trunc('day',   now() AT TIME ZONE 'America/Caracas') AT TIME ZONE 'America/Caracas') AS day_start,
      (date_trunc('week',  now() AT TIME ZONE 'America/Caracas') AT TIME ZONE 'America/Caracas') AS week_start,
      (date_trunc('month', now() AT TIME ZONE 'America/Caracas') AT TIME ZONE 'America/Caracas') AS month_start
  )
  SELECT jsonb_build_object(
    'today',  (SELECT count(*) FROM maintenance_requests WHERE created_at >= bounds.day_start),
    'week',   (SELECT count(*) FROM maintenance_requests WHERE created_at >= bounds.week_start),
    'month',  (SELECT count(*) FROM maintenance_requests WHERE created_at >= bounds.month_start),
    'total',  (SELECT count(*) FROM maintenance_requests),
    'by_status', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('key', request_status, 'count', c) ORDER BY c DESC), '[]'::jsonb)
      FROM (SELECT request_status, count(*) AS c FROM maintenance_requests GROUP BY request_status) t
    ),
    'by_work_area', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('key', work_area, 'count', c) ORDER BY c DESC), '[]'::jsonb)
      FROM (SELECT work_area, count(*) AS c FROM maintenance_requests GROUP BY work_area) t
    ),
    'by_criticality', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('key', criticality, 'count', c) ORDER BY c DESC), '[]'::jsonb)
      FROM (SELECT criticality, count(*) AS c FROM maintenance_requests GROUP BY criticality) t
    ),
    'top_users', (
      SELECT coalesce(jsonb_agg(obj ORDER BY cnt DESC), '[]'::jsonb)
      FROM (
        SELECT
          jsonb_build_object(
            'ci_usuario',     ci_usuario,
            'nombre_usuario', max(nombre_usuario),
            'count',          count(*)
          ) AS obj,
          count(*) AS cnt
        FROM maintenance_requests
        GROUP BY ci_usuario
        ORDER BY cnt DESC
        LIMIT 10
      ) sub
    ),
    'last_7_days', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('date', d, 'count', c) ORDER BY d), '[]'::jsonb)
      FROM (
        SELECT (created_at AT TIME ZONE 'America/Caracas')::date AS d, count(*) AS c
        FROM maintenance_requests
        WHERE created_at >= (bounds.day_start - interval '6 days')
        GROUP BY 1
      ) t
    )
  )
  FROM bounds;
$$;

COMMENT ON FUNCTION get_solicitudes_stats() IS
  'Aggregated metrics for the admin dashboard (Resumen). Returns a single jsonb object.';

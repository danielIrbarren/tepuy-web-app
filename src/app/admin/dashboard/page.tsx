"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AdminApiError, fetchAdminJson } from "@/lib/adminClient";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { WORK_AREA_LABELS, CRITICALITY_LABELS } from "@/lib/schemas/solicitud";

type Bucket = { key: string; count: number };

interface Stats {
  today: number;
  week: number;
  month: number;
  total: number;
  by_status: Bucket[];
  by_work_area: Bucket[];
  by_criticality: Bucket[];
  top_users: { ci_usuario: string; nombre_usuario: string | null; count: number }[];
  last_7_days: { date: string; count: number }[];
}

const REQUEST_STATUS_LABELS: Record<string, string> = {
  pendiente:  "Pendiente",
  en_proceso: "En proceso",
  completado: "Completado",
  cancelado:  "Cancelado",
};

const REQUEST_STATUS_BAR: Record<string, string> = {
  pendiente:  "bg-amber-400",
  en_proceso: "bg-blue-500",
  completado: "bg-emerald-500",
  cancelado:  "bg-red-400",
};

const CRITICALITY_BAR: Record<string, string> = {
  urgente:    "bg-red-500",
  importante: "bg-tepuy-400",
};

// ─── Reusable pieces ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  hint,
  loading,
}: {
  label: string;
  value: number;
  hint: string;
  loading: boolean;
}) {
  return (
    <div
      className="rounded-2xl bg-white px-4 py-3.5 flex flex-col gap-1"
      style={{ border: "1px solid oklch(0.92 0.020 265)", boxShadow: "0 1px 3px oklch(0 0 0 / 0.04), 0 4px 16px oklch(0.48 0.125 265 / 0.05)" }}
    >
      <span className="text-[10px] font-bold text-tepuy-400 uppercase tracking-widest">{label}</span>
      {loading ? (
        <div className="h-8 w-14 rounded-lg bg-tepuy-50 animate-pulse" />
      ) : (
        <span className="text-3xl font-bold text-tepuy-900 tabular-nums leading-none">{value}</span>
      )}
      <span className="text-[11px] text-tepuy-400 font-medium">{hint}</span>
    </div>
  );
}

function BarList({
  title,
  rows,
  loading,
  emptyText = "Sin datos",
}: {
  title: string;
  rows: { label: string; count: number; barClass?: string; sub?: string }[];
  loading: boolean;
  emptyText?: string;
}) {
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0) || 1;

  return (
    <div
      className="rounded-2xl bg-white p-4 flex flex-col"
      style={{ border: "1px solid oklch(0.92 0.020 265)", boxShadow: "0 1px 3px oklch(0 0 0 / 0.04), 0 4px 16px oklch(0.48 0.125 265 / 0.05)" }}
    >
      <h2 className="text-[11px] font-bold text-tepuy-500 uppercase tracking-widest mb-3.5">{title}</h2>

      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-6 rounded-lg bg-tepuy-50 animate-pulse" style={{ width: `${90 - i * 15}%` }} />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-[13px] text-tepuy-400 py-4">{emptyText}</p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-28 sm:w-32 shrink-0 min-w-0">
                <p className="text-[12px] font-semibold text-tepuy-800 truncate leading-tight">{r.label}</p>
                {r.sub && <p className="text-[10px] text-tepuy-400 font-mono truncate leading-tight">{r.sub}</p>}
              </div>
              <div className="flex-1 h-5 rounded-md bg-tepuy-50 overflow-hidden relative">
                <div
                  className={`h-full rounded-md transition-all ${r.barClass ?? "bg-tepuy-500"}`}
                  style={{ width: `${Math.max((r.count / max) * 100, 4)}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-[13px] font-bold text-tepuy-700 tabular-nums">{r.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TrendChart({
  data,
  loading,
}: {
  data: { date: string; count: number }[];
  loading: boolean;
}) {
  // Build a fixed 7-day window ending today, filling gaps with 0.
  const days: { date: string; count: number; label: string }[] = [];
  const counts = new Map(data.map((d) => [d.date, d.count]));
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    days.push({
      date: iso,
      count: counts.get(iso) ?? 0,
      label: d.toLocaleDateString("es-VE", { weekday: "short" }).replace(".", ""),
    });
  }
  const max = days.reduce((m, d) => Math.max(m, d.count), 0) || 1;

  return (
    <div
      className="rounded-2xl bg-white p-4"
      style={{ border: "1px solid oklch(0.92 0.020 265)", boxShadow: "0 1px 3px oklch(0 0 0 / 0.04), 0 4px 16px oklch(0.48 0.125 265 / 0.05)" }}
    >
      <h2 className="text-[11px] font-bold text-tepuy-500 uppercase tracking-widest mb-4">Últimos 7 días</h2>
      {loading ? (
        <div className="flex items-end justify-between gap-2 h-32">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 rounded-t-md bg-tepuy-50 animate-pulse" style={{ height: `${30 + ((i * 13) % 70)}%` }} />
          ))}
        </div>
      ) : (
        <div className="flex items-end justify-between gap-2 h-32">
          {days.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="text-[11px] font-bold text-tepuy-700 tabular-nums">{d.count > 0 ? d.count : ""}</span>
              <div
                className="w-full rounded-t-md bg-tepuy-500 transition-all min-h-[3px]"
                style={{ height: `${(d.count / max) * 100}%` }}
                title={`${d.label}: ${d.count}`}
              />
              <span className="text-[10px] font-semibold text-tepuy-400 capitalize">{d.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      const data = await fetchAdminJson<Stats>(
        "/api/admin/solicitudes/stats",
        undefined,
        {
          fallbackMessage: "Error al cargar el resumen.",
          onUnauthorized: () => router.replace("/admin/login"),
        }
      );
      setStats(data);
    } catch (err) {
      if (err instanceof AdminApiError && err.status === 401) return;
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const workAreaRows = (stats?.by_work_area ?? []).map((b) => ({
    label: WORK_AREA_LABELS[b.key as keyof typeof WORK_AREA_LABELS] ?? b.key,
    count: b.count,
  }));

  const criticalityRows = (stats?.by_criticality ?? []).map((b) => ({
    label: CRITICALITY_LABELS[b.key as keyof typeof CRITICALITY_LABELS]?.split(" / ")[0] ?? b.key,
    count: b.count,
    barClass: CRITICALITY_BAR[b.key] ?? "bg-tepuy-400",
  }));

  const statusRows = (stats?.by_status ?? []).map((b) => ({
    label: REQUEST_STATUS_LABELS[b.key] ?? b.key,
    count: b.count,
    barClass: REQUEST_STATUS_BAR[b.key] ?? "bg-tepuy-400",
  }));

  const userRows = (stats?.top_users ?? []).map((u) => ({
    label: u.nombre_usuario || "Sin nombre",
    sub: `CI ${u.ci_usuario}`,
    count: u.count,
  }));

  return (
    <main className="flex-1 flex flex-col min-h-0 bg-tepuy-mesh">
      <AdminPageHeader title="Resumen" count={isLoading ? undefined : stats?.total} section="dashboard" />

      <div className="flex-1 overflow-auto px-4 py-4">
        <div className="max-w-6xl mx-auto space-y-4">

          {error ? (
            <div
              className="rounded-2xl bg-white p-8 text-center"
              style={{ border: "1px solid oklch(0.92 0.020 265)" }}
            >
              <p className="text-[14px] font-semibold text-tepuy-700 mb-1">No se pudo cargar el resumen</p>
              <p className="text-[12px] text-tepuy-400 mb-4">Verifica tu conexión e inténtalo de nuevo.</p>
              <button
                onClick={fetchStats}
                className="btn-tepuy h-9 px-5 rounded-xl text-[13px] font-bold text-white cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <>
              {/* Top metric cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="Hoy" value={stats?.today ?? 0} hint="Solicitudes de hoy" loading={isLoading} />
                <StatCard label="Esta semana" value={stats?.week ?? 0} hint="Desde el lunes" loading={isLoading} />
                <StatCard label="Este mes" value={stats?.month ?? 0} hint="Mes en curso" loading={isLoading} />
                <StatCard label="Total" value={stats?.total ?? 0} hint="Histórico" loading={isLoading} />
              </div>

              {/* 7-day trend */}
              <TrendChart data={stats?.last_7_days ?? []} loading={isLoading} />

              {/* Breakdowns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <BarList title="Por área de trabajo" rows={workAreaRows} loading={isLoading} />
                <div className="grid grid-cols-1 gap-4">
                  <BarList title="Por urgencia" rows={criticalityRows} loading={isLoading} />
                  <BarList title="Por estado" rows={statusRows} loading={isLoading} />
                </div>
              </div>

              {/* Top users */}
              <BarList
                title="Usuarios con más solicitudes"
                rows={userRows}
                loading={isLoading}
                emptyText="Aún no hay solicitudes registradas."
              />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

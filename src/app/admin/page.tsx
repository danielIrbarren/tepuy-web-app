"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ResidentAdmin, ListResidentsResponse } from "@/lib/schemas/admin";

export default function AdminPage() {
  const router = useRouter();
  const [residents, setResidents] = useState<ResidentAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(25);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchResidents = useCallback(
    async (p: number, s: string, st: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", String(p));
        params.set("per_page", String(perPage));
        if (s.trim()) params.set("search", s.trim());
        if (st) params.set("status", st);

        const res = await fetch(`/api/admin/residentes?${params}`);

        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }

        if (!res.ok) throw new Error("Error cargando residentes");

        const data: ListResidentsResponse = await res.json();
        setResidents(data.residents);
        setTotal(data.total);
        setTotalPages(data.total_pages);
      } catch {
        setError("Error cargando residentes. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    },
    [perPage, router]
  );

  useEffect(() => {
    fetchResidents(page, search, statusFilter);
  }, [page, statusFilter, fetchResidents]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchResidents(1, value, statusFilter);
    }, 300);
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "DELETE" });
    router.push("/admin/login");
  };

  return (
    <main className="flex-1 px-4 py-6 max-w-6xl mx-auto w-full">
      <div className="animate-slide-up space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-tepuy-900">Residentes</h1>
            <p className="text-sm text-muted-foreground">
              {total} residente{total !== 1 ? "s" : ""} registrado
              {total !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/admin/qr")}
              className="h-9 px-3 rounded-lg border border-tepuy-200 bg-white text-xs font-medium text-tepuy-700 hover:bg-tepuy-50 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="5" height="5" x="3" y="3" rx="1" />
                <rect width="5" height="5" x="16" y="3" rx="1" />
                <rect width="5" height="5" x="3" y="16" rx="1" />
                <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                <path d="M21 21v.01" />
                <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                <path d="M3 12h.01" />
                <path d="M12 3h.01" />
                <path d="M12 16v.01" />
                <path d="M16 12h1" />
                <path d="M21 12v.01" />
                <path d="M12 21v-1" />
              </svg>
              QR
            </button>
            <button
              onClick={handleLogout}
              className="h-9 px-3 rounded-lg border border-red-200 bg-white text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar por cédula o nombre..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full h-10 rounded-lg border border-tepuy-200 bg-white/90 px-3 pl-9 text-sm text-tepuy-900 placeholder:text-tepuy-300 outline-none focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-tepuy-300"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-lg border border-tepuy-200 bg-white/90 px-3 text-sm text-tepuy-700 outline-none focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15 cursor-pointer"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 shrink-0">
              <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-tepuy-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-tepuy-500 uppercase tracking-wider">CI</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-tepuy-500 uppercase tracking-wider">Nombre</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-tepuy-500 uppercase tracking-wider hidden md:table-cell">Inmueble</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-tepuy-500 uppercase tracking-wider">Apto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-tepuy-500 uppercase tracking-wider hidden lg:table-cell">Gerencia</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-tepuy-500 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tepuy-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-tepuy-100 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : residents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-tepuy-400">
                      <div className="space-y-2">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-tepuy-300">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="17" x2="23" y1="11" y2="11" />
                        </svg>
                        <p className="text-sm font-medium">No se encontraron residentes</p>
                        <p className="text-xs">Intenta con otros filtros de búsqueda</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  residents.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-tepuy-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium text-tepuy-800">
                        {r.ci_usuario}
                      </td>
                      <td className="px-4 py-3 font-medium text-tepuy-900">
                        {r.nombre_usuario || (
                          <span className="text-tepuy-300 italic">Sin nombre</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-tepuy-600 hidden md:table-cell">
                        {r.descripcion_inmueble || "—"}
                      </td>
                      <td className="px-4 py-3 text-tepuy-700 font-medium">
                        {r.nro_apto || "—"}
                      </td>
                      <td className="px-4 py-3 text-tepuy-600 hidden lg:table-cell">
                        {r.gerencia || "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            r.status === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              r.status === "active"
                                ? "bg-emerald-500"
                                : "bg-red-500"
                            }`}
                          />
                          {r.status === "active" ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-tepuy-100">
              <p className="text-xs text-tepuy-400">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-8 px-3 rounded-md border border-tepuy-200 text-xs font-medium text-tepuy-700 hover:bg-tepuy-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-8 px-3 rounded-md border border-tepuy-200 text-xs font-medium text-tepuy-700 hover:bg-tepuy-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

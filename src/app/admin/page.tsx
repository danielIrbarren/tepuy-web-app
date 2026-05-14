"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ResidentAdmin, ListResidentsResponse } from "@/lib/schemas/admin";
import { AdminApiError, fetchAdmin, fetchAdminJson } from "@/lib/adminClient";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CreateResidentModal } from "@/components/admin/create-resident-modal";
import { EditResidentModal } from "@/components/admin/edit-resident-modal";
import { StatusToggleDialog } from "@/components/admin/status-toggle-dialog";
import { DeleteResidentDialog } from "@/components/admin/delete-resident-dialog";

const PER_PAGE = 25;

export default function AdminPage() {
  const router = useRouter();

  // Data state
  const [residents, setResidents] = useState<ResidentAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [residenciaFilter, setResidenciaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedResidencia, setDebouncedResidencia] = useState("");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingResident, setEditingResident] = useState<ResidentAdmin | null>(null);
  const [togglingResident, setTogglingResident] = useState<ResidentAdmin | null>(null);
  const [deletingResident, setDeletingResident] = useState<ResidentAdmin | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkActing, setIsBulkActing] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  // Clear selection on page/filter changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, debouncedSearch, debouncedResidencia, statusFilter]);

  // Debounce search + residencia
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedResidencia(residenciaFilter);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [residenciaFilter]);

  // Fetch residents
  const fetchResidents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("per_page", String(PER_PAGE));
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (debouncedResidencia) params.set("residencia", debouncedResidencia);
      if (statusFilter) params.set("status", statusFilter);

      const data = await fetchAdminJson<ListResidentsResponse>(
        `/api/admin/residentes?${params.toString()}`,
        undefined,
        {
          fallbackMessage: "Error al cargar residentes.",
          onUnauthorized: () => router.replace("/admin/login"),
        }
      );
      setResidents(data.residents);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) return;
      showToast("Error al cargar residentes.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, debouncedResidencia, statusFilter, router]);

  useEffect(() => {
    fetchResidents();
  }, [fetchResidents]);

  // Toast helper
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Callbacks for modals
  const handleCreated = (resident: ResidentAdmin) => {
    showToast(`Residente ${resident.ci_usuario} creado exitosamente.`, "success");
    fetchResidents();
  };

  const handleUpdated = (resident: ResidentAdmin) => {
    showToast(`Residente ${resident.ci_usuario} actualizado.`, "success");
    setResidents((prev) =>
      prev.map((r) => (r.id === resident.id ? resident : r))
    );
  };

  const handleStatusToggled = (resident: ResidentAdmin) => {
    const label = resident.status === "active" ? "activado" : "desactivado";
    showToast(`Residente ${resident.ci_usuario} ${label}.`, "success");
    setResidents((prev) =>
      prev.map((r) => (r.id === resident.id ? resident : r))
    );
  };

  const handleDeleted = (id: string) => {
    showToast("Residente eliminado exitosamente.", "success");
    setResidents((prev) => prev.filter((r) => r.id !== id));
    setTotal((prev) => prev - 1);
  };

  // Derived selection state
  const allOnPageSelected = residents.length > 0 && residents.every((r) => selectedIds.has(r.id));
  const someOnPageSelected = residents.some((r) => selectedIds.has(r.id));

  // Sync indeterminate state on header checkbox
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someOnPageSelected && !allOnPageSelected;
    }
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(residents.map((r) => r.id)));
    }
  };

  const handleBulkStatus = async (status: "active" | "inactive") => {
    setIsBulkActing(true);
    const ids = Array.from(selectedIds);
    try {
      await Promise.all(
        ids.map((id) =>
          fetchAdminJson(
            `/api/admin/residentes/${id}/status`,
            { method: "PATCH", body: JSON.stringify({ status }), headers: { "Content-Type": "application/json" } },
            { fallbackMessage: "Error al cambiar estado.", onUnauthorized: () => router.replace("/admin/login") }
          )
        )
      );
      const label = status === "active" ? "activados" : "desactivados";
      showToast(`${ids.length} residente${ids.length !== 1 ? "s" : ""} ${label}.`, "success");
      setSelectedIds(new Set());
      fetchResidents();
    } catch {
      showToast("Error al cambiar el estado.", "error");
    } finally {
      setIsBulkActing(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!window.confirm(`¿Eliminar ${ids.length} residente${ids.length !== 1 ? "s" : ""} seleccionado${ids.length !== 1 ? "s" : ""}? Esta acción no se puede deshacer.`)) return;
    setIsBulkActing(true);
    try {
      await Promise.all(
        ids.map((id) =>
          fetchAdmin(
            `/api/admin/residentes/${id}`,
            { method: "DELETE" },
            { fallbackMessage: "Error al eliminar.", onUnauthorized: () => router.replace("/admin/login") }
          )
        )
      );
      showToast(`${ids.length} residente${ids.length !== 1 ? "s" : ""} eliminados.`, "success");
      setSelectedIds(new Set());
      fetchResidents();
    } catch {
      showToast("Error al eliminar.", "error");
    } finally {
      setIsBulkActing(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch)     params.set("search", debouncedSearch);
      if (debouncedResidencia) params.set("residencia", debouncedResidencia);
      if (statusFilter)        params.set("status", statusFilter);

      const res = await fetch(`/api/admin/residentes/export?${params.toString()}`, {
        credentials: "include",
        headers: { Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
      });

      if (!res.ok) {
        if (res.status === 401) router.replace("/admin/login");
        throw new Error("Export failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `residentes-${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Error al exportar residentes.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col min-h-0">
      <AdminPageHeader title="Residentes" count={isLoading ? undefined : total} section="residents" />

      {/* Controls */}
      <div className="px-4 py-4">
        <div className="max-w-6xl mx-auto space-y-3">
          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 flex-wrap px-1">
              <span className="text-xs font-semibold text-tepuy-600">
                {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() => handleBulkStatus("active")}
                disabled={isBulkActing}
                className="h-8 px-3 rounded-lg border border-emerald-200 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Activar
              </button>
              <button
                onClick={() => handleBulkStatus("inactive")}
                disabled={isBulkActing}
                className="h-8 px-3 rounded-lg border border-amber-200 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Desactivar
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isBulkActing}
                className="h-8 px-3 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Eliminar
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="h-8 px-3 rounded-lg text-xs font-medium text-tepuy-400 hover:text-tepuy-600 hover:bg-tepuy-50 cursor-pointer transition-colors"
              >
                Deseleccionar todo
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-tepuy-300"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por CI o nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-tepuy-200 bg-white/90 text-sm text-tepuy-900 placeholder:text-tepuy-300 outline-none transition-all focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15"
              />
            </div>

            {/* Residencia filter */}
            <div className="relative">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-tepuy-300"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <input
                type="text"
                placeholder="Filtrar por residencia..."
                value={residenciaFilter}
                onChange={(e) => setResidenciaFilter(e.target.value)}
                className="w-full sm:w-44 h-10 pl-9 pr-4 rounded-xl border border-tepuy-200 bg-white/90 text-sm text-tepuy-900 placeholder:text-tepuy-300 outline-none transition-all focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15"
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto h-10 px-3 rounded-xl border border-tepuy-200 bg-white/90 text-sm text-tepuy-700 outline-none transition-all focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15 cursor-pointer"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>

            {/* Export button */}
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="h-10 px-4 rounded-xl border border-tepuy-200 text-sm font-semibold text-tepuy-700 hover:bg-tepuy-50 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap w-full sm:w-auto transition-colors"
            >
              {isExporting ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              )}
              {isExporting ? "Exportando..." : "Exportar Excel"}
            </button>

            {/* Create button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-tepuy h-10 px-4 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap w-full sm:w-auto"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              Nuevo residente
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 px-4 pb-4 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-tepuy-100">
                    <th className="w-10 px-2 sm:px-3 py-3">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        checked={allOnPageSelected}
                        onChange={toggleSelectAll}
                        disabled={isLoading || residents.length === 0}
                        className="h-4 w-4 rounded border-tepuy-300 text-tepuy-600 cursor-pointer disabled:cursor-not-allowed"
                      />
                    </th>
                    <th className="text-left px-2 sm:px-4 py-3 text-xs font-semibold text-tepuy-500 uppercase tracking-wider">CI</th>
                    <th className="text-left px-2 sm:px-4 py-3 text-xs font-semibold text-tepuy-500 uppercase tracking-wider">Nombre</th>
                    <th className="text-left px-2 sm:px-4 py-3 text-xs font-semibold text-tepuy-500 uppercase tracking-wider hidden sm:table-cell">Inmueble</th>
                    <th className="text-left px-2 sm:px-4 py-3 text-xs font-semibold text-tepuy-500 uppercase tracking-wider hidden md:table-cell">Apto</th>
                    <th className="text-left px-2 sm:px-4 py-3 text-xs font-semibold text-tepuy-500 uppercase tracking-wider hidden lg:table-cell">Supervisor</th>
                    <th className="text-center px-2 sm:px-4 py-3 text-xs font-semibold text-tepuy-500 uppercase tracking-wider">Estado</th>
                    <th className="text-right px-2 sm:px-4 py-3 text-xs font-semibold text-tepuy-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center">
                        <div className="flex items-center justify-center gap-2 text-tepuy-400">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Cargando residentes...
                        </div>
                      </td>
                    </tr>
                  ) : residents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-tepuy-400">
                        {debouncedSearch || debouncedResidencia || statusFilter
                          ? "No se encontraron residentes con esos filtros."
                          : "No hay residentes registrados."}
                      </td>
                    </tr>
                  ) : (
                    residents.map((r) => (
                      <tr key={r.id} className={`border-b border-tepuy-50 hover:bg-tepuy-50/50 transition-colors ${selectedIds.has(r.id) ? "bg-tepuy-50/80" : ""}`}>
                        <td className="w-10 px-2 sm:px-3 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(r.id)}
                            onChange={() => toggleSelect(r.id)}
                            className="h-4 w-4 rounded border-tepuy-300 text-tepuy-600 cursor-pointer"
                          />
                        </td>
                        <td className="px-2 sm:px-4 py-3 font-mono font-semibold text-tepuy-800 text-xs sm:text-sm">{r.ci_usuario}</td>
                        <td className="px-2 sm:px-4 py-3 text-tepuy-700 text-xs sm:text-sm">{r.nombre_usuario || "—"}</td>
                        <td className="px-2 sm:px-4 py-3 text-tepuy-600 hidden sm:table-cell">{r.descripcion_inmueble || "—"}</td>
                        <td className="px-2 sm:px-4 py-3 text-tepuy-600 hidden md:table-cell">{r.nro_apto || "—"}</td>
                        <td className="px-2 sm:px-4 py-3 text-tepuy-600 hidden lg:table-cell">
                          {r.supervisor_nombre ? (
                            <div className="flex flex-col leading-tight">
                              <span className="text-tepuy-700 text-[13px]">{r.supervisor_nombre}</span>
                              {r.supervisor_tlf && (
                                <span className="text-tepuy-400 text-[11px] font-mono">{r.supervisor_tlf}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-tepuy-300">—</span>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 py-3 text-center">
                          <button
                            onClick={() => setTogglingResident(r)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                              r.status === "active"
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "bg-red-50 text-red-600 hover:bg-red-100"
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              r.status === "active" ? "bg-emerald-500" : "bg-red-400"
                            }`} />
                            {r.status === "active" ? "Activo" : "Inactivo"}
                          </button>
                        </td>
                        <td className="px-2 sm:px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingResident(r)}
                              title="Editar"
                              className="inline-flex items-center gap-1 px-2 py-1.5 sm:px-2.5 rounded-lg text-xs font-medium text-tepuy-600 hover:text-tepuy-800 hover:bg-tepuy-100 transition-colors cursor-pointer"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                              </svg>
                              <span className="hidden sm:inline">Editar</span>
                            </button>
                            <button
                              onClick={() => setDeletingResident(r)}
                              title="Eliminar"
                              className="inline-flex items-center gap-1 px-2 py-1.5 sm:px-2.5 rounded-lg text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6" /><path d="M14 11v6" />
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                              </svg>
                              <span className="hidden sm:inline">Eliminar</span>
                            </button>
                          </div>
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
                  Página {page} de {totalPages} ({total} registros)
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="h-8 px-3 rounded-lg text-xs font-medium text-tepuy-600 hover:bg-tepuy-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="h-8 px-3 rounded-lg text-xs font-medium text-tepuy-600 hover:bg-tepuy-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateResidentModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
          onError={(msg) => showToast(msg, "error")}
        />
      )}

      {editingResident && (
        <EditResidentModal
          resident={editingResident}
          onClose={() => setEditingResident(null)}
          onUpdated={handleUpdated}
          onError={(msg) => showToast(msg, "error")}
        />
      )}

      {togglingResident && (
        <StatusToggleDialog
          resident={togglingResident}
          onClose={() => setTogglingResident(null)}
          onToggled={handleStatusToggled}
          onError={(msg) => showToast(msg, "error")}
        />
      )}

      {deletingResident && (
        <DeleteResidentDialog
          resident={deletingResident}
          onClose={() => setDeletingResident(null)}
          onDeleted={handleDeleted}
          onError={(msg) => showToast(msg, "error")}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
              toast.type === "success"
                ? "bg-emerald-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {toast.type === "success" ? (
                <path d="M20 6 9 17l-5-5" />
              ) : (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="12" />
                  <line x1="12" x2="12.01" y1="16" y2="16" />
                </>
              )}
            </svg>
            {toast.message}
          </div>
        </div>
      )}
    </main>
  );
}

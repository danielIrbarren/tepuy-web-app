"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { WORK_AREA_LABELS } from "@/lib/schemas/solicitud";

type RequestStatus = "pendiente" | "en_proceso" | "completado" | "cancelado";
type WebhookStatus = "pending" | "sent" | "failed";

interface Solicitud {
  id: string;
  resident_id: string;
  ci_usuario: string;
  nombre_usuario: string | null;
  descripcion_inmueble: string | null;
  nro_apto: string | null;
  tlf_usuario: string | null;
  gerencia: string | null;
  work_area: string;
  description: string;
  preferred_time: string | null;
  access_notes: string | null;
  request_status: RequestStatus;
  admin_notes: string | null;
  webhook_status: WebhookStatus;
  external_reference: string | null;
  created_at: string;
  updated_at: string;
}

const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pendiente:   "Pendiente",
  en_proceso:  "En proceso",
  completado:  "Completado",
  cancelado:   "Cancelado",
};

const REQUEST_STATUS_STYLES: Record<RequestStatus, string> = {
  pendiente:  "bg-amber-50 text-amber-700",
  en_proceso: "bg-blue-50 text-blue-700",
  completado: "bg-emerald-50 text-emerald-700",
  cancelado:  "bg-red-50 text-red-600",
};

const REQUEST_STATUS_DOT: Record<RequestStatus, string> = {
  pendiente:  "bg-amber-400",
  en_proceso: "bg-blue-400",
  completado: "bg-emerald-500",
  cancelado:  "bg-red-400",
};

const PER_PAGE = 25;

// ─── Edit Modal ─────────────────────────────────────────────────────────────

function EditSolicitudModal({
  solicitud,
  onClose,
  onUpdated,
  onError,
}: {
  solicitud: Solicitud;
  onClose: () => void;
  onUpdated: (s: Solicitud) => void;
  onError: (msg: string) => void;
}) {
  const [status, setStatus]     = useState<RequestStatus>(solicitud.request_status);
  const [notes, setNotes]       = useState(solicitud.admin_notes ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/solicitudes/${solicitud.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_status: status, admin_notes: notes }),
      });

      if (res.ok) {
        const data = await res.json();
        onUpdated(data.solicitud);
        onClose();
        return;
      }

      const data = await res.json();
      onError(data.error?.message ?? "Error al actualizar la solicitud.");
    } catch {
      onError("Error de conexión.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg glass-card rounded-2xl p-6 space-y-5 animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-tepuy-900">Editar solicitud</h2>
          <button onClick={onClose} className="text-tepuy-400 hover:text-tepuy-600 cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Info read-only */}
        <div className="bg-tepuy-50/60 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex gap-3">
            <span className="text-tepuy-400 w-24 shrink-0">CI</span>
            <span className="font-mono font-semibold text-tepuy-800">{solicitud.ci_usuario}</span>
          </div>
          <div className="flex gap-3">
            <span className="text-tepuy-400 w-24 shrink-0">Nombre</span>
            <span className="text-tepuy-700">{solicitud.nombre_usuario || "—"}</span>
          </div>
          <div className="flex gap-3">
            <span className="text-tepuy-400 w-24 shrink-0">Inmueble</span>
            <span className="text-tepuy-700">{solicitud.descripcion_inmueble || "—"}{solicitud.nro_apto ? ` · Apto ${solicitud.nro_apto}` : ""}</span>
          </div>
          <div className="flex gap-3">
            <span className="text-tepuy-400 w-24 shrink-0">Área</span>
            <span className="text-tepuy-700">{WORK_AREA_LABELS[solicitud.work_area as keyof typeof WORK_AREA_LABELS] ?? solicitud.work_area}</span>
          </div>
          <div className="flex gap-3">
            <span className="text-tepuy-400 w-24 shrink-0">Descripción</span>
            <span className="text-tepuy-700 leading-relaxed">{solicitud.description}</span>
          </div>
          {solicitud.preferred_time && (
            <div className="flex gap-3">
              <span className="text-tepuy-400 w-24 shrink-0">Horario</span>
              <span className="text-tepuy-700">{solicitud.preferred_time}</span>
            </div>
          )}
          {solicitud.access_notes && (
            <div className="flex gap-3">
              <span className="text-tepuy-400 w-24 shrink-0">Acceso</span>
              <span className="text-tepuy-700">{solicitud.access_notes}</span>
            </div>
          )}
        </div>

        {/* Status selector */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-tepuy-800">Estado</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(REQUEST_STATUS_LABELS) as RequestStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer ${
                  status === s
                    ? "border-tepuy-400 bg-tepuy-50 text-tepuy-800 shadow-sm"
                    : "border-transparent bg-tepuy-50/50 text-tepuy-600 hover:border-tepuy-200"
                }`}
              >
                <span className={`h-2 w-2 rounded-full shrink-0 ${REQUEST_STATUS_DOT[s]}`} />
                {REQUEST_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Admin notes */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-tepuy-800">Notas internas</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Observaciones internas del administrador..."
            className="w-full rounded-xl border border-tepuy-200 bg-white/90 px-4 py-3 text-sm text-tepuy-900 placeholder:text-tepuy-300 resize-none outline-none transition-all focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 h-10 rounded-xl border border-tepuy-200 text-sm font-medium text-tepuy-600 hover:bg-tepuy-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 h-10 rounded-xl btn-tepuy text-sm font-semibold text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Guardando...
              </>
            ) : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminSolicitudesPage() {
  const router = useRouter();

  const [solicitudes, setSolicitudes]   = useState<Solicitud[]>([]);
  const [total, setTotal]               = useState(0);
  const [totalPages, setTotalPages]     = useState(0);
  const [page, setPage]                 = useState(1);
  const [isLoading, setIsLoading]       = useState(true);

  // Filters
  const [search, setSearch]                       = useState("");
  const [residenciaFilter, setResidenciaFilter]   = useState("");
  const [workAreaFilter, setWorkAreaFilter]       = useState("");
  const [statusFilter, setStatusFilter]           = useState<string>("");
  const [debouncedSearch, setDebouncedSearch]     = useState("");
  const [debouncedResidencia, setDebouncedResidencia] = useState("");

  // Modal
  const [editingSolicitud, setEditingSolicitud] = useState<Solicitud | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedResidencia(residenciaFilter); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [residenciaFilter]);

  const fetchSolicitudes = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("per_page", String(PER_PAGE));
      if (debouncedSearch)    params.set("search", debouncedSearch);
      if (debouncedResidencia) params.set("residencia", debouncedResidencia);
      if (workAreaFilter)     params.set("work_area", workAreaFilter);
      if (statusFilter)       params.set("request_status", statusFilter);

      const res = await fetch(`/api/admin/solicitudes?${params.toString()}`);

      if (res.status === 401) { router.replace("/admin/login"); return; }
      if (!res.ok) throw new Error("Error fetching");

      const data = await res.json();
      setSolicitudes(data.solicitudes);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch {
      showToast("Error al cargar solicitudes.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, debouncedResidencia, workAreaFilter, statusFilter, router]);

  useEffect(() => { fetchSolicitudes(); }, [fetchSolicitudes]);

  const handleUpdated = (s: Solicitud) => {
    showToast("Solicitud actualizada.", "success");
    setSolicitudes((prev) => prev.map((x) => (x.id === s.id ? s : x)));
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <main className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="border-b border-tepuy-200/60 bg-white/80 backdrop-blur-md px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, oklch(0.50 0.13 170), oklch(0.43 0.11 170))" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" x2="8" y1="13" y2="13" />
                <line x1="16" x2="8" y1="17" y2="17" />
              </svg>
            </div>
            <h1 className="text-base font-bold text-tepuy-900">Solicitudes</h1>
            <span className="text-xs font-medium text-tepuy-400 bg-tepuy-50 px-2 py-0.5 rounded-full">
              {total}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/admin")}
              className="inline-flex items-center gap-1 rounded-lg border border-tepuy-200 px-2.5 py-1.5 text-xs font-medium text-tepuy-600 transition-colors duration-200 hover:bg-tepuy-50 cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Residentes
            </button>
            <button
              onClick={async () => { await fetch("/api/admin/logout", { method: "DELETE" }); router.push("/admin/login"); }}
              className="text-xs font-medium text-tepuy-500 hover:text-red-500 transition-colors duration-200 flex items-center gap-1 cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
              Salir
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-4">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            {/* Search CI */}
            <div className="relative flex-1 min-w-[160px]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-tepuy-300">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por CI..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-tepuy-200 bg-white/90 text-sm text-tepuy-900 placeholder:text-tepuy-300 outline-none transition-all focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15"
              />
            </div>

            {/* Residencia */}
            <div className="relative">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-tepuy-300">
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

            {/* Área de trabajo */}
            <select
              value={workAreaFilter}
              onChange={(e) => { setWorkAreaFilter(e.target.value); setPage(1); }}
              className="h-10 px-3 rounded-xl border border-tepuy-200 bg-white/90 text-sm text-tepuy-700 outline-none transition-all focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15 cursor-pointer"
            >
              <option value="">Todas las áreas</option>
              {Object.entries(WORK_AREA_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>

            {/* Estado de solicitud */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-10 px-3 rounded-xl border border-tepuy-200 bg-white/90 text-sm text-tepuy-700 outline-none transition-all focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15 cursor-pointer"
            >
              <option value="">Todos los estados</option>
              {(Object.keys(REQUEST_STATUS_LABELS) as RequestStatus[]).map((s) => (
                <option key={s} value={s}>{REQUEST_STATUS_LABELS[s]}</option>
              ))}
            </select>
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
                    <th className="text-left px-4 py-3 text-xs font-semibold text-tepuy-500 uppercase tracking-wider">Fecha</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-tepuy-500 uppercase tracking-wider">CI</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-tepuy-500 uppercase tracking-wider hidden sm:table-cell">Nombre</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-tepuy-500 uppercase tracking-wider hidden md:table-cell">Inmueble</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-tepuy-500 uppercase tracking-wider hidden lg:table-cell">Área</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-tepuy-500 uppercase tracking-wider">Estado</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-tepuy-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <div className="flex items-center justify-center gap-2 text-tepuy-400">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Cargando solicitudes...
                        </div>
                      </td>
                    </tr>
                  ) : solicitudes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-tepuy-400">
                        {debouncedSearch || debouncedResidencia || workAreaFilter || statusFilter
                          ? "No se encontraron solicitudes con esos filtros."
                          : "No hay solicitudes registradas."}
                      </td>
                    </tr>
                  ) : (
                    solicitudes.map((s) => (
                      <tr key={s.id} className="border-b border-tepuy-50 hover:bg-tepuy-50/50 transition-colors">
                        <td className="px-4 py-3 text-tepuy-500 text-xs whitespace-nowrap">{formatDate(s.created_at)}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-tepuy-800">{s.ci_usuario}</td>
                        <td className="px-4 py-3 text-tepuy-700 hidden sm:table-cell">{s.nombre_usuario || "—"}</td>
                        <td className="px-4 py-3 text-tepuy-600 hidden md:table-cell">
                          {s.descripcion_inmueble || "—"}
                          {s.nro_apto && <span className="text-tepuy-400 ml-1">· {s.nro_apto}</span>}
                        </td>
                        <td className="px-4 py-3 text-tepuy-600 hidden lg:table-cell">
                          {WORK_AREA_LABELS[s.work_area as keyof typeof WORK_AREA_LABELS] ?? s.work_area}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${REQUEST_STATUS_STYLES[s.request_status]}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${REQUEST_STATUS_DOT[s.request_status]}`} />
                            {REQUEST_STATUS_LABELS[s.request_status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setEditingSolicitud(s)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-tepuy-600 hover:text-tepuy-800 hover:bg-tepuy-100 transition-colors cursor-pointer"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            </svg>
                            Editar
                          </button>
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

      {/* Edit Modal */}
      {editingSolicitud && (
        <EditSolicitudModal
          solicitud={editingSolicitud}
          onClose={() => setEditingSolicitud(null)}
          onUpdated={handleUpdated}
          onError={(msg) => showToast(msg, "error")}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {toast.type === "success" ? (
                <path d="M20 6 9 17l-5-5" />
              ) : (
                <><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></>
              )}
            </svg>
            {toast.message}
          </div>
        </div>
      )}
    </main>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { AdminApiError, fetchAdminJson } from "@/lib/adminClient";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
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
  pendiente:  "Pendiente",
  en_proceso: "En proceso",
  completado: "Completado",
  cancelado:  "Cancelado",
};

const REQUEST_STATUS_STYLES: Record<RequestStatus, string> = {
  pendiente:  "bg-amber-50  text-amber-700  border border-amber-200",
  en_proceso: "bg-blue-50   text-blue-700   border border-blue-200",
  completado: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelado:  "bg-red-50    text-red-600    border border-red-200",
};

const REQUEST_STATUS_DOT: Record<RequestStatus, string> = {
  pendiente:  "bg-amber-400",
  en_proceso: "bg-blue-500",
  completado: "bg-emerald-500",
  cancelado:  "bg-red-400",
};

const PER_PAGE = 25;

// ─── Quick Status Dropdown ────────────────────────────────────────────────────

function QuickStatusMenu({
  solicitud,
  onUpdated,
  onError,
}: {
  solicitud: Solicitud;
  onUpdated: (s: Solicitud) => void;
  onError: (msg: string) => void;
}) {
  const [isOpen, setIsOpen]   = useState(false);
  const [isBusy, setIsBusy]   = useState(false);
  const menuRef               = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const handleChange = async (newStatus: RequestStatus) => {
    if (newStatus === solicitud.request_status) { setIsOpen(false); return; }
    setIsBusy(true);
    try {
      const data = await fetchAdminJson<{ solicitud: Solicitud }>(
        `/api/admin/solicitudes/${solicitud.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ request_status: newStatus }),
        },
        {
          fallbackMessage: "Error al actualizar.",
          onUnauthorized: () => {
            window.location.href = "/admin/login";
          },
        }
      );
      onUpdated(data.solicitud);
    } catch (error) {
      onError(
        error instanceof Error && error.message !== "Failed to fetch"
          ? error.message
          : "Error de conexión."
      );
    } finally {
      setIsBusy(false);
      setIsOpen(false);
    }
  };

  return (
    <div ref={menuRef} className="relative inline-block">
      <button
        type="button"
        disabled={isBusy}
        onClick={() => setIsOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer disabled:opacity-60 ${REQUEST_STATUS_STYLES[solicitud.request_status]}`}
      >
        {isBusy ? (
          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <span className={`h-1.5 w-1.5 rounded-full ${REQUEST_STATUS_DOT[solicitud.request_status]}`} />
        )}
        {REQUEST_STATUS_LABELS[solicitud.request_status]}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1.5 z-30 rounded-xl overflow-hidden min-w-[156px] animate-slide-down"
          style={{
            background: "white",
            border: "1px solid oklch(0.92 0.020 265)",
            boxShadow: "0 4px 16px oklch(0 0 0 / 0.10), 0 1px 4px oklch(0 0 0 / 0.06)",
          }}
        >
          {(Object.keys(REQUEST_STATUS_LABELS) as RequestStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleChange(s)}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-semibold transition-colors hover:bg-tepuy-50 ${
                s === solicitud.request_status ? "text-tepuy-600 bg-tepuy-50/60" : "text-tepuy-700"
              }`}
            >
              <span className={`h-2 w-2 rounded-full shrink-0 ${REQUEST_STATUS_DOT[s]}`} />
              {REQUEST_STATUS_LABELS[s]}
              {s === solicitud.request_status && (
                <svg className="ml-auto" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Detail / Edit Modal ──────────────────────────────────────────────────────

function SolicitudModal({
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
  const [status, setStatus]   = useState<RequestStatus>(solicitud.request_status);
  const [notes, setNotes]     = useState(solicitud.admin_notes ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const data = await fetchAdminJson<{ solicitud: Solicitud }>(
        `/api/admin/solicitudes/${solicitud.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ request_status: status, admin_notes: notes }),
        },
        {
          fallbackMessage: "Error al actualizar la solicitud.",
          onUnauthorized: () => {
            window.location.href = "/admin/login";
          },
        }
      );
      onUpdated(data.solicitud);
      onClose();
    } catch (error) {
      onError(
        error instanceof Error && error.message !== "Failed to fetch"
          ? error.message
          : "Error de conexión."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("es-VE", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const DetailRow = ({ label, value }: { label: string; value?: string | null }) =>
    value ? (
      <div className="flex flex-col gap-0.5 py-2.5 border-b border-tepuy-50 last:border-0">
        <span className="text-[9px] font-bold text-tepuy-400 uppercase tracking-widest">{label}</span>
        <span className="text-[13px] font-medium text-tepuy-900 leading-snug">{value}</span>
      </div>
    ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden animate-slide-up max-h-[92dvh] flex flex-col"
        style={{ background: "white", boxShadow: "0 -4px 32px oklch(0 0 0 / 0.15), 0 1px 0 oklch(0.92 0.020 265)" }}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-tepuy-200" />
        </div>

        {/* Modal header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-tepuy-100"
          style={{ background: "linear-gradient(135deg, #173077, #1e3d8f)" }}
        >
          <div>
            <h2 className="text-[15px] font-bold text-white tracking-tight">
              {solicitud.nombre_usuario || "Sin nombre"}
            </h2>
            <p className="text-white/60 text-[11px] font-mono mt-0.5">
              CI {solicitud.ci_usuario}
              {solicitud.descripcion_inmueble ? ` · ${solicitud.descripcion_inmueble}` : ""}
              {solicitud.nro_apto ? ` · Apto ${solicitud.nro_apto}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-colors cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Key details */}
          <div
            className="rounded-xl px-4 py-1"
            style={{ background: "oklch(0.978 0.004 200)", border: "1px solid oklch(0.92 0.020 265)" }}
          >
            <DetailRow label="Área de trabajo" value={WORK_AREA_LABELS[solicitud.work_area as keyof typeof WORK_AREA_LABELS] ?? solicitud.work_area} />
            <DetailRow label="Descripción" value={solicitud.description} />
            <DetailRow label="Horario preferido" value={solicitud.preferred_time} />
            <DetailRow label="Notas de acceso" value={solicitud.access_notes} />
            <DetailRow label="Teléfono" value={solicitud.tlf_usuario} />
            <DetailRow label="Fecha de solicitud" value={formatDate(solicitud.created_at)} />
            {solicitud.external_reference && (
              <DetailRow label="Referencia externa" value={solicitud.external_reference} />
            )}
          </div>

          {/* Status selector */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-tepuy-400 uppercase tracking-widest">Cambiar estado</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(REQUEST_STATUS_LABELS) as RequestStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all cursor-pointer text-[12px] font-semibold ${
                    status === s
                      ? "border-tepuy-500 bg-tepuy-50 text-tepuy-800 shadow-sm"
                      : "border-tepuy-100 bg-white text-tepuy-500 hover:border-tepuy-300"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full shrink-0 ${REQUEST_STATUS_DOT[s]}`} />
                  {REQUEST_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Admin notes */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-tepuy-400 uppercase tracking-widest">Notas internas</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Observaciones internas del administrador..."
              className="w-full rounded-xl border border-tepuy-200 bg-white px-4 py-3 text-[13px] text-tepuy-900 placeholder:text-tepuy-300 resize-none outline-none transition-all focus:border-tepuy-500 focus:ring-2 focus:ring-tepuy-500/12"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-tepuy-100 flex gap-2">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 h-11 rounded-xl border border-tepuy-200 text-[13px] font-semibold text-tepuy-600 hover:bg-tepuy-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-2 h-11 px-6 rounded-xl btn-tepuy text-[13px] font-bold text-white cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminSolicitudesPage() {
  const router = useRouter();

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [total, setTotal]             = useState(0);
  const [totalPages, setTotalPages]   = useState(0);
  const [page, setPage]               = useState(1);
  const [isLoading, setIsLoading]     = useState(true);

  // Filters
  const [search,              setSearch]              = useState("");
  const [residenciaFilter,    setResidenciaFilter]    = useState("");
  const [workAreaFilter,      setWorkAreaFilter]      = useState("");
  const [statusFilter,        setStatusFilter]        = useState<string>("");
  const [debouncedSearch,     setDebouncedSearch]     = useState("");
  const [debouncedResidencia, setDebouncedResidencia] = useState("");

  // Modal
  const [viewingSolicitud, setViewingSolicitud] = useState<Solicitud | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

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
      if (debouncedSearch)     params.set("search", debouncedSearch);
      if (debouncedResidencia) params.set("residencia", debouncedResidencia);
      if (workAreaFilter)      params.set("work_area", workAreaFilter);
      if (statusFilter)        params.set("request_status", statusFilter);

      const data = await fetchAdminJson<{ solicitudes: Solicitud[]; total: number; total_pages: number }>(
        `/api/admin/solicitudes?${params.toString()}`,
        undefined,
        {
          fallbackMessage: "Error al cargar solicitudes.",
          onUnauthorized: () => router.replace("/admin/login"),
        }
      );
      setSolicitudes(data.solicitudes);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) return;
      showToast("Error al cargar solicitudes.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, debouncedResidencia, workAreaFilter, statusFilter, router]);

  useEffect(() => { fetchSolicitudes(); }, [fetchSolicitudes]);

  const handleUpdated = (s: Solicitud) => {
    showToast("Solicitud actualizada.", "success");
    setSolicitudes((prev) => prev.map((x) => (x.id === s.id ? s : x)));
    // Update modal if open
    if (viewingSolicitud?.id === s.id) setViewingSolicitud(s);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" });

  const hasFilters = debouncedSearch || debouncedResidencia || workAreaFilter || statusFilter;

  return (
    <main className="flex-1 flex flex-col min-h-0 bg-tepuy-mesh">
      <AdminPageHeader title="Solicitudes" count={isLoading ? undefined : total} section="solicitudes" />

      {/* ─── Filters ─── */}
      <div className="px-4 py-3">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-2 flex-wrap">

            {/* Row 1 on mobile: search + residencia */}
            <div className="flex gap-2 flex-1">
              {/* Search CI */}
              <div className="relative flex-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-tepuy-400">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por CI..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-tepuy-200 bg-white/90 text-sm text-tepuy-900 placeholder:text-tepuy-300 outline-none transition-all focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15"
                />
              </div>

              {/* Residencia */}
              <div className="relative flex-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-tepuy-400">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <input
                  type="text"
                  placeholder="Residencia..."
                  value={residenciaFilter}
                  onChange={(e) => setResidenciaFilter(e.target.value)}
                  className="w-full sm:w-40 h-10 pl-9 pr-3.5 rounded-xl border border-tepuy-200 bg-white/90 text-sm text-tepuy-900 placeholder:text-tepuy-300 outline-none transition-all focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15"
                />
              </div>
            </div>

            {/* Row 2 on mobile: selects */}
            <div className="flex gap-2">
              {/* Work area */}
              <select
                value={workAreaFilter}
                onChange={(e) => { setWorkAreaFilter(e.target.value); setPage(1); }}
                className="flex-1 sm:flex-none h-10 px-3 rounded-xl border border-tepuy-200 bg-white/90 text-sm text-tepuy-700 outline-none transition-all focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15 cursor-pointer"
              >
                <option value="">Todas las áreas</option>
                {Object.entries(WORK_AREA_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>

              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="flex-1 sm:flex-none h-10 px-3 rounded-xl border border-tepuy-200 bg-white/90 text-sm text-tepuy-700 outline-none transition-all focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15 cursor-pointer"
              >
                <option value="">Todos los estados</option>
                {(Object.keys(REQUEST_STATUS_LABELS) as RequestStatus[]).map((s) => (
                  <option key={s} value={s}>{REQUEST_STATUS_LABELS[s]}</option>
                ))}
              </select>

              {/* Clear filters */}
              {hasFilters && (
                <button
                  onClick={() => { setSearch(""); setResidenciaFilter(""); setWorkAreaFilter(""); setStatusFilter(""); setPage(1); }}
                  className="h-10 px-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer whitespace-nowrap"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Table ─── */}
      <div className="flex-1 px-4 pb-4 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div
            className="rounded-2xl overflow-hidden bg-white"
            style={{ border: "1px solid oklch(0.92 0.020 265)", boxShadow: "0 1px 3px oklch(0 0 0 / 0.04), 0 4px 16px oklch(0.48 0.125 265 / 0.05)" }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "oklch(0.978 0.004 200)", borderBottom: "1px solid oklch(0.92 0.020 265)" }}>
                    <th className="text-left px-2 sm:px-4 py-3 text-[10px] font-bold text-tepuy-400 uppercase tracking-widest">Fecha</th>
                    <th className="text-left px-2 sm:px-4 py-3 text-[10px] font-bold text-tepuy-400 uppercase tracking-widest">CI</th>
                    <th className="text-left px-2 sm:px-4 py-3 text-[10px] font-bold text-tepuy-400 uppercase tracking-widest hidden sm:table-cell">Nombre</th>
                    <th className="text-left px-2 sm:px-4 py-3 text-[10px] font-bold text-tepuy-400 uppercase tracking-widest hidden md:table-cell">Inmueble</th>
                    <th className="text-left px-2 sm:px-4 py-3 text-[10px] font-bold text-tepuy-400 uppercase tracking-widest hidden lg:table-cell">Área</th>
                    <th className="text-center px-2 sm:px-4 py-3 text-[10px] font-bold text-tepuy-400 uppercase tracking-widest">Estado</th>
                    <th className="text-right px-2 sm:px-4 py-3 text-[10px] font-bold text-tepuy-400 uppercase tracking-widest">Ver</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-14 text-center">
                        <div className="flex items-center justify-center gap-2 text-tepuy-400">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span className="text-[13px] font-medium">Cargando solicitudes...</span>
                        </div>
                      </td>
                    </tr>
                  ) : solicitudes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-14 text-center text-[13px] text-tepuy-400">
                        {hasFilters
                          ? "No se encontraron solicitudes con esos filtros."
                          : "No hay solicitudes registradas."}
                      </td>
                    </tr>
                  ) : (
                    solicitudes.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-tepuy-50 hover:bg-tepuy-50/40 transition-colors"
                      >
                        <td className="px-2 sm:px-4 py-2.5 text-tepuy-400 text-[11px] sm:text-[12px] whitespace-nowrap font-medium">
                          {formatDate(s.created_at)}
                        </td>
                        <td className="px-2 sm:px-4 py-2.5 font-mono font-bold text-tepuy-800 text-xs sm:text-[13px]">
                          {s.ci_usuario}
                        </td>
                        <td className="px-2 sm:px-4 py-2.5 text-tepuy-700 text-[13px] hidden sm:table-cell">
                          {s.nombre_usuario || "—"}
                        </td>
                        <td className="px-2 sm:px-4 py-2.5 text-tepuy-600 text-[13px] hidden md:table-cell">
                          {s.descripcion_inmueble || "—"}
                          {s.nro_apto && (
                            <span className="text-tepuy-400 ml-1 font-medium">· {s.nro_apto}</span>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 py-2.5 text-tepuy-600 text-[13px] hidden lg:table-cell">
                          {WORK_AREA_LABELS[s.work_area as keyof typeof WORK_AREA_LABELS] ?? s.work_area}
                        </td>
                        {/* Status — clickable dropdown */}
                        <td className="px-2 sm:px-4 py-2.5 text-center">
                          <QuickStatusMenu
                            solicitud={s}
                            onUpdated={handleUpdated}
                            onError={(msg) => showToast(msg, "error")}
                          />
                        </td>
                        {/* Actions */}
                        <td className="px-2 sm:px-4 py-2.5 text-right">
                          <button
                            onClick={() => setViewingSolicitud(s)}
                            title="Ver detalle"
                            className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg border border-tepuy-200 text-[12px] font-semibold text-tepuy-600 hover:bg-tepuy-50 hover:border-tepuy-300 transition-colors cursor-pointer"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            <span className="hidden sm:inline">Ver detalle</span>
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
              <div
                className="flex items-center justify-between px-5 py-3 border-t border-tepuy-100"
                style={{ background: "oklch(0.978 0.004 200)" }}
              >
                <p className="text-[11px] text-tepuy-400 font-medium">
                  Página {page} de {totalPages} &middot; {total} registros
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(1)}
                    disabled={page <= 1}
                    className="h-8 w-8 rounded-lg text-[11px] font-bold text-tepuy-500 hover:bg-tepuy-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center justify-center"
                  >
                    «
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="h-8 px-3 rounded-lg text-[12px] font-semibold text-tepuy-600 hover:bg-tepuy-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="h-8 px-3 flex items-center text-[12px] font-bold text-tepuy-700 bg-tepuy-100 rounded-lg tabular-nums">
                    {page}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="h-8 px-3 rounded-lg text-[12px] font-semibold text-tepuy-600 hover:bg-tepuy-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Siguiente
                  </button>
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={page >= totalPages}
                    className="h-8 w-8 rounded-lg text-[11px] font-bold text-tepuy-500 hover:bg-tepuy-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center justify-center"
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail/Edit Modal */}
      {viewingSolicitud && (
        <SolicitudModal
          solicitud={viewingSolicitud}
          onClose={() => setViewingSolicitud(null)}
          onUpdated={handleUpdated}
          onError={(msg) => showToast(msg, "error")}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-slide-up">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px] font-semibold ${
              toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
            }`}
            style={{ boxShadow: "0 4px 16px oklch(0 0 0 / 0.20)" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

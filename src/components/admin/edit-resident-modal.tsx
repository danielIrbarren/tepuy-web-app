"use client";

import { useState } from "react";
import { AdminApiError, fetchAdminJson } from "@/lib/adminClient";
import type { ResidentAdmin } from "@/lib/schemas/admin";

interface EditResidentModalProps {
  resident: ResidentAdmin;
  onClose: () => void;
  onUpdated: (resident: ResidentAdmin) => void;
  onError: (message: string) => void;
}

export function EditResidentModal({ resident, onClose, onUpdated, onError }: EditResidentModalProps) {
  const [form, setForm] = useState({
    nombre_usuario: resident.nombre_usuario ?? "",
    tlf_usuario: resident.tlf_usuario ?? "",
    email_personal: resident.email_personal ?? "",
    email_institucional: resident.email_institucional ?? "",
    descripcion_inmueble: resident.descripcion_inmueble ?? "",
    nro_apto: resident.nro_apto ?? "",
    fase: resident.fase ?? "",
    gerencia: resident.gerencia ?? "",
    nombre_propietario: resident.nombre_propietario ?? "",
    ci_propietario: resident.ci_propietario ?? "",
    email_propietario: resident.email_propietario ?? "",
    tlf_propietario: resident.tlf_propietario ?? "",
    fecha_inicio_contrato: resident.fecha_inicio_contrato ?? "",
    supervisor_nombre: resident.supervisor_nombre ?? "",
    supervisor_tlf: resident.supervisor_tlf ?? "",
    supervisor_email: resident.supervisor_email ?? "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldError) setFieldError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFieldError(null);

    try {
      const data = await fetchAdminJson<{ resident: ResidentAdmin }>(
        `/api/admin/residentes/${resident.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
        {
          fallbackMessage: "Error al actualizar residente.",
          onUnauthorized: () => {
            window.location.href = "/admin/login";
          },
        }
      );

      onUpdated(data.resident);
      onClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al actualizar residente.";
      if (error instanceof AdminApiError && error.status === 400) {
        setFieldError(msg);
        return;
      }
      onError(msg === "Failed to fetch" ? "Error de conexión." : msg);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-tepuy-100 px-5 py-4 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-tepuy-900">Editar Residente</h2>
            <p className="text-xs text-tepuy-400 font-mono">{resident.ci_usuario}</p>
          </div>
          <button onClick={onClose} className="text-tepuy-400 hover:text-tepuy-700 transition-colors cursor-pointer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Datos del usuario */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-bold text-tepuy-500 uppercase tracking-wider">Datos del inquilino</legend>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-tepuy-700">CI</label>
                <input
                  type="text"
                  value={resident.ci_usuario}
                  disabled
                  className="w-full h-9 px-3 rounded-lg border border-tepuy-100 bg-tepuy-50 text-sm text-tepuy-400 cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-tepuy-700">Nombre</label>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={form.nombre_usuario}
                  onChange={(e) => updateField("nombre_usuario", e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-tepuy-200 text-sm outline-none focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-tepuy-700">Teléfono</label>
              <input
                type="text"
                placeholder="+58 412 1234567"
                value={form.tlf_usuario}
                onChange={(e) => updateField("tlf_usuario", e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-tepuy-200 text-sm outline-none focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-tepuy-700">Correo personal</label>
                <input
                  type="email"
                  placeholder="correo@gmail.com"
                  value={form.email_personal}
                  onChange={(e) => updateField("email_personal", e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-tepuy-200 text-sm outline-none focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-tepuy-700">Correo institucional</label>
                <input
                  type="email"
                  placeholder="usuario@pdvsa.com.ve"
                  value={form.email_institucional}
                  onChange={(e) => updateField("email_institucional", e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-tepuy-200 text-sm outline-none focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15"
                />
              </div>
            </div>
          </fieldset>

          {/* Datos de la unidad */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-bold text-tepuy-500 uppercase tracking-wider">Datos de la unidad</legend>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-tepuy-700">Descripción del inmueble</label>
              <input
                type="text"
                placeholder="Ej: Residencias Tepuy, Torre A"
                value={form.descripcion_inmueble}
                onChange={(e) => updateField("descripcion_inmueble", e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-tepuy-200 text-sm outline-none focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-tepuy-700">Nro. Apto</label>
                <input
                  type="text"
                  placeholder="Ej: 4-B"
                  value={form.nro_apto}
                  onChange={(e) => updateField("nro_apto", e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-tepuy-200 text-sm outline-none focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-tepuy-700">Fase</label>
                <input
                  type="text"
                  placeholder="Ej: Fase 1"
                  value={form.fase}
                  onChange={(e) => updateField("fase", e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-tepuy-200 text-sm outline-none focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-tepuy-700">Gerencia</label>
                <input
                  type="text"
                  placeholder="Ej: Norte"
                  value={form.gerencia}
                  onChange={(e) => updateField("gerencia", e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-tepuy-200 text-sm outline-none focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15"
                />
              </div>
            </div>
          </fieldset>

          {/* Datos del propietario */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-bold text-tepuy-500 uppercase tracking-wider">Datos del propietario</legend>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-tepuy-700">Nombre</label>
                <input
                  type="text"
                  placeholder="Nombre propietario"
                  value={form.nombre_propietario}
                  onChange={(e) => updateField("nombre_propietario", e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-tepuy-200 text-sm outline-none focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-tepuy-700">CI Propietario</label>
                <input
                  type="text"
                  placeholder="V12345678"
                  value={form.ci_propietario}
                  onChange={(e) => updateField("ci_propietario", e.target.value.toUpperCase())}
                  className="w-full h-9 px-3 rounded-lg border border-tepuy-200 text-sm outline-none focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-tepuy-700">Email</label>
                <input
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={form.email_propietario}
                  onChange={(e) => updateField("email_propietario", e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-tepuy-200 text-sm outline-none focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-tepuy-700">Teléfono</label>
                <input
                  type="text"
                  placeholder="+58 412 1234567"
                  value={form.tlf_propietario}
                  onChange={(e) => updateField("tlf_propietario", e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-tepuy-200 text-sm outline-none focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-tepuy-700">Inicio de contrato</label>
              <input
                type="date"
                value={form.fecha_inicio_contrato}
                onChange={(e) => updateField("fecha_inicio_contrato", e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-tepuy-200 text-sm outline-none focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15"
              />
            </div>
          </fieldset>

          {/* Supervisor asignado */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-bold text-tepuy-500 uppercase tracking-wider">Supervisor asignado</legend>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-tepuy-700">Nombre</label>
                <input
                  type="text"
                  placeholder="Nombre del supervisor"
                  value={form.supervisor_nombre}
                  onChange={(e) => updateField("supervisor_nombre", e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-tepuy-200 text-sm outline-none focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-tepuy-700">Teléfono</label>
                <input
                  type="text"
                  placeholder="+58 412 1234567"
                  value={form.supervisor_tlf}
                  onChange={(e) => updateField("supervisor_tlf", e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-tepuy-200 text-sm outline-none focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-tepuy-700">Correo</label>
              <input
                type="email"
                placeholder="supervisor@pdvsa.com.ve"
                value={form.supervisor_email}
                onChange={(e) => updateField("supervisor_email", e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-tepuy-200 text-sm outline-none focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15"
              />
            </div>
          </fieldset>

          {/* Field error */}
          {fieldError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 mt-0.5 shrink-0">
                <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              <p className="text-sm text-red-700 font-medium">{fieldError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-10 px-4 rounded-xl text-sm font-medium text-tepuy-600 hover:bg-tepuy-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-tepuy h-10 px-5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { ResidentAdmin } from "@/lib/schemas/admin";

interface StatusToggleDialogProps {
  resident: ResidentAdmin;
  onClose: () => void;
  onToggled: (resident: ResidentAdmin) => void;
  onError: (message: string) => void;
}

export function StatusToggleDialog({ resident, onClose, onToggled, onError }: StatusToggleDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isActive = resident.status === "active";
  const newStatus = isActive ? "inactive" : "active";

  const handleToggle = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/residentes/${resident.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        onError(data?.error?.message ?? "Error al cambiar estado.");
        onClose();
        return;
      }

      onToggled(data.resident);
      onClose();
    } catch {
      onError("Error de conexión.");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-scale-in p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex justify-center">
          <div className={`h-14 w-14 rounded-full flex items-center justify-center ${
            isActive ? "bg-red-50" : "bg-emerald-50"
          }`}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isActive ? "text-red-500" : "text-emerald-500"}
            >
              {isActive ? (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="12" />
                  <line x1="12" x2="12.01" y1="16" y2="16" />
                </>
              ) : (
                <path d="M20 6 9 17l-5-5" />
              )}
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-bold text-tepuy-900">
            {isActive ? "Desactivar residente" : "Reactivar residente"}
          </h3>
          <p className="text-sm text-tepuy-500">
            {isActive
              ? `¿Seguro que deseas desactivar a ${resident.nombre_usuario || resident.ci_usuario}? No podrá crear solicitudes de mantenimiento.`
              : `¿Deseas reactivar a ${resident.nombre_usuario || resident.ci_usuario}? Podrá volver a crear solicitudes.`}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 h-10 rounded-xl text-sm font-medium text-tepuy-600 border border-tepuy-200 hover:bg-tepuy-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleToggle}
            disabled={isSubmitting}
            className={`flex-1 h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed transition-colors ${
              isActive
                ? "bg-red-500 hover:bg-red-600"
                : "bg-emerald-500 hover:bg-emerald-600"
            }`}
          >
            {isSubmitting ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : isActive ? (
              "Desactivar"
            ) : (
              "Reactivar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

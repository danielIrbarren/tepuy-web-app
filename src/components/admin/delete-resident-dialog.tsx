"use client";

import { useState } from "react";
import type { ResidentAdmin } from "@/lib/schemas/admin";

interface DeleteResidentDialogProps {
  resident: ResidentAdmin;
  onClose: () => void;
  onDeleted: (id: string) => void;
  onError: (msg: string) => void;
}

export function DeleteResidentDialog({
  resident,
  onClose,
  onDeleted,
  onError,
}: DeleteResidentDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/residentes/${resident.id}`, {
        method: "DELETE",
      });

      if (res.status === 204) {
        onDeleted(resident.id);
        onClose();
        return;
      }

      const data = await res.json();
      onError(data.error?.message ?? "Error al eliminar el residente.");
      onClose();
    } catch {
      onError("Error de conexión al eliminar el residente.");
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm glass-card rounded-2xl p-6 space-y-4 animate-slide-up">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-500"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </div>
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-base font-bold text-tepuy-900">
            Eliminar residente
          </h2>
          <p className="text-sm text-tepuy-500 leading-relaxed">
            ¿Estás seguro de que deseas eliminar a{" "}
            <span className="font-semibold text-tepuy-800">
              {resident.nombre_usuario || resident.ci_usuario}
            </span>
            ? Esta acción no se puede deshacer.
          </p>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 h-10 rounded-xl border border-tepuy-200 text-sm font-medium text-tepuy-600 hover:bg-tepuy-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-semibold text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Eliminando...
              </>
            ) : (
              "Eliminar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

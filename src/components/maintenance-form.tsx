"use client";

import { useState } from "react";
import { ResidentCard } from "@/components/resident-card";
import {
  WorkArea,
  WORK_AREA_LABELS,
  type CreateSolicitudResponse,
  type SolicitudErrorResponse,
} from "@/lib/schemas/solicitud";
import type { ResidentPublic } from "@/lib/schemas/resident";

// Icons + colors for work areas (used in grid selector)
const WORK_AREA_CONFIG: Record<
  string,
  { emoji: string; bg: string; bgActive: string; border: string }
> = {
  plomeria: {
    emoji: "🔧",
    bg: "bg-blue-50",
    bgActive: "bg-blue-100",
    border: "border-blue-300",
  },
  electricidad: {
    emoji: "⚡",
    bg: "bg-amber-50",
    bgActive: "bg-amber-100",
    border: "border-amber-300",
  },
  aire_acondicionado: {
    emoji: "❄️",
    bg: "bg-cyan-50",
    bgActive: "bg-cyan-100",
    border: "border-cyan-300",
  },
  pintura: {
    emoji: "🎨",
    bg: "bg-pink-50",
    bgActive: "bg-pink-100",
    border: "border-pink-300",
  },
  cerrajeria: {
    emoji: "🔑",
    bg: "bg-orange-50",
    bgActive: "bg-orange-100",
    border: "border-orange-300",
  },
  albañileria: {
    emoji: "🧱",
    bg: "bg-stone-50",
    bgActive: "bg-stone-100",
    border: "border-stone-300",
  },
  otro: {
    emoji: "📋",
    bg: "bg-gray-50",
    bgActive: "bg-gray-100",
    border: "border-gray-300",
  },
};

interface MaintenanceFormProps {
  resident: ResidentPublic;
  onSuccess: (response: CreateSolicitudResponse) => void;
  onBack: () => void;
}

export function MaintenanceForm({
  resident,
  onSuccess,
  onBack,
}: MaintenanceFormProps) {
  const [workArea, setWorkArea] = useState<string>("");
  const [description, setDescription] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [accessNotes, setAccessNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const descriptionLength = description.length;
  const accessNotesLength = accessNotes.length;

  const isValid =
    workArea !== "" &&
    description.trim().length >= 10 &&
    descriptionLength <= 1000 &&
    accessNotesLength <= 300;

  const filledCount = [
    workArea !== "",
    description.trim().length >= 10,
  ].filter(Boolean).length;
  const formProgress = (filledCount / 2) * 100;

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resident_id: resident.id,
          work_area: workArea,
          description: description.trim(),
          preferred_time: preferredTime.trim() || undefined,
          access_notes: accessNotes.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data: CreateSolicitudResponse = await res.json();
        onSuccess(data);
        return;
      }

      const errorData: SolicitudErrorResponse = await res.json();

      switch (errorData.error.code) {
        case "RESIDENT_INACTIVE":
          setError(
            "Tu cuenta fue desactivada. Contacta a la administración de TEPUY."
          );
          break;
        case "RESIDENT_NOT_FOUND":
          setError("Residente no encontrado. Vuelve a iniciar el proceso.");
          break;
        case "VALIDATION_ERROR":
          setError(errorData.error.message);
          break;
        default:
          setError("Ocurrió un error inesperado. Intenta de nuevo.");
      }
    } catch {
      setError("Error de conexión. Verifica tu internet e intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Character counter color
  const descCountColor =
    descriptionLength > 1000
      ? "text-red-500"
      : descriptionLength > 800
        ? "text-amber-500"
        : "text-tepuy-400";

  const accessCountColor =
    accessNotesLength > 300 ? "text-red-500" : "text-tepuy-400";

  return (
    <div className="stagger-children space-y-5">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-tepuy-900">
          Solicitud de Mantenimiento
        </h2>
        <p className="text-sm text-muted-foreground">
          Completa los datos de tu solicitud
        </p>
      </div>

      {/* Resident recap — starts collapsed, tap to expand */}
      <ResidentCard resident={resident} compact />

      {/* Form card */}
      <div className="glass-card rounded-2xl p-5 space-y-5">
        {/* Mini form progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-tepuy-600 font-medium">
              Campos requeridos
            </span>
            <span className="text-tepuy-400">{filledCount}/2</span>
          </div>
          <div className="h-1 w-full rounded-full bg-tepuy-100 overflow-hidden">
            <div
              className="h-full rounded-full progress-fill"
              style={{
                background:
                  "linear-gradient(to right, oklch(0.68 0.14 170), oklch(0.58 0.14 170))",
                width: `${formProgress}%`,
              }}
            />
          </div>
        </div>

        {/* ─── Work Area — Grid Selector ─── */}
        <div className="space-y-2.5">
          <label className="text-sm font-semibold text-tepuy-800 flex items-center gap-1.5">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-tepuy-500"
            >
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
            Área de trabajo
            <span className="text-red-400 text-xs">*</span>
          </label>

          <div className="grid grid-cols-3 gap-2">
            {WorkArea.options.map((value) => {
              const config = WORK_AREA_CONFIG[value];
              const isSelected = workArea === value;
              return (
                <button
                  key={value}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setWorkArea(value);
                    if (error) setError(null);
                  }}
                  className={`
                    relative flex flex-col items-center gap-1.5 rounded-xl p-3 border-2
                    transition-all duration-200 cursor-pointer
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      isSelected
                        ? `${config.bgActive} ${config.border} shadow-sm scale-[1.02]`
                        : `${config.bg} border-transparent hover:border-tepuy-200 hover:shadow-sm`
                    }
                  `}
                >
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full flex items-center justify-center"
                      style={{ background: "oklch(0.58 0.14 170)" }}>
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                  )}
                  <span className="text-xl leading-none">{config.emoji}</span>
                  <span
                    className={`text-[11px] font-semibold leading-tight text-center ${
                      isSelected ? "text-tepuy-800" : "text-tepuy-600"
                    }`}
                  >
                    {WORK_AREA_LABELS[value]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Description — Floating Label Style ─── */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="description"
              className="text-sm font-semibold text-tepuy-800 flex items-center gap-1.5"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-tepuy-500"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
              Descripción del problema
              <span className="text-red-400 text-xs">*</span>
            </label>
            <span
              className={`text-xs font-medium tabular-nums transition-colors duration-200 ${descCountColor}`}
            >
              {descriptionLength}/1000
            </span>
          </div>

          <div className="relative">
            <textarea
              id="description"
              placeholder="Describe el problema que necesitas reportar..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (error) setError(null);
              }}
              disabled={isSubmitting}
              rows={4}
              className="w-full rounded-xl border border-tepuy-200 bg-white/90 px-4 py-3 pl-11 text-base text-tepuy-900 placeholder:text-tepuy-300 resize-none outline-none transition-all duration-200 focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15 disabled:opacity-50"
            />
            <div className="absolute left-3.5 top-3.5 text-tepuy-300">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" x2="8" y1="13" y2="13" />
                <line x1="16" x2="8" y1="17" y2="17" />
                <line x1="10" x2="8" y1="9" y2="9" />
              </svg>
            </div>
            {/* Progress bar under textarea */}
            <div className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-tepuy-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((descriptionLength / 1000) * 100, 100)}%`,
                  background:
                    descriptionLength > 1000
                      ? "oklch(0.577 0.245 27)"
                      : descriptionLength > 800
                        ? "oklch(0.7 0.15 70)"
                        : "oklch(0.58 0.14 170)",
                }}
              />
            </div>
          </div>

          {description.length > 0 && description.trim().length < 10 && (
            <p className="text-xs text-amber-500 font-medium flex items-center gap-1">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" x2="12" y1="9" y2="13" />
                <line x1="12" x2="12.01" y1="17" y2="17" />
              </svg>
              Mínimo 10 caracteres
            </p>
          )}
        </div>

        {/* ─── Optional fields ─── */}
        <div className="border-t border-tepuy-100 pt-4 space-y-4">
          <p className="text-xs font-medium text-tepuy-400 uppercase tracking-wider">
            Campos opcionales
          </p>

          {/* Preferred Time — with icon inside */}
          <div className="space-y-1.5">
            <label
              htmlFor="preferred-time"
              className="text-sm font-medium text-tepuy-700 flex items-center gap-1.5"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-tepuy-400"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Horario preferido
            </label>
            <div className="relative">
              <input
                id="preferred-time"
                type="text"
                placeholder="Ej: Lunes a viernes, 9am - 12pm"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl border border-tepuy-200 bg-white/90 px-4 pl-11 text-base text-tepuy-900 placeholder:text-tepuy-300 outline-none transition-all duration-200 focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15 disabled:opacity-50"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tepuy-300">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </div>
          </div>

          {/* Access Notes — with icon inside */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="access-notes"
                className="text-sm font-medium text-tepuy-700 flex items-center gap-1.5"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-tepuy-400"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Notas de acceso
              </label>
              {accessNotesLength > 0 && (
                <span
                  className={`text-xs font-medium tabular-nums transition-colors duration-200 ${accessCountColor}`}
                >
                  {accessNotesLength}/300
                </span>
              )}
            </div>
            <div className="relative">
              <textarea
                id="access-notes"
                placeholder="Ej: Tocar el timbre, dejar aviso en conserjería..."
                value={accessNotes}
                onChange={(e) => setAccessNotes(e.target.value)}
                disabled={isSubmitting}
                rows={2}
                className="w-full rounded-xl border border-tepuy-200 bg-white/90 px-4 py-3 pl-11 text-base text-tepuy-900 placeholder:text-tepuy-300 resize-none outline-none transition-all duration-200 focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15 disabled:opacity-50"
              />
              <div className="absolute left-3.5 top-3.5 text-tepuy-300">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 animate-slide-down">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-500 mt-0.5 shrink-0"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          <p
            role="alert"
            className="text-sm text-red-700 font-medium leading-snug"
          >
            {error}
          </p>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!isValid || isSubmitting}
        className="btn-tepuy w-full h-12 rounded-xl text-base font-semibold text-white flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Enviando solicitud...
          </>
        ) : (
          <>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m22 2-7 20-4-9-9-4z" />
              <path d="M22 2 11 13" />
            </svg>
            Enviar solicitud
          </>
        )}
      </button>

      {/* Back */}
      <button
        onClick={onBack}
        disabled={isSubmitting}
        className="w-full text-sm font-medium text-tepuy-500 hover:text-tepuy-700 transition-colors duration-200 py-2 cursor-pointer disabled:opacity-50"
      >
        &larr; Volver a mis datos
      </button>
    </div>
  );
}

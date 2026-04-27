"use client";

import { useState } from "react";
import {
  Wrench,
  Zap,
  Paintbrush,
  Hammer,
  Key,
  Wind,
  Layers,
  Droplets,
  LayoutGrid,
  Sparkles,
  ClipboardList,
  AlertTriangle,
  Clock,
  ChevronDown,
} from "lucide-react";
import { ResidentCard } from "@/components/resident-card";
import {
  WorkArea,
  WORK_AREA_LABELS,
  Criticality,
  type CreateSolicitudResponse,
  type SolicitudErrorResponse,
} from "@/lib/schemas/solicitud";
import type { ResidentPublic } from "@/lib/schemas/resident";

// Work areas excluded from UI (kept in DB enum)
const HIDDEN_WORK_AREAS = new Set(["jardineria"]);

// Ordered: "Otro" first, then the rest
const orderedWorkAreas = [
  "otro",
  ...WorkArea.options.filter((v) => v !== "otro" && !HIDDEN_WORK_AREAS.has(v)),
];

// Lucide icons per work area
const WORK_AREA_ICONS: Record<string, React.ReactNode> = {
  plomeria:           <Wrench size={18} strokeWidth={1.6} />,
  electricidad:       <Zap size={18} strokeWidth={1.6} />,
  pintura:            <Paintbrush size={18} strokeWidth={1.6} />,
  carpinteria:        <Hammer size={18} strokeWidth={1.6} />,
  cerrajeria:         <Key size={18} strokeWidth={1.6} />,
  aire_acondicionado: <Wind size={18} strokeWidth={1.6} />,
  albanileria:        <Layers size={18} strokeWidth={1.6} />,
  impermeabilizacion: <Droplets size={18} strokeWidth={1.6} />,
  vidrieria:          <LayoutGrid size={18} strokeWidth={1.6} />,
  limpieza:           <Sparkles size={18} strokeWidth={1.6} />,
  otro:               <ClipboardList size={18} strokeWidth={1.6} />,
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
  const [workArea,         setWorkArea]         = useState<string>("");
  const [criticality,      setCriticality]      = useState<string>("");
  const [description,      setDescription]      = useState("");
  const [isSubmitting,     setIsSubmitting]     = useState(false);
  const [error,            setError]            = useState<string | null>(null);

  const descriptionLength = description.length;

  const isValid =
    workArea !== "" &&
    criticality !== "" &&
    description.trim().length >= 10 &&
    descriptionLength <= 1000;

  const filledCount = [
    workArea !== "",
    criticality !== "",
    description.trim().length >= 10,
  ].filter(Boolean).length;
  const formProgress = (filledCount / 3) * 100;

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resident_id:    resident.id,
          work_area:      workArea,
          criticality,
          description:    description.trim(),
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
          setError("Su cuenta fue desactivada. Contacte a la administración de TEPUY.");
          break;
        case "RESIDENT_NOT_FOUND":
          setError("Usuario no encontrado. Vuelva a iniciar el proceso.");
          break;
        case "VALIDATION_ERROR":
          setError(errorData.error.message);
          break;
        default:
          setError("Ocurrió un error inesperado. Intente de nuevo.");
      }
    } catch {
      setError("Error de conexión. Verifique su internet e intente de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const descCountColor =
    descriptionLength > 1000 ? "text-red-500"
    : descriptionLength > 800  ? "text-amber-500"
    : "text-tepuy-400";

  const fieldLabel = "text-[11px] font-bold text-tepuy-500 uppercase tracking-[0.08em] flex items-center gap-1.5";

  return (
    <div className="stagger-children space-y-5">

      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-[20px] font-bold text-tepuy-900 tracking-tight">
          Solicitud de Mantenimiento
        </h2>
        <p className="text-sm text-tepuy-400">Complete los datos de su solicitud</p>
      </div>

      {/* Resident card */}
      <ResidentCard resident={resident} compact />

      {/* Form card */}
      <div
        className="rounded-2xl p-5 space-y-6 bg-white"
        style={{
          border: "1px solid oklch(0.92 0.020 265)",
          boxShadow: "0 1px 3px oklch(0 0 0 / 0.04), 0 4px 16px oklch(0.48 0.125 265 / 0.06)",
        }}
      >

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-tepuy-400 uppercase tracking-widest">Progreso</span>
            <span className="text-[10px] font-bold text-tepuy-500 tabular-nums">{filledCount} / 3</span>
          </div>
          <div className="h-1 w-full rounded-full bg-tepuy-100 overflow-hidden">
            <div
              className="h-full rounded-full progress-fill"
              style={{
                background: "linear-gradient(90deg, #173077, #7CC7ED)",
                width: `${formProgress}%`,
              }}
            />
          </div>
        </div>

        {/* ─── Área de trabajo — Dropdown ─── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="work-area-select" className={fieldLabel}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
              Área de trabajo
            </label>
            <span className="text-red-400 text-[10px] font-bold">Requerido</span>
          </div>
          <div className="relative">
            {/* Leading icon — shows selected area icon or default */}
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tepuy-400 pointer-events-none">
              {workArea && WORK_AREA_ICONS[workArea]
                ? WORK_AREA_ICONS[workArea]
                : <Wrench size={18} strokeWidth={1.6} />
              }
            </div>
            <select
              id="work-area-select"
              value={workArea}
              disabled={isSubmitting}
              onChange={(e) => { setWorkArea(e.target.value); if (error) setError(null); }}
              className="w-full h-12 appearance-none rounded-xl border border-tepuy-200 bg-white pl-11 pr-10 text-[14px] text-tepuy-900 outline-none transition-all duration-150 focus:border-tepuy-500 focus:ring-2 focus:ring-tepuy-500/12 disabled:opacity-50 cursor-pointer"
            >
              <option value="">Seleccionar área de trabajo...</option>
              {orderedWorkAreas.map((value) => (
                <option key={value} value={value}>
                  {WORK_AREA_LABELS[value as keyof typeof WORK_AREA_LABELS]}
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-tepuy-400 pointer-events-none">
              <ChevronDown size={16} strokeWidth={2} />
            </div>
          </div>
        </div>

        {/* ─── Criticidad ─── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className={fieldLabel}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              Criticidad de Atención
            </label>
            <span className="text-red-400 text-[10px] font-bold">Requerido</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {Criticality.options.map((value) => {
              const isSelected = criticality === value;
              const isUrgente  = value === "urgente";
              return (
                <button
                  key={value}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => { setCriticality(value); if (error) setError(null); }}
                  className={`
                    relative flex items-center gap-3 rounded-xl px-4 py-3
                    border transition-all duration-150 cursor-pointer text-left
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${isSelected
                      ? isUrgente
                        ? "bg-red-50 border-red-400 border-[1.5px] shadow-sm"
                        : "bg-sky-50 border-sky-400 border-[1.5px] shadow-sm"
                      : "bg-white border-tepuy-100 hover:border-tepuy-300 hover:bg-tepuy-50/40"
                    }
                  `}
                >
                  <div className={`shrink-0 ${
                    isSelected ? (isUrgente ? "text-red-500" : "text-sky-500") : "text-tepuy-300"
                  }`}>
                    {isUrgente ? <AlertTriangle size={18} strokeWidth={1.6} /> : <Clock size={18} strokeWidth={1.6} />}
                  </div>
                  <div>
                    <p className={`text-[11px] font-bold leading-tight ${
                      isSelected ? (isUrgente ? "text-red-700" : "text-sky-700") : "text-tepuy-700"
                    }`}>
                      {isUrgente ? "Urgente" : "Importante"}
                    </p>
                    <p className={`text-[10px] leading-tight mt-0.5 ${
                      isSelected ? (isUrgente ? "text-red-500" : "text-sky-500") : "text-tepuy-400"
                    }`}>
                      {isUrgente ? "Atención Inmediata" : "Atención Programada"}
                    </p>
                  </div>
                  {isSelected && (
                    <div
                      className="absolute top-1.5 right-1.5 h-3.5 w-3.5 rounded-full flex items-center justify-center"
                      style={{ background: isUrgente ? "oklch(0.577 0.245 27)" : "oklch(0.58 0.14 230)" }}
                    >
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Descripción ─── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="description" className={fieldLabel}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
              Detalles de la solicitud que deseas realizar
            </label>
            <span className={`text-[10px] font-bold tabular-nums ${descCountColor}`}>
              {descriptionLength}/1000
            </span>
          </div>

          <div className="relative">
            <textarea
              id="description"
              placeholder="Describe los detalles de tu solicitud..."
              value={description}
              onChange={(e) => { setDescription(e.target.value); if (error) setError(null); }}
              disabled={isSubmitting}
              rows={4}
              className="w-full rounded-xl border border-tepuy-200 bg-white px-4 py-3 pl-11 text-[14px] text-tepuy-900 placeholder:text-tepuy-300 resize-none outline-none transition-all duration-150 focus:border-tepuy-500 focus:ring-2 focus:ring-tepuy-500/12 disabled:opacity-50"
            />
            <div className="absolute left-3.5 top-3.5 text-tepuy-300">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" x2="8" y1="13" y2="13" />
                <line x1="16" x2="8" y1="17" y2="17" />
                <line x1="10" x2="8" y1="9" y2="9" />
              </svg>
            </div>
            <div className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-tepuy-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((descriptionLength / 1000) * 100, 100)}%`,
                  background: descriptionLength > 1000 ? "oklch(0.577 0.245 27)" : descriptionLength > 800 ? "oklch(0.7 0.15 70)" : "#173077",
                }}
              />
            </div>
          </div>

          {description.length > 0 && description.trim().length < 10 && (
            <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" />
              </svg>
              Mínimo 10 caracteres
            </p>
          )}
        </div>

      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 animate-slide-down">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          <p role="alert" className="text-[13px] text-red-700 font-semibold leading-snug">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!isValid || isSubmitting}
        className="btn-tepuy w-full h-12 rounded-xl text-[15px] font-bold text-white flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed tracking-wide"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Enviando solicitud...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" />
            </svg>
            Enviar solicitud
          </>
        )}
      </button>

      {/* Back */}
      <button
        onClick={onBack}
        disabled={isSubmitting}
        className="w-full text-[13px] font-semibold text-tepuy-400 hover:text-tepuy-600 transition-colors duration-150 py-2 cursor-pointer disabled:opacity-50"
      >
        &larr; Volver a sus datos
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResidentCard } from "@/components/resident-card";
import {
  WorkArea,
  WORK_AREA_LABELS,
  type CreateSolicitudResponse,
  type SolicitudErrorResponse,
} from "@/lib/schemas/solicitud";
import type { ResidentPublic } from "@/lib/schemas/resident";

// Icons for work areas
const WORK_AREA_ICONS: Record<string, string> = {
  plomeria: "🔧",
  electricidad: "⚡",
  aire_acondicionado: "❄️",
  pintura: "🎨",
  cerrajeria: "🔑",
  albañileria: "🧱",
  otro: "📋",
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

  // Progress based on completed fields
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

      {/* Resident recap - compact */}
      <ResidentCard resident={resident} compact />

      {/* Form card */}
      <div className="glass-card rounded-2xl p-5 space-y-5">
        {/* Mini form progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-tepuy-600 font-medium">Campos requeridos</span>
            <span className="text-tepuy-400">{filledCount}/2</span>
          </div>
          <div className="h-1 w-full rounded-full bg-tepuy-100 overflow-hidden">
            <div
              className="h-full rounded-full progress-fill"
              style={{
                background: "linear-gradient(to right, oklch(0.68 0.14 170), oklch(0.58 0.14 170))",
                width: `${formProgress}%`,
              }}
            />
          </div>
        </div>

        {/* Work Area — required */}
        <div className="space-y-1.5">
          <Label htmlFor="work-area" className="text-sm font-semibold text-tepuy-800 flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-tepuy-500">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
            Área de trabajo
            <span className="text-red-400 text-xs">*</span>
          </Label>
          <Select
            value={workArea}
            onValueChange={(val) => {
              if (val) setWorkArea(val);
              if (error) setError(null);
            }}
            disabled={isSubmitting}
          >
            <SelectTrigger id="work-area" className="h-12 text-base rounded-xl bg-white/80">
              <SelectValue placeholder="Selecciona el área del problema">
                {workArea ? (
                  <span className="flex items-center gap-2">
                    <span>{WORK_AREA_ICONS[workArea] || "📋"}</span>
                    <span>{WORK_AREA_LABELS[workArea as WorkArea]}</span>
                  </span>
                ) : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {WorkArea.options.map((value) => (
                <SelectItem key={value} value={value} className="text-base py-3">
                  <span className="flex items-center gap-2">
                    <span>{WORK_AREA_ICONS[value]}</span>
                    <span>{WORK_AREA_LABELS[value]}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description — required */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="description" className="text-sm font-semibold text-tepuy-800 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-tepuy-500">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
              Descripción del problema
              <span className="text-red-400 text-xs">*</span>
            </Label>
            <span
              className={`text-xs font-medium transition-colors duration-200 ${
                descriptionLength > 1000
                  ? "text-red-500"
                  : descriptionLength > 800
                    ? "text-amber-500"
                    : "text-tepuy-400"
              }`}
            >
              {descriptionLength}/1000
            </span>
          </div>
          <Textarea
            id="description"
            placeholder="Describe el problema. Ej: Hay una fuga de agua debajo del lavamanos del baño principal..."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (error) setError(null);
            }}
            disabled={isSubmitting}
            rows={4}
            className="text-base resize-none rounded-xl bg-white/80"
          />
          {description.length > 0 && description.trim().length < 10 && (
            <p className="text-xs text-amber-500 font-medium flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" />
              </svg>
              Mínimo 10 caracteres
            </p>
          )}
        </div>

        {/* Optional fields section */}
        <div className="border-t border-tepuy-100 pt-4 space-y-4">
          <p className="text-xs font-medium text-tepuy-400 uppercase tracking-wider">
            Campos opcionales
          </p>

          {/* Preferred Time */}
          <div className="space-y-1.5">
            <Label htmlFor="preferred-time" className="text-sm font-medium text-tepuy-700 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-tepuy-400">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              Horario preferido
            </Label>
            <Input
              id="preferred-time"
              placeholder="Ej: Lunes a viernes, 9am - 12pm"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              disabled={isSubmitting}
              className="h-12 text-base rounded-xl bg-white/80"
            />
          </div>

          {/* Access Notes */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="access-notes" className="text-sm font-medium text-tepuy-700 flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-tepuy-400">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Notas de acceso
              </Label>
              {accessNotesLength > 0 && (
                <span
                  className={`text-xs font-medium transition-colors duration-200 ${
                    accessNotesLength > 300
                      ? "text-red-500"
                      : "text-tepuy-400"
                  }`}
                >
                  {accessNotesLength}/300
                </span>
              )}
            </div>
            <Textarea
              id="access-notes"
              placeholder="Ej: Tocar el timbre, dejar aviso en conserjería..."
              value={accessNotes}
              onChange={(e) => setAccessNotes(e.target.value)}
              disabled={isSubmitting}
              rows={2}
              className="text-base resize-none rounded-xl bg-white/80"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 animate-slide-down">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          <p role="alert" className="text-sm text-red-700 font-medium leading-snug">
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
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Enviando solicitud...
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
        className="w-full text-sm font-medium text-tepuy-500 hover:text-tepuy-700 transition-colors duration-200 py-2 cursor-pointer disabled:opacity-50"
      >
        &larr; Volver a mis datos
      </button>
    </div>
  );
}

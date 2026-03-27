"use client";

import type { CreateSolicitudResponse } from "@/lib/schemas/solicitud";

interface SuccessScreenProps {
  response: CreateSolicitudResponse;
  onNewRequest: () => void;
}

export function SuccessScreen({ response, onNewRequest }: SuccessScreenProps) {
  const shortId = response.request_id.slice(-8).toUpperCase();

  return (
    <div className="space-y-6 text-center stagger-children">
      {/* Animated success icon */}
      <div className="flex justify-center">
        <div className="relative">
          {/* Pulse rings */}
          <div className="absolute inset-0 rounded-full bg-tepuy-400/20 animate-pulse-ring" />
          <div className="absolute inset-0 rounded-full bg-tepuy-400/10 animate-pulse-ring [animation-delay:0.3s]" />

          {/* Main circle */}
          <div className="relative h-20 w-20 rounded-full flex items-center justify-center shadow-lg animate-scale-in" style={{ background: "linear-gradient(135deg, oklch(0.68 0.14 170), oklch(0.50 0.13 170))", boxShadow: "0 10px 25px oklch(0.50 0.13 170 / 0.3)" }}>
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" className="animate-draw-check" />
            </svg>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-tepuy-900">
          Solicitud enviada
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Tu solicitud de mantenimiento fue registrada exitosamente.
          <br />
          Nos pondremos en contacto contigo pronto.
        </p>
      </div>

      {/* Reference ID card */}
      <div className="glass-card rounded-2xl overflow-hidden animate-count-up">
        {/* Accent top */}
        <div className="h-1" style={{ background: "linear-gradient(to right, oklch(0.68 0.14 170), oklch(0.58 0.14 170), oklch(0.68 0.14 170))" }} />
        <div className="p-6">
          <p className="text-xs font-medium text-tepuy-400 uppercase tracking-widest mb-2">
            Número de referencia
          </p>
          <div className="flex items-center justify-center gap-1">
            {shortId.split("").map((char, i) => (
              <span
                key={i}
                className="inline-flex h-10 w-8 items-center justify-center rounded-lg bg-tepuy-50 border border-tepuy-100 text-lg font-mono font-bold text-tepuy-700"
                style={{
                  animationDelay: `${i * 50 + 200}ms`,
                }}
              >
                {char}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground/60 mt-3 font-mono">
            {response.request_id}
          </p>
        </div>
      </div>

      {/* ClickUp link */}
      {response.task_url && (
        <a
          href={response.task_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-tepuy-600 hover:text-tepuy-700 transition-colors duration-200"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" x2="21" y1="14" y2="3" />
          </svg>
          Ver ticket de seguimiento
        </a>
      )}

      {/* Actions */}
      <div className="pt-2 space-y-3">
        <button
          onClick={onNewRequest}
          className="btn-tepuy w-full h-12 rounded-xl text-base font-semibold text-white flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" /><path d="M5 12h14" />
          </svg>
          Nueva solicitud
        </button>
        <p className="text-xs text-muted-foreground/60">
          Guarda tu número de referencia para futuras consultas.
        </p>
      </div>
    </div>
  );
}

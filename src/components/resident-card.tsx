"use client";

import { useState } from "react";
import type { ResidentPublic } from "@/lib/schemas/resident";

interface ResidentCardProps {
  resident: ResidentPublic;
  /** Start collapsed (used in form step) */
  compact?: boolean;
}

const FIELD_ICONS: Record<string, React.ReactNode> = {
  inmueble: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  apto: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" /><path d="M16 6h.01" />
      <path d="M12 6h.01" /><path d="M12 10h.01" />
      <path d="M12 14h.01" /><path d="M16 10h.01" />
      <path d="M16 14h.01" /><path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  ),
  gerencia: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  telefono: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 text-tepuy-400 shrink-0">{icon}</div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[9px] font-bold text-tepuy-400 uppercase tracking-[0.10em]">
          {label}
        </span>
        <span className="text-[13px] font-semibold text-tepuy-900 truncate">
          {value}
        </span>
      </div>
    </div>
  );
}

export function ResidentCard({ resident, compact }: ResidentCardProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  const displayName =
    resident.nombre_usuario || `Apto ${resident.nro_apto || "—"}`;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: "1px solid oklch(0.92 0.020 265)",
        boxShadow: "0 1px 3px oklch(0 0 0 / 0.05), 0 4px 16px oklch(0.48 0.125 265 / 0.08)",
      }}
    >
      {/* Header — clickable toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full px-5 py-4 flex items-center justify-between cursor-pointer"
        style={{
          background:
            "linear-gradient(135deg, #173077 0%, #1e3d8f 55%, #7CC7ED 100%)",
        }}
      >
        <div className="text-left">
          <h3 className="text-[15px] font-bold text-white tracking-tight">
            {displayName}
          </h3>
          <p className="text-white/60 text-[11px] font-medium mt-0.5 tracking-wide">
            CI: {resident.ci_usuario}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Status badge */}
          <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-2.5 py-1">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
            <span className="text-[10px] font-bold text-white tracking-wide">
              Activo
            </span>
          </div>
          {/* Chevron */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-300 opacity-70 ${
              isExpanded ? "rotate-180" : "rotate-0"
            }`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </button>

      {/* Expandable details */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out bg-white ${
          isExpanded ? "max-h-[360px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-5 py-1 divide-y divide-tepuy-100/70">
          <InfoRow
            icon={FIELD_ICONS.inmueble}
            label="Inmueble"
            value={resident.descripcion_inmueble}
          />
          <InfoRow
            icon={FIELD_ICONS.apto}
            label="Apartamento"
            value={resident.nro_apto}
          />
          <InfoRow
            icon={FIELD_ICONS.gerencia}
            label="Gerencia"
            value={resident.gerencia}
          />
          <InfoRow
            icon={FIELD_ICONS.telefono}
            label="Teléfono"
            value={resident.tlf_usuario}
          />
        </div>

        {/* Collapse button */}
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="w-full px-5 pb-3 pt-2 cursor-pointer group"
        >
          <p className="text-[10px] text-center text-tepuy-300 group-hover:text-tepuy-500 transition-colors tracking-wide">
            Toca para ocultar detalles
          </p>
        </button>
      </div>

      {/* Expand hint when collapsed */}
      {!isExpanded && (
        <div className="bg-white px-5 py-2.5 border-t border-tepuy-100">
          <p className="text-[10px] text-center text-tepuy-400 tracking-wide">
            Toca para ver detalles de tu vivienda
          </p>
        </div>
      )}
    </div>
  );
}

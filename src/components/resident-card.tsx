"use client";

import type { ResidentPublic } from "@/lib/schemas/resident";

interface ResidentCardProps {
  resident: ResidentPublic;
  compact?: boolean;
}

const FIELD_ICONS: Record<string, React.ReactNode> = {
  inmueble: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  apto: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" /><path d="M16 6h.01" />
      <path d="M12 6h.01" /><path d="M12 10h.01" />
      <path d="M12 14h.01" /><path d="M16 10h.01" />
      <path d="M16 14h.01" /><path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  ),
  fase: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  ),
  gerencia: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  telefono: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <div className="flex items-start gap-2.5 py-2">
      <div className="mt-0.5 text-tepuy-400 shrink-0">{icon}</div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[11px] font-medium text-tepuy-400 uppercase tracking-wider">
          {label}
        </span>
        <span className="text-sm font-semibold text-tepuy-900 truncate">
          {value}
        </span>
      </div>
    </div>
  );
}

export function ResidentCard({ resident, compact }: ResidentCardProps) {
  const displayName =
    resident.nombre_usuario || `Apto ${resident.nro_apto || "—"}`;

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header with accent stripe */}
      <div className="px-5 py-3.5" style={{ background: "linear-gradient(to right, oklch(0.58 0.14 170), oklch(0.68 0.14 170))" }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">{displayName}</h3>
            <p className="text-tepuy-100 text-xs font-medium mt-0.5">
              CI: {resident.ci_usuario}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1">
            <div className="h-1.5 w-1.5 rounded-full bg-green-300 animate-pulse" />
            <span className="text-[11px] font-semibold text-white">Activo</span>
          </div>
        </div>
      </div>

      {/* Details */}
      {!compact && (
        <div className="px-5 py-2 divide-y divide-tepuy-100/60">
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
            icon={FIELD_ICONS.fase}
            label="Fase"
            value={resident.fase}
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
      )}
    </div>
  );
}

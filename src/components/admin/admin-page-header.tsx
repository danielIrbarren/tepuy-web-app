"use client";

import { useRouter } from "next/navigation";
import { logoutAdmin } from "@/lib/adminClient";

type AdminSection = "residents" | "solicitudes" | "qr";

type AdminPageHeaderProps = {
  title: string;
  count?: number;
  section: AdminSection;
};

function SectionIcon({ section }: { section: AdminSection }) {
  if (section === "solicitudes") {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" x2="8" y1="13" y2="13" />
        <line x1="16" x2="8" y1="17" y2="17" />
      </svg>
    );
  }

  if (section === "qr") {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="5" height="5" x="3" y="3" rx="1" />
        <rect width="5" height="5" x="16" y="3" rx="1" />
        <rect width="5" height="5" x="3" y="16" rx="1" />
        <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
        <path d="M21 21v.01" />
        <path d="M12 7v3a2 2 0 0 1-2 2H7" />
        <path d="M3 12h.01" />
        <path d="M12 3h.01" />
        <path d="M12 16v.01" />
        <path d="M16 12h1" />
        <path d="M21 12v.01" />
        <path d="M12 21v-1" />
      </svg>
    );
  }

  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

type NavButtonProps = {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
};

function NavButton({ active, label, onClick, children }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 sm:px-3 text-[12px] font-semibold transition-colors cursor-pointer ${
        active
          ? "border-tepuy-300 bg-tepuy-50 text-tepuy-700"
          : "border-tepuy-200 bg-white text-tepuy-600 hover:bg-tepuy-50 hover:border-tepuy-300"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function AdminPageHeader({
  title,
  count,
  section,
}: AdminPageHeaderProps) {
  const router = useRouter();

  return (
    <div
      className="border-b border-tepuy-100 bg-white px-4 py-3"
      style={{ boxShadow: "0 1px 0 oklch(0.92 0.020 265), 0 2px 6px oklch(0 0 0 / 0.03)" }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(145deg, #1e3d8f, #173077)",
              boxShadow: "0 1px 4px rgba(23,48,119,0.35)",
            }}
          >
            <SectionIcon section={section} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[14px] font-bold text-tepuy-900 tracking-tight">{title}</h1>
              {typeof count === "number" && (
                <span className="text-[11px] font-bold text-tepuy-500 bg-tepuy-50 border border-tepuy-100 px-2 py-0.5 rounded-full tabular-nums">
                  {count}
                </span>
              )}
            </div>
            <p className="text-[10px] text-tepuy-400 font-medium">Panel de administración</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <NavButton active={section === "residents"} label="Residentes" onClick={() => router.push("/admin")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </NavButton>
          <NavButton active={section === "solicitudes"} label="Solicitudes" onClick={() => router.push("/admin/solicitudes")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" x2="8" y1="13" y2="13" />
              <line x1="16" x2="8" y1="17" y2="17" />
            </svg>
          </NavButton>
          <NavButton active={section === "qr"} label="QR" onClick={() => router.push("/admin/qr")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="5" height="5" x="3" y="3" rx="1" />
              <rect width="5" height="5" x="16" y="3" rx="1" />
              <rect width="5" height="5" x="3" y="16" rx="1" />
              <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
              <path d="M21 21v.01" />
              <path d="M12 7v3a2 2 0 0 1-2 2H7" />
              <path d="M3 12h.01" />
              <path d="M12 3h.01" />
              <path d="M7 21v.01" />
              <path d="M12 18v.01" />
              <path d="M17 12h.01" />
              <path d="M12 12v.01" />
            </svg>
          </NavButton>
          <button
            onClick={() => logoutAdmin(() => router.push("/admin/login"))}
            title="Salir"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 sm:px-3 text-[12px] font-semibold text-tepuy-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 border border-transparent transition-colors cursor-pointer"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { ResidentLookup } from "@/components/resident-lookup";
import { MaintenanceForm } from "@/components/maintenance-form";
import { SuccessScreen } from "@/components/success-screen";
import type { ResidentPublic } from "@/lib/schemas/resident";
import type { CreateSolicitudResponse } from "@/lib/schemas/solicitud";

type Step = "lookup" | "form" | "success";

const STEPS: { key: Step; label: string }[] = [
  { key: "lookup",  label: "Identificación" },
  { key: "form",    label: "Solicitud" },
  { key: "success", label: "Confirmación" },
];

export default function Home() {
  const [step, setStep]                       = useState<Step>("lookup");
  const [resident, setResident]               = useState<ResidentPublic | null>(null);
  const [solicitudResponse, setSolicitudResponse] = useState<CreateSolicitudResponse | null>(null);

  const handleResidentFound    = useCallback((found: ResidentPublic) => { setResident(found); setStep("form"); }, []);
  const handleSolicitudSuccess = useCallback((response: CreateSolicitudResponse) => { setSolicitudResponse(response); setStep("success"); }, []);
  const handleBackToLookup     = useCallback(() => { setStep("lookup"); }, []);
  const handleNewRequest       = useCallback(() => { setResident(null); setSolicitudResponse(null); setStep("lookup"); }, []);

  const currentIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-7 sm:py-10">
      <div className="w-full max-w-md space-y-7">

        {/* ─── Step indicator ─── */}
        <div className="relative flex items-start w-full">
          {/* Connector lines drawn behind the circles */}
          <div
            className="absolute h-px rounded-full transition-colors duration-500"
            style={{
              top: "14px",
              left: "calc(100% / 6)",
              right: "calc(100% / 6)",
              background: currentIndex > 0 ? "#173077" : "oklch(0.92 0.020 265)",
            }}
          />
          {/* Second connector segment colored separately based on step 2 completion */}
          <div
            className="absolute h-px rounded-full transition-colors duration-500"
            style={{
              top: "14px",
              left: "50%",
              right: "calc(100% / 6)",
              background: currentIndex > 1 ? "#173077" : "oklch(0.92 0.020 265)",
            }}
          />

          {STEPS.map((s, i) => {
            const isDone   = currentIndex > i;
            const isActive = currentIndex === i;
            return (
              <div key={s.key} className="flex-1 flex flex-col items-center gap-1.5 z-10">
                <div
                  className={`
                    h-7 w-7 rounded-full flex items-center justify-center
                    text-[11px] font-bold border-2 transition-all duration-400
                    ${isDone
                      ? "border-tepuy-500 bg-tepuy-500 text-white"
                      : isActive
                        ? "border-tepuy-500 bg-white text-tepuy-600 shadow-sm"
                        : "border-tepuy-200 bg-white text-tepuy-300"}
                  `}
                  style={isActive ? { boxShadow: "0 0 0 4px rgba(23,48,119,0.12)" } : undefined}
                >
                  {isDone ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold tracking-wide whitespace-nowrap transition-colors duration-300 ${
                    isActive ? "text-tepuy-700" : isDone ? "text-tepuy-500" : "text-tepuy-300"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* ─── Step content ─── */}
        <div key={step} className="animate-slide-up">
          {step === "lookup" && (
            <ResidentLookup onResidentFound={handleResidentFound} />
          )}

          {step === "form" && resident && (
            <MaintenanceForm
              resident={resident}
              onSuccess={handleSolicitudSuccess}
              onBack={handleBackToLookup}
            />
          )}

          {step === "success" && solicitudResponse && (
            <SuccessScreen
              response={solicitudResponse}
              onNewRequest={handleNewRequest}
            />
          )}
        </div>
      </div>
    </main>
  );
}

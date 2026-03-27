"use client";

import { useState, useCallback } from "react";
import { ResidentLookup } from "@/components/resident-lookup";
import { MaintenanceForm } from "@/components/maintenance-form";
import { SuccessScreen } from "@/components/success-screen";
import type { ResidentPublic } from "@/lib/schemas/resident";
import type { CreateSolicitudResponse } from "@/lib/schemas/solicitud";

type Step = "lookup" | "form" | "success";

const STEP_CONFIG: Record<Step, { index: number; label: string }> = {
  lookup: { index: 0, label: "Identificación" },
  form: { index: 1, label: "Solicitud" },
  success: { index: 2, label: "Confirmación" },
};

export default function Home() {
  const [step, setStep] = useState<Step>("lookup");
  const [resident, setResident] = useState<ResidentPublic | null>(null);
  const [solicitudResponse, setSolicitudResponse] =
    useState<CreateSolicitudResponse | null>(null);

  const handleResidentFound = useCallback((found: ResidentPublic) => {
    setResident(found);
    setStep("form");
  }, []);

  const handleSolicitudSuccess = useCallback(
    (response: CreateSolicitudResponse) => {
      setSolicitudResponse(response);
      setStep("success");
    },
    []
  );

  const handleBackToLookup = useCallback(() => {
    setStep("lookup");
  }, []);

  const handleNewRequest = useCallback(() => {
    setResident(null);
    setSolicitudResponse(null);
    setStep("lookup");
  }, []);

  const currentStep = STEP_CONFIG[step];

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-md space-y-6">
        {/* ─── Progress indicator ─── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            {Object.entries(STEP_CONFIG).map(([key, config]) => {
              const isActive = currentStep.index === config.index;
              const isDone = currentStep.index > config.index;
              return (
                <div key={key} className="flex items-center gap-1.5">
                  <div
                    className={`
                      flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold
                      transition-all duration-500
                      ${
                        isDone
                          ? "bg-tepuy-500 text-white scale-90"
                          : isActive
                            ? "bg-tepuy-500 text-white shadow-md shadow-tepuy-500/30 scale-110"
                            : "bg-tepuy-100 text-tepuy-400"
                      }
                    `}
                  >
                    {isDone ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    ) : (
                      config.index + 1
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium transition-colors duration-300 ${
                      isActive
                        ? "text-tepuy-700"
                        : isDone
                          ? "text-tepuy-500"
                          : "text-tepuy-300"
                    }`}
                  >
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Progress bar */}
          <div className="h-1 w-full rounded-full bg-tepuy-100 overflow-hidden">
            <div
              className="h-full rounded-full progress-fill"
              style={{
                background: "linear-gradient(to right, oklch(0.68 0.14 170), oklch(0.58 0.14 170))",
                width: `${((currentStep.index + 1) / 3) * 100}%`,
              }}
            />
          </div>
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

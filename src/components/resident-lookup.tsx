"use client";

import { useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { normalizeCi } from "@/lib/utils/normalize-ci";
import type {
  ResidentPublic,
  LookupErrorResponse,
  LookupSuccessResponse,
} from "@/lib/schemas/resident";

const MIN_CI_LENGTH = 6;

interface ResidentLookupProps {
  onResidentFound: (resident: ResidentPublic) => void;
}

export function ResidentLookup({ onResidentFound }: ResidentLookupProps) {
  const [ci, setCi]           = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const inputRef              = useRef<HTMLInputElement>(null);

  const isValidLength = ci.trim().length >= MIN_CI_LENGTH;

  const handleLookup = useCallback(async () => {
    const trimmed = ci.trim();
    if (trimmed.length < MIN_CI_LENGTH) return;

    const normalized = normalizeCi(trimmed);
    if (!normalized) {
      setError("Formato de cédula inválido. Utilice un formato como V12345678.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/residentes/lookup?ci=${encodeURIComponent(trimmed)}`
      );

      if (res.ok) {
        const data: LookupSuccessResponse = await res.json();
        onResidentFound(data.resident);
        return;
      }

      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After");
        const seconds = retryAfter ? parseInt(retryAfter, 10) : 60;
        setError(
          `Demasiados intentos. Espera ${seconds} segundo${seconds !== 1 ? "s" : ""} e intenta de nuevo.`
        );
        return;
      }

      const errorData: LookupErrorResponse = await res.json();

      switch (errorData.error.code) {
        case "NOT_FOUND":
          setError("No encontramos su cédula. Verifique el número e intente de nuevo.");
          break;
        case "INACTIVE":
          setError("Su cuenta está inactiva. Contacte a la administración de TEPUY.");
          break;
        case "INVALID_CI":
          setError("Formato de cédula inválido. Utilice un formato como V12345678.");
          break;
        default:
          setError("Ocurrió un error inesperado. Intente de nuevo.");
      }
    } catch {
      setError("Error de conexión. Verifique su internet e intente de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }, [ci, onResidentFound]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isValidLength && !isLoading) handleLookup();
  };

  return (
    <div className="w-full max-w-md mx-auto stagger-children">

      {/* Hero */}
      <div className="text-center space-y-4 mb-8">
        {/* Icon mark */}
        <div className="flex justify-center">
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(145deg, #1e3d8f, #173077)",
              boxShadow: "0 4px 16px rgba(23,48,119,0.28), 0 1px 3px rgba(0,0,0,0.10)",
            }}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-1.5">
          <h1 className="text-[22px] font-bold tracking-tight text-tepuy-900">
            Portal de Mantenimiento
          </h1>
          <p className="text-sm text-tepuy-500 leading-relaxed max-w-[260px] mx-auto">
            Ingrese su cédula para verificar su identidad como usuario de TEPUY.
          </p>
        </div>
      </div>

      {/* Lookup card */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        {/* Section label */}
        <p className="text-[10px] font-semibold text-tepuy-400 uppercase tracking-widest">
          Verificación de identidad
        </p>

        <div className="space-y-1.5">
          <label
            htmlFor="ci-input"
            className="text-sm font-semibold text-tepuy-800 flex items-center gap-1.5"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-tepuy-400"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" x2="22" y1="10" y2="10" />
            </svg>
            Cédula de Identidad
          </label>
          <Input
            id="ci-input"
            ref={inputRef}
            type="text"
            inputMode="text"
            autoComplete="off"
            autoFocus
            placeholder="Ej: V12345678"
            value={ci}
            onChange={(e) => { setCi(e.target.value); if (error) setError(null); }}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="h-11 text-[15px] rounded-xl bg-white border-tepuy-200 text-tepuy-900 placeholder:text-tepuy-300 focus:border-tepuy-500 focus:ring-2 focus:ring-tepuy-500/12"
            aria-describedby={error ? "ci-error" : undefined}
            aria-invalid={!!error}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-100 animate-slide-down">
            <svg
              width="15"
              height="15"
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
            <p id="ci-error" role="alert" className="text-sm text-red-700 font-medium leading-snug">
              {error}
            </p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleLookup}
          disabled={!isValidLength || isLoading}
          className="btn-tepuy w-full h-11 rounded-xl text-[15px] font-semibold text-white flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Verificando...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              Verificar identidad
            </>
          )}
        </button>
      </div>

      {/* Format hint */}
      <p className="text-[11px] text-center text-tepuy-300 mt-4 tracking-wide">
        Formatos aceptados: V12345678 &middot; 12345678 &middot; V-12.345.678
      </p>
    </div>
  );
}

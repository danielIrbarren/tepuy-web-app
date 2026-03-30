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
  const [ci, setCi] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isValidLength = ci.trim().length >= MIN_CI_LENGTH;

  const handleLookup = useCallback(async () => {
    const trimmed = ci.trim();
    if (trimmed.length < MIN_CI_LENGTH) return;

    const normalized = normalizeCi(trimmed);
    if (!normalized) {
      setError("Formato de cédula inválido. Use un formato como V12345678.");
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

      // Rate limit — leer Retry-After antes de parsear JSON
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
          setError(
            "No encontramos tu cédula. Verifica el número e intenta de nuevo."
          );
          break;
        case "INACTIVE":
          setError(
            "Tu cuenta está inactiva. Contacta a la administración de TEPUY."
          );
          break;
        case "INVALID_CI":
          setError(
            "Formato de cédula inválido. Use un formato como V12345678."
          );
          break;
        default:
          setError("Ocurrió un error inesperado. Intenta de nuevo.");
      }
    } catch {
      setError("Error de conexión. Verifica tu internet e intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }, [ci, onResidentFound]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isValidLength && !isLoading) {
      handleLookup();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto stagger-children">
      {/* Hero section */}
      <div className="text-center space-y-3 mb-8">
        {/* Decorative icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center shadow-sm animate-float" style={{ background: "linear-gradient(135deg, oklch(0.93 0.04 170), oklch(0.87 0.07 170))" }}>
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-tepuy-600"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" x2="3" y1="12" y2="12" />
              </svg>
            </div>
            {/* Subtle decorative dots */}
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-tepuy-300/50" />
            <div className="absolute -bottom-1 -left-1 h-2 w-2 rounded-full bg-tepuy-200/60" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-tepuy-900">
            Portal de Mantenimiento
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-[280px] mx-auto">
            Ingresa tu cédula para verificar tu identidad como residente de TEPUY.
          </p>
        </div>
      </div>

      {/* Lookup card */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="ci-input"
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
            onChange={(e) => {
              setCi(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="h-12 text-base rounded-xl bg-white/80"
            aria-describedby={error ? "ci-error" : undefined}
            aria-invalid={!!error}
          />
        </div>

        {/* Error message */}
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
              id="ci-error"
              role="alert"
              className="text-sm text-red-700 font-medium leading-snug"
            >
              {error}
            </p>
          </div>
        )}

        {/* Search button */}
        <button
          onClick={handleLookup}
          disabled={!isValidLength || isLoading}
          className="btn-tepuy w-full h-12 rounded-xl text-base font-semibold text-white flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
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
              Buscando...
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
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              Buscar
            </>
          )}
        </button>
      </div>

      {/* Format hint */}
      <p className="text-xs text-center text-muted-foreground/70 mt-4">
        Formatos aceptados: V12345678, 12345678, V-12.345.678
      </p>
    </div>
  );
}

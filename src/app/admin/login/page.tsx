"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.replace("/admin");
        return;
      }

      const data = await res.json();
      setError(data?.error?.message ?? "Error de autenticación.");
    } catch {
      setError("Error de conexión. Verifica tu internet e intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6 animate-slide-up">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-xl overflow-hidden p-4 shadow-sm" style={{ background: "white", border: "1px solid oklch(0.91 0.016 265)" }}>
              <Image
                src="/sabra-ifm-logo.png"
                alt="Sabra IFM"
                width={140}
                height={52}
                className="h-12 w-auto object-contain"
                priority
              />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-tepuy-900">
              Panel de Administración
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              TEPUY · Ingrese la contraseña de administrador
            </p>
          </div>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-5 space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="admin-password"
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
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
              Contraseña
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              autoFocus
              placeholder="Ingresa la contraseña"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              disabled={isLoading}
              className="w-full h-12 rounded-xl border border-tepuy-200 bg-white/90 px-4 text-base text-tepuy-900 placeholder:text-tepuy-300 outline-none transition-all duration-200 focus:border-tepuy-400 focus:ring-2 focus:ring-tepuy-400/15 disabled:opacity-50"
            />
          </div>

          {/* Error */}
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
              <p role="alert" className="text-sm text-red-700 font-medium leading-snug">
                {error}
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!password.trim() || isLoading}
            className="btn-tepuy w-full h-12 rounded-xl text-base font-semibold text-white flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Verificando...
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
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" x2="3" y1="12" y2="12" />
                </svg>
                Ingresar
              </>
            )}
          </button>
        </form>

        {/* Back link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-sm font-medium text-tepuy-500 hover:text-tepuy-700 transition-colors duration-200"
          >
            &larr; Volver al portal público
          </Link>
        </div>
      </div>
    </main>
  );
}

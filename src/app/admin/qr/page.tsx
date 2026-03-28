"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";

const PRODUCTION_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://tepuy.anvroc.com";

export default function AdminQRPage() {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          body > *:not(.print-area) { display: none !important; }
          .print-area {
            display: flex !important;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 2rem;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        <div className="animate-slide-up space-y-5">
          {/* Back button */}
          <button
            onClick={() => router.push("/admin")}
            className="no-print text-sm font-medium text-tepuy-500 hover:text-tepuy-700 transition-colors cursor-pointer flex items-center gap-1"
          >
            ← Volver al panel
          </button>

          {/* QR Card */}
          <div
            ref={printRef}
            className="print-area glass-card rounded-2xl p-8 space-y-6 text-center"
          >
            {/* Header */}
            <div className="space-y-2">
              <div className="flex justify-center">
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center shadow-sm"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.58 0.14 170), oklch(0.50 0.13 170))",
                  }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-lg font-bold text-tepuy-900">
                Portal de Mantenimiento TEPUY
              </h1>
              <p className="text-sm text-muted-foreground">
                Escanea el código QR para reportar una solicitud
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-tepuy-100">
                <QRCode
                  value={PRODUCTION_URL}
                  size={256}
                  level="H"
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>
            </div>

            {/* URL fallback */}
            <div className="space-y-1">
              <p className="text-xs text-tepuy-400 uppercase tracking-wider font-medium">
                O visita directamente
              </p>
              <p className="text-sm font-semibold text-tepuy-700 break-all">
                {PRODUCTION_URL}
              </p>
            </div>
          </div>

          {/* Print button */}
          <button
            onClick={handlePrint}
            className="no-print btn-tepuy w-full h-12 rounded-xl text-base font-semibold text-white flex items-center justify-center gap-2 cursor-pointer"
          >
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
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect width="12" height="8" x="6" y="14" />
            </svg>
            Imprimir QR
          </button>

          <p className="no-print text-[10px] text-center text-tepuy-300">
            Al imprimir solo se muestra el QR y la URL — sin interfaz del admin
          </p>
        </div>
      </main>
    </>
  );
}

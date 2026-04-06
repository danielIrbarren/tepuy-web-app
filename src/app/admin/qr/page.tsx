"use client";

import QRCode from "react-qr-code";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getPublicAppUrl } from "@/lib/publicAppUrl";

const PRODUCTION_URL = getPublicAppUrl();

export default function AdminQRPage() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style>{`
        @media print {
          /* Ocultar header/footer del layout raíz y controles del admin */
          header, footer, .no-print { display: none !important; }
          /* Fondo limpio para impresión */
          body { background: white !important; min-height: auto !important; }
          /* El QR ocupa toda la página centrado */
          .print-area {
            display: flex !important;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 2rem;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
        }
      `}</style>

      <AdminPageHeader title="QR" section="qr" />

      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-6">
        <div className="space-y-5 animate-slide-up">

          <div className="print-area glass-card rounded-2xl p-8 text-center space-y-6">
            <div className="space-y-2">
              <div className="flex justify-center">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl shadow-sm"
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
                Escanea el codigo QR para reportar una solicitud
              </p>
            </div>

            <div className="flex justify-center">
              <div className="rounded-xl border border-tepuy-100 bg-white p-4 shadow-sm">
                <QRCode
                  value={PRODUCTION_URL}
                  size={256}
                  level="H"
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-tepuy-400">
                O visita directamente
              </p>
              <p className="break-all text-sm font-semibold text-tepuy-700">
                {PRODUCTION_URL}
              </p>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="no-print btn-tepuy flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-semibold text-white cursor-pointer"
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

          <p className="no-print text-center text-[10px] text-tepuy-300">
            Al imprimir solo se muestra el QR y la URL.
          </p>
        </div>
      </main>
    </>
  );
}

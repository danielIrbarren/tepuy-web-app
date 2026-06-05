"use client";

import { useRef } from "react";
import QRCode from "react-qr-code";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getPublicAppUrl } from "@/lib/publicAppUrl";

const PRODUCTION_URL = getPublicAppUrl();

const CANVAS_W = 2048;
const CANVAS_H = 2560;
const COLOR_TITLE = "#152149";
const COLOR_SUBTITLE = "#6b7280";
const COLOR_LABEL = "#5a78b8";
const COLOR_URL = "#243a73";
const COLOR_BORDER = "#dde4f3";
const LOGO_GRADIENT_FROM = "#1e3d8f";
const LOGO_GRADIENT_TO = "#173077";

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export default function AdminQRPage() {
  const qrWrapperRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJpg = async () => {
    const svg = qrWrapperRef.current?.querySelector("svg");
    if (!svg) return;

    const QR_RENDER_SIZE = 1280;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(QR_RENDER_SIZE));
    clone.setAttribute("height", String(QR_RENDER_SIZE));

    const serialized = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([serialized], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    try {
      const qrImg = new Image();
      qrImg.decoding = "sync";
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => reject(new Error("No se pudo cargar el SVG"));
        qrImg.src = svgUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = CANVAS_W;
      canvas.height = CANVAS_H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      const cardPad = 96;
      roundedRectPath(
        ctx,
        cardPad,
        cardPad,
        CANVAS_W - cardPad * 2,
        CANVAS_H - cardPad * 2,
        80,
      );
      ctx.strokeStyle = COLOR_BORDER;
      ctx.lineWidth = 4;
      ctx.stroke();

      const logoSize = 192;
      const logoX = CANVAS_W / 2 - logoSize / 2;
      const logoY = cardPad + 128;
      const logoGrad = ctx.createLinearGradient(
        logoX,
        logoY,
        logoX + logoSize,
        logoY + logoSize,
      );
      logoGrad.addColorStop(0, LOGO_GRADIENT_FROM);
      logoGrad.addColorStop(1, LOGO_GRADIENT_TO);
      roundedRectPath(ctx, logoX, logoY, logoSize, logoSize, 48);
      ctx.fillStyle = logoGrad;
      ctx.fill();

      const iconViewBox = 24;
      const iconScale = (logoSize * 0.5) / iconViewBox;
      const iconOffsetX = logoX + (logoSize - iconViewBox * iconScale) / 2;
      const iconOffsetY = logoY + (logoSize - iconViewBox * iconScale) / 2;
      ctx.save();
      ctx.translate(iconOffsetX, iconOffsetY);
      ctx.scale(iconScale, iconScale);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      const iconPath = new Path2D("M 8 3 L 12 11 L 17 6 L 22 21 L 2 21 Z");
      ctx.stroke(iconPath);
      ctx.restore();

      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";

      const titleY = logoY + logoSize + 140;
      ctx.fillStyle = COLOR_TITLE;
      ctx.font =
        "bold 92px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("Portal de Mantenimiento Correctivo", CANVAS_W / 2, titleY);

      const subtitleY = titleY + 84;
      ctx.fillStyle = COLOR_SUBTITLE;
      ctx.font =
        "48px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(
        "Escanea el código QR para reportar una solicitud",
        CANVAS_W / 2,
        subtitleY,
      );

      const qrPad = 48;
      const qrBoxSize = QR_RENDER_SIZE + qrPad * 2;
      const qrBoxX = CANVAS_W / 2 - qrBoxSize / 2;
      const qrBoxY = subtitleY + 80;
      roundedRectPath(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 48);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = COLOR_BORDER;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.drawImage(
        qrImg,
        qrBoxX + qrPad,
        qrBoxY + qrPad,
        QR_RENDER_SIZE,
        QR_RENDER_SIZE,
      );

      const labelY = qrBoxY + qrBoxSize + 110;
      ctx.fillStyle = COLOR_LABEL;
      ctx.font =
        "600 36px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
      ctx.letterSpacing = "6px";
      ctx.fillText("O VISITA DIRECTAMENTE", CANVAS_W / 2, labelY);
      ctx.letterSpacing = "0px";

      const urlY = labelY + 90;
      ctx.fillStyle = COLOR_URL;
      ctx.font =
        "bold 64px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(PRODUCTION_URL, CANVAS_W / 2, urlY);

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 1.0),
      );
      if (!blob) return;

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "tepuy-qr.jpg";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
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
                    background: "linear-gradient(135deg, #1e3d8f, #173077)",
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
                Portal de Mantenimiento Correctivo
              </h1>
              <p className="text-sm text-muted-foreground">
                Escanea el codigo QR para reportar una solicitud
              </p>
            </div>

            <div className="flex justify-center">
              <div
                ref={qrWrapperRef}
                className="rounded-xl border border-tepuy-100 bg-white p-4 shadow-sm"
              >
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

          <button
            onClick={handleDownloadJpg}
            className="no-print flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-tepuy-200 bg-white text-base font-semibold text-tepuy-700 cursor-pointer hover:bg-tepuy-50 transition-colors"
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            Descargar QR (JPG)
          </button>

          <p className="no-print text-center text-[10px] text-tepuy-300">
            Imprime con QR + URL, o descarga JPG en {CANVAS_W}×{CANVAS_H} px con título, logo y URL.
          </p>
        </div>
      </main>
    </>
  );
}

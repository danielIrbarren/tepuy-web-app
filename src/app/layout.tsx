import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TEPUY — Portal de Mantenimiento",
  description:
    "Portal público de solicitudes de mantenimiento para residentes de TEPUY.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0d9488",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-tepuy-mesh text-foreground">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full bg-white border-b border-tepuy-100"
          style={{ boxShadow: "0 1px 0 oklch(0.92 0.020 170), 0 2px 8px oklch(0 0 0 / 0.04)" }}>
          {/* Brand accent line */}
          <div
            className="h-[3px] w-full"
            style={{
              background: "linear-gradient(90deg, oklch(0.56 0.140 170) 0%, oklch(0.67 0.135 170) 60%, oklch(0.78 0.105 170) 100%)",
            }}
          />
          <div className="flex h-12 items-center justify-center px-4">
            <div className="flex items-center gap-3">
              {/* Logotype mark */}
              <div
                className="flex h-7 w-7 items-center justify-center rounded-md"
                style={{
                  background: "linear-gradient(145deg, oklch(0.56 0.140 170), oklch(0.40 0.105 170))",
                  boxShadow: "0 1px 3px oklch(0.48 0.125 170 / 0.35)",
                }}
              >
                <svg
                  width="15"
                  height="15"
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
              {/* Text */}
              <div className="flex flex-col leading-none gap-0.5">
                <span className="text-[13px] font-bold tracking-[0.06em] text-tepuy-900">
                  TEPUY
                </span>
                <span className="text-[9px] font-semibold text-tepuy-400 tracking-[0.12em] uppercase">
                  Mantenimiento
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        {children}

        {/* Footer */}
        <footer className="py-5 text-center border-t border-tepuy-100/60">
          <p className="text-[11px] text-tepuy-300 tracking-wide">
            TEPUY &middot; Portal de Mantenimiento &middot; {new Date().getFullYear()}
          </p>
        </footer>
      </body>
    </html>
  );
}

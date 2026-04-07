import type { Metadata, Viewport } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import Image from "next/image";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sabra IFM — Portal de Mantenimiento TEPUY",
  description:
    "Portal público de solicitudes de mantenimiento para residentes de TEPUY. Gestionado por Sabra IFM.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#173077",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-tepuy-mesh text-foreground">
        {/* Header */}
        <header
          className="sticky top-0 z-50 w-full bg-white border-b border-tepuy-100"
          style={{ boxShadow: "0 1px 0 oklch(0.91 0.016 265), 0 2px 8px oklch(0 0 0 / 0.04)" }}
        >
          {/* Brand accent line — mirrors the Sabra IFM logo columns: sky-blue → navy → orange */}
          <div
            className="h-[3px] w-full"
            style={{
              background: "linear-gradient(90deg, #7CC7ED 0%, #173077 55%, #D75535 100%)",
            }}
          />
          <div className="flex h-14 items-center justify-center px-4">
            <div className="flex items-center gap-3">
              {/* Sabra IFM logo */}
              <Image
                src="/sabra-ifm-logo.png"
                alt="Sabra IFM"
                width={110}
                height={40}
                className="h-8 w-auto object-contain"
                priority
              />
              {/* Separator */}
              <div className="h-6 w-px bg-tepuy-200" />
              {/* Property label */}
              <div className="flex flex-col leading-none gap-0.5">
                <span className="text-[13px] font-semibold tracking-[0.06em] text-tepuy-900">
                  TEPUY
                </span>
                <span className="text-[9px] font-medium text-tepuy-400 tracking-[0.14em] uppercase">
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
            Sabra IFM &middot; TEPUY &middot; Portal de Mantenimiento &middot; {new Date().getFullYear()}
          </p>
        </footer>
      </body>
    </html>
  );
}

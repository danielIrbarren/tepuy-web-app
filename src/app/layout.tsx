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
        <header className="sticky top-0 z-50 w-full border-b border-tepuy-200/60 bg-white/70 backdrop-blur-lg">
          <div className="flex h-14 items-center justify-center px-4">
            <div className="flex items-center gap-2.5">
              {/* Mountain icon */}
              <div className="flex h-8 w-8 items-center justify-center rounded-lg shadow-sm" style={{ background: "linear-gradient(135deg, oklch(0.58 0.14 170), oklch(0.50 0.13 170))" }}>
                <svg
                  width="18"
                  height="18"
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
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold tracking-tight text-tepuy-900">
                  TEPUY
                </span>
                <span className="text-[10px] font-medium text-tepuy-500 tracking-wide">
                  MANTENIMIENTO
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        {children}

        {/* Footer */}
        <footer className="py-4 text-center">
          <p className="text-xs text-muted-foreground/60">
            Portal de Mantenimiento TEPUY &middot; {new Date().getFullYear()}
          </p>
        </footer>
      </body>
    </html>
  );
}

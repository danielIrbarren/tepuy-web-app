import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy (Next.js 16 — replaces middleware.ts)
 *
 * Optimistic auth check: only reads the cookie — no DB call.
 * The real session validation happens in requireAdmin() (lib/adminAuth.ts).
 *
 * Criteria satisfied:
 * - G-US-07: "Navegar a /admin sin sesión redirige a /admin/login automáticamente"
 * - G-03:    "Sin cookie válida, /admin redirige a /admin/login"
 */

const ADMIN_SESSION_COOKIE = "tepuy_admin_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes (not /admin/login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

// Only run proxy on admin routes — skip API, static assets, etc.
export const config = {
  matcher: ["/admin/:path*"],
};

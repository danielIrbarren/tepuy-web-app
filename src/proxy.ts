import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_SESSION_COOKIE = "tepuy_admin_session";

/**
 * Proxy de Next.js 16 — ejecuta en CADA request que coincida con el matcher.
 *
 * Responsabilidades:
 *   1. Inyectar X-Correlation-Id en todas las responses (D-06 observabilidad)
 *   2. Protección optimista de /admin/* — redirige a login si no hay cookie
 *      (la validación real de la sesión ocurre en requireAdmin() de cada Route Handler)
 */
export function proxy(request: NextRequest) {
  const correlationId = crypto.randomUUID();
  const path = request.nextUrl.pathname;

  // Auth check para /admin/* (excepto /admin/login)
  if (path.startsWith("/admin") && path !== "/admin/login") {
    const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

    if (!sessionCookie) {
      const loginUrl = new URL("/admin/login", request.nextUrl);
      const redirectResponse = NextResponse.redirect(loginUrl);
      redirectResponse.headers.set("x-correlation-id", correlationId);
      return redirectResponse;
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-correlation-id", correlationId);
  return response;
}

export const config = {
  matcher: [
    // Admin routes — auth check
    "/admin/:path*",
    // API routes — correlation ID
    "/api/:path*",
    // Public page — correlation ID
    "/",
  ],
};

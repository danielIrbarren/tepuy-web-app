import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_SESSION_COOKIE = "tepuy_admin_session";

/**
 * Proxy (Next.js 16) — optimistic auth check for /admin/* routes.
 *
 * Solo verifica presencia de cookie (NO consulta DB).
 * La validación real ocurre en requireAdmin() dentro de cada Route Handler.
 */
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Solo proteger rutas /admin (excepto /admin/login)
  if (path.startsWith("/admin") && path !== "/admin/login") {
    const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/admin/login", request.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

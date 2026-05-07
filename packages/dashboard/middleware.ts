import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decode } from "next-auth/jwt";

const authenticatedAuthRoutes = ["/auth/workspace-select", "/auth/success", "/auth/redirect"];

/**
 * Cross-origin auth model (P0.4 — settings industrial plan)
 *
 * Editor (editor.buildrik.com) and dashboard (app.buildrik.com) are SAME-SITE
 * under buildrik.com. Existing NextAuth `SameSite=lax` cookie + `credentials: "include"`
 * on the editor's tRPC client handles cross-origin auth without SameSite=None.
 *
 * Dev: editor at localhost:5050 hits dashboard at localhost:3000 via Vite's
 * `/api` proxy (see packages/editor/vite.config.ts) — same-origin from browser POV.
 * Prod: editor.buildrik.com calls app.buildrik.com directly. Browser sends the
 * `__Secure-next-auth.session-token` cookie because both share the eTLD+1.
 *
 * EDITOR_ORIGIN env var pins the allowed origin for CORS preflight responses.
 * Set to the editor's prod URL in Vercel env. No wildcard — explicit allowlist only.
 */
const EDITOR_ORIGIN = process.env.EDITOR_ORIGIN || "http://localhost:5050";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Handle CORS preflight for API routes (editor cross-origin tRPC calls)
  if (pathname.startsWith("/api/") && req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": EDITOR_ORIGIN,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Validate JWT properly instead of just checking cookie existence
  const isSecure = process.env.NODE_ENV === "production";
  const cookieName = isSecure
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";
  const sessionToken = req.cookies.get(cookieName)?.value;

  let isLoggedIn = false;
  if (sessionToken) {
    try {
      const decoded = await decode({
        token: sessionToken,
        secret: process.env.NEXTAUTH_SECRET!,
        salt: cookieName,
      });
      isLoggedIn = !!decoded?.sub;
    } catch {
      isLoggedIn = false;
    }
  }

  // Auth pages: redirect logged-in users to dashboard
  const isAuthRoute = pathname.startsWith("/auth");
  const isAuthenticatedAuth = authenticatedAuthRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isAuthRoute && !isAuthenticatedAuth && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isAuthenticatedAuth && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // Dashboard: redirect unauthenticated users to login
  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // Onboarding: redirect unauthenticated users to login
  if (pathname.startsWith("/onboarding") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/auth/:path*", "/dashboard/:path*", "/onboarding/:path*"],
};

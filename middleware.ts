import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const authenticatedAuthRoutes = ["/auth/workspace-select", "/auth/success"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionToken =
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value;
  const isLoggedIn = !!sessionToken;

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

  return NextResponse.next();
}

export const config = {
  matcher: ["/auth/:path*", "/dashboard/:path*"],
};

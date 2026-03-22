import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decode } from "next-auth/jwt";

const authenticatedAuthRoutes = ["/auth/workspace-select", "/auth/success"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Validate JWT properly instead of just checking cookie existence
  const sessionToken =
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  let isLoggedIn = false;
  if (sessionToken) {
    try {
      const decoded = await decode({
        token: sessionToken,
        secret: process.env.NEXTAUTH_SECRET!,
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/auth/:path*", "/dashboard/:path*"],
};

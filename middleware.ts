import { auth } from "@/server/auth";
import { NextResponse } from "next/server";

const publicAuthRoutes = [
  "/auth",
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/check-inbox",
  "/auth/reset-password",
  "/auth/password-changed",
  "/auth/verify-email",
  "/auth/2fa",
  "/auth/magic-link",
  "/auth/otp",
  "/auth/splash",
  "/auth/callback",
  "/auth/invite",
  "/auth/error",
];

const authenticatedAuthRoutes = [
  "/auth/workspace-select",
  "/auth/success",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const isPublicAuth = publicAuthRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  const isAuthenticatedAuth = authenticatedAuthRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isPublicAuth && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isAuthenticatedAuth && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/auth/:path*", "/dashboard/:path*"],
};

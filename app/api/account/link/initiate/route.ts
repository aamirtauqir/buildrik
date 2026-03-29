import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { validateToken } from "@/server/services/token.service";

// GET /api/account/link/initiate?token=...&provider=...
// Called by navigating the browser here after trpc.account.initiateLinking mints a link_token.
// Validates the token against the current session, sets an HttpOnly cookie,
// then redirects into the OAuth flow for the chosen provider.
// The token is validated a second time inside the signIn callback before any account is linked.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  const { searchParams } = req.nextUrl;
  const linkToken = searchParams.get("token");
  const provider = searchParams.get("provider");

  if (!linkToken || !provider || !["google", "github"].includes(provider)) {
    return NextResponse.redirect(
      new URL("/dashboard/settings/account?link_error=invalid_token", req.url)
    );
  }

  // Verify the token belongs to the current session user before setting the cookie.
  // Prevents a logged-in user from injecting another user's link_token via URL.
  const tokenUserId = await validateToken(linkToken, "link_token");
  if (!tokenUserId || tokenUserId !== session.user.id) {
    return NextResponse.redirect(
      new URL("/dashboard/settings/account?link_error=invalid_token", req.url)
    );
  }

  const response = NextResponse.redirect(
    new URL(`/api/auth/signin/${provider}`, req.url)
  );
  response.cookies.set("buildrik_link_token", linkToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",  // must be lax — OAuth callback is a cross-site redirect
    path: "/",
    maxAge: 5 * 60,
  });

  return response;
}

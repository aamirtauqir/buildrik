import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  const isSecure = process.env.NODE_ENV === "production";
  const cookieName = isSecure ? "__Secure-next-auth.session-token" : "next-auth.session-token";

  response.cookies.set(cookieName, "", {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 0, // Expire immediately
  });

  return response;
}

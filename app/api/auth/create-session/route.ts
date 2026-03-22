import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateToken, invalidateToken } from "@/server/services/token.service";
import { encode } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  const { sessionToken } = await req.json();

  const userId = await validateToken(sessionToken, "session_grant");
  if (!userId) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  await invalidateToken(sessionToken);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Create JWT token directly instead of using signIn("credentials")
  const token = await encode({
    token: {
      sub: user.id,
      email: user.email,
      name: user.fullName,
      userId: user.id,
    },
    secret: process.env.NEXTAUTH_SECRET!,
  });

  // Set the session cookie
  const response = NextResponse.json({ success: true });
  const isSecure = process.env.NODE_ENV === "production";
  const cookieName = isSecure
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return response;
}

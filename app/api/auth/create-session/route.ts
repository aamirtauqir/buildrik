import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { validateToken, invalidateToken } from "@/server/services/token.service";
import { encode } from "next-auth/jwt";
import { logAuditEvent } from "@/server/services/audit.service";

const createSessionSchema = z.object({
  sessionToken: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { sessionToken } = parsed.data;

  // CSRF: verify request comes from same origin
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  if (origin && !origin.startsWith(appUrl)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!origin && referer && !referer.startsWith(appUrl)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
  const isSecure = process.env.NODE_ENV === "production";
  const cookieName = isSecure
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

  const token = await encode({
    token: {
      sub: user.id,
      email: user.email,
      name: user.fullName,
      userId: user.id,
    },
    secret: process.env.NEXTAUTH_SECRET!,
    salt: cookieName,
  });

  await logAuditEvent("LOGIN_SUCCESS", "success", { userId: user.id, email: user.email });

  // Set the session cookie
  const response = NextResponse.json({ success: true });
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return response;
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";
import { prisma } from "@lib/prisma";
import { validateToken, invalidateToken } from "@server/services/token.service";
import { encode } from "next-auth/jwt";
import { logAuditEvent } from "@server/services/audit.service";

const createSessionSchema = z.object({
  sessionToken: z.string().uuid(),
  rememberMe: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { sessionToken, rememberMe } = parsed.data;

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

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await invalidateToken(sessionToken);

  const isSecure = process.env.NODE_ENV === "production";
  const cookieName = isSecure
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : undefined;

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

  // Create Session DB record for session management + active sessions display
  const hashedJWT = createHash("sha256").update(token).digest("hex");
  const expires = new Date(Date.now() + (maxAge ?? 24 * 60 * 60) * 1000);
  await prisma.session.create({
    data: {
      userId: user.id,
      sessionToken: hashedJWT,
      expires,
      device: req.headers.get("user-agent") ?? undefined,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
      current: true,
    },
  });

  // Enforce session limit: max 10 active sessions
  const sessions = await prisma.session.findMany({
    where: { userId: user.id, expires: { gt: new Date() } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (sessions.length > 10) {
    const toDelete = sessions.slice(0, sessions.length - 10).map((s) => s.id);
    await prisma.session.deleteMany({ where: { id: { in: toDelete } } });
  }

  await logAuditEvent("SESSION_CREATED", "success", { userId: user.id, email: user.email });

  const response = NextResponse.json({ success: true });
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax" as const,
    path: "/",
    ...(maxAge !== undefined ? { maxAge } : {}),
  });

  return response;
}

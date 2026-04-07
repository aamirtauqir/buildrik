import { NextRequest, NextResponse } from "next/server";
import { decode } from "next-auth/jwt";
import { prisma } from "@lib/prisma";
import { logAuditEvent } from "@server/services/audit.service";

export async function POST(req: NextRequest) {
  const isSecure = process.env.NODE_ENV === "production";
  const cookieName = isSecure ? "__Secure-next-auth.session-token" : "next-auth.session-token";

  // Decode JWT to get userId and invalidate DB sessions
  const token = req.cookies?.get(cookieName)?.value;

  if (token) {
    try {
      const decoded = await decode({
        token,
        secret: process.env.NEXTAUTH_SECRET!,
        salt: cookieName,
      });

      const userId = typeof decoded?.userId === "string" ? decoded.userId : null;
      if (userId) {
        await prisma.session.deleteMany({ where: { userId } });
        await logAuditEvent("LOGOUT", "success", { userId });
      }
    } catch {
      // Malformed/invalid token — just proceed to clear cookie
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(cookieName, "", {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

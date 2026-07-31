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
      const sid = typeof decoded?.sid === "string" ? decoded.sid : null;
      if (userId) {
        // Delete THIS session's row only. This used to delete every row for the
        // user, so signing out on a laptop erased the phone's entry from the
        // Security tab while the phone stayed signed in — the list then lied in
        // the opposite direction from the revoke buttons. Deliberately no
        // sessionVersion bump: logging out of one device must not sign the user
        // out of the others.
        // A token minted before `sid` existed has none, so fall back to the old
        // user-wide delete for it rather than leaving a row behind forever.
        await prisma.session.deleteMany({ where: sid ? { id: sid, userId } : { userId } });
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

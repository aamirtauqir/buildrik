import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/server/auth";
import { validateToken, invalidateToken } from "@/server/services/token.service";

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

  await signIn("credentials", {
    email: user.email,
    password: process.env.SESSION_GRANT_SECRET,
    redirect: false,
  });

  return NextResponse.json({ success: true });
}

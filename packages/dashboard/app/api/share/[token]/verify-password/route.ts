import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { checkRateLimit } from "@server/services/rate-limiter";
import { shareUnlockProof } from "@server/services/share-link.service";

const VERIFY_MAX_ATTEMPTS = 5;
const VERIFY_WINDOW_MS = 60_000;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // The token circulates by design, so without a throttle the password gate
  // is open to unlimited offline-speed guessing.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = await checkRateLimit(
    `share-verify:${token}:${ip}`,
    VERIFY_MAX_ATTEMPTS,
    VERIFY_WINDOW_MS,
  );
  if (!limit.allowed) {
    const retryAfterSec = Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      { error: "Too many attempts. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }

  const body = await req.json();
  const { password } = body as { password: string };

  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const link = await prisma.shareLink.findUnique({
    where: { token },
    include: { site: { select: { deletedAt: true } } },
  });

  if (!link || !link.isActive || link.site.deletedAt) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  if (link.expiresAt && link.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link expired" }, { status: 410 });
  }

  /* The share page itself shows the draft (and counts the view) for a link
     with no password; there is nothing to verify here. */
  if (!link.passwordHash) {
    return NextResponse.json({ redirectUrl: `/share/${encodeURIComponent(token)}` });
  }

  const bcrypt = await import("bcryptjs");
  const valid = await bcrypt.compare(password, link.passwordHash);

  if (!valid) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  /* Back to the share page, which now renders the saved draft once it sees
     the signed unlock cookie (it counts the view there). */
  const redirectUrl = `/share/${encodeURIComponent(token)}`;

  const res = NextResponse.json({ redirectUrl });
  res.cookies.set(`share_${token}`, shareUnlockProof(token), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  return res;
}

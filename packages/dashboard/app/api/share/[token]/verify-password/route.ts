import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { checkRateLimit } from "@server/services/rate-limiter";
import { shareDestination } from "@lib/share-destination";

/** The link is fine; the site behind it has never been published. */
const NOT_PUBLISHED = "This site isn't published yet, so there's nothing to open.";

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
    include: { site: { select: { publishedUrl: true, slug: true } } },
  });

  if (!link || !link.isActive) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  if (link.expiresAt && link.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link expired" }, { status: 410 });
  }

  if (!link.passwordHash) {
    // Count the visit for password-less links too (was only counted after a
    // password check, so open links always reported zero views).
    await prisma.shareLink.update({
      where: { id: link.id },
      data: { viewCount: { increment: 1 } },
    });
    const redirectUrl = shareDestination(link.site);
    if (!redirectUrl) return NextResponse.json({ error: NOT_PUBLISHED }, { status: 409 });
    return NextResponse.json({ redirectUrl });
  }

  const bcrypt = await import("bcryptjs");
  const valid = await bcrypt.compare(password, link.passwordHash);

  if (!valid) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  await prisma.shareLink.update({
    where: { id: link.id },
    data: { viewCount: { increment: 1 } },
  });

  /* Same dead end the page had: `/<slug>` is not a route, so an unpublished
     site sent the visitor to a 404 right after they typed the password. */
  const redirectUrl = shareDestination(link.site);
  if (!redirectUrl) return NextResponse.json({ error: NOT_PUBLISHED }, { status: 409 });

  const res = NextResponse.json({ redirectUrl });
  res.cookies.set(`share_${token}`, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  return res;
}

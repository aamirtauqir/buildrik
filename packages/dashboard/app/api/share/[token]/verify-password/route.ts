import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
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
    const redirectUrl = link.site.publishedUrl ?? `/${link.site.slug}`;
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

  const redirectUrl = link.site.publishedUrl ?? `/${link.site.slug}`;

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

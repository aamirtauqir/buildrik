import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function listShareLinks(siteId: string) {
  return prisma.shareLink.findMany({
    where: { siteId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createShareLink(
  siteId: string,
  data: { name: string; password?: string; expiresInDays?: number }
) {
  const token = crypto.randomUUID();

  let passwordHash: string | undefined;
  if (data.password) {
    const bcrypt = await import("bcryptjs");
    passwordHash = await bcrypt.hash(data.password, 10);
  }

  let expiresAt: Date | undefined;
  if (data.expiresInDays) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + data.expiresInDays);
  }

  return prisma.shareLink.create({
    data: {
      siteId,
      name: data.name,
      token,
      passwordHash,
      expiresAt,
    },
  });
}

export async function revokeShareLink(id: string) {
  return prisma.shareLink.update({
    where: { id },
    data: { isActive: false },
  });
}

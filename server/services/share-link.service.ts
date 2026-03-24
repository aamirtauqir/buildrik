import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";

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
  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { workspaceId: true } });
  if (!site) throw new Error("SITE_NOT_FOUND");
  const ws = await prisma.workspace.findUnique({ where: { id: site.workspaceId }, select: { plan: true } });
  const plan = (ws?.plan ?? "FREE") as PlanName;
  const maxDays = PLAN_LIMITS[plan].shareLinkExpiryMaxDays as number;

  if (data.expiresInDays && data.expiresInDays > maxDays) {
    throw new Error("EXPIRY_EXCEEDS_PLAN");
  }

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

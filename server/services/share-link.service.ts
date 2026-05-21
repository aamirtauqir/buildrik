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
  data: { name: string; password?: string; expiresInDays?: number },
  userId?: string
) {
  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { workspaceId: true, deletedAt: true } });
  if (!site || site.deletedAt) throw new Error("SITE_NOT_FOUND");
  let plan: PlanName;
  if (userId) {
    const member = await prisma.workspaceMember.findFirst({
      where: { userId, workspaceId: site.workspaceId, status: "ACTIVE" },
      include: { workspace: { select: { plan: true, sharingSettings: true } } },
    });
    if (!member) throw new Error("NOT_WORKSPACE_MEMBER");
    const settings = member.workspace?.sharingSettings;
    if (member.role === "EDITOR" && settings?.allowEditors === false) {
      throw new Error("EDITORS_CANNOT_CREATE_LINKS");
    }
    plan = (member.workspace?.plan ?? "FREE") as PlanName;
  } else {
    const ws = await prisma.workspace.findUnique({ where: { id: site.workspaceId }, select: { plan: true } });
    plan = (ws?.plan ?? "FREE") as PlanName;
  }
  const limits = PLAN_LIMITS[plan];
  const maxDays = limits.shareLinkExpiryMaxDays as number;
  const allowPasswords = limits.shareLinkPasswords as boolean;

  if (data.expiresInDays && data.expiresInDays > maxDays) {
    throw new Error("EXPIRY_EXCEEDS_PLAN");
  }

  if (data.password && !allowPasswords) {
    throw new Error("PASSWORD_LINKS_NOT_AVAILABLE");
  }

  // FREE plan: max 3 share links per site; PRO/BUSINESS: unlimited
  const shareLinkLimit = plan === "FREE" ? 3 : -1;
  if (shareLinkLimit > 0) {
    const shareLinksOnSite = await prisma.shareLink.count({ where: { siteId, isActive: true } });
    if (shareLinksOnSite >= shareLinkLimit) throw new Error("SHARE_LINK_LIMIT");
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

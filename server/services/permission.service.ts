import type { PrismaClient } from "@prisma/client";

const ROLE_RANK: Record<string, number> = {
  VIEWER: 0,
  EDITOR: 1,
  ADMIN: 2,
  OWNER: 3,
};

export class PermissionError extends Error {
  constructor(public code: "NOT_FOUND" | "FORBIDDEN", message?: string) {
    super(message ?? code);
    this.name = "PermissionError";
  }
}

export async function checkSiteRole(
  db: PrismaClient,
  userId: string,
  siteId: string,
  minRole: "EDITOR" | "ADMIN" | "OWNER"
): Promise<void> {
  const site = await db.site.findUnique({ where: { id: siteId }, select: { workspaceId: true } });
  if (!site) throw new PermissionError("NOT_FOUND");

  const member = await db.workspaceMember.findFirst({
    where: { userId, workspaceId: site.workspaceId },
    include: { sitePermissions: { where: { siteId } } },
  });
  if (!member) throw new PermissionError("FORBIDDEN");

  const effectiveRole = member.sitePermissions[0]?.roleOverride ?? member.role;
  if ((ROLE_RANK[effectiveRole] ?? -1) < ROLE_RANK[minRole]) {
    throw new PermissionError("FORBIDDEN", "Insufficient permissions");
  }
}

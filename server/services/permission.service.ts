import type { PrismaClient } from "@prisma/client";
import type { UserRoleType } from "@/lib/constants/enums";

const ROLE_RANK: Record<UserRoleType, number> = {
  VIEWER: 0,
  EDITOR: 1,
  // a5-invite: Designer has the same site-edit access as a Content editor.
  DESIGNER: 1,
  ADMIN: 2,
  OWNER: 3,
};

export class PermissionError extends Error {
  constructor(public code: "NOT_FOUND" | "FORBIDDEN", message?: string) {
    super(message ?? code);
    this.name = "PermissionError";
  }
}

/**
 * Bearer-auth context propagated from `createTRPCContext`. When present, the
 * request authenticated via an API token; the resource being accessed must be
 * in the token's workspace. Cookie-session requests pass `undefined`/`null`.
 */
interface BearerScope {
  workspaceId: string;
}

export async function assertSiteAccess(
  db: PrismaClient,
  userId: string,
  siteId: string,
  bearer?: BearerScope | null,
): Promise<void> {
  const site = await db.site.findUnique({ where: { id: siteId }, select: { workspaceId: true } });
  if (!site) throw new PermissionError("NOT_FOUND");
  // API tokens are workspace-scoped: a token issued for workspace A must never
  // touch workspace B's resources, even if the underlying user belongs to both.
  if (bearer && site.workspaceId !== bearer.workspaceId) {
    throw new PermissionError("FORBIDDEN", "Token is not scoped to this workspace.");
  }
  const member = await db.workspaceMember.findFirst({
    where: { userId, workspaceId: site.workspaceId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!member) throw new PermissionError("FORBIDDEN");
}

export async function checkSiteRole(
  db: PrismaClient,
  userId: string,
  siteId: string,
  minRole: Exclude<UserRoleType, "VIEWER">,
  bearer?: BearerScope | null,
): Promise<void> {
  const site = await db.site.findUnique({ where: { id: siteId }, select: { workspaceId: true } });
  if (!site) throw new PermissionError("NOT_FOUND");
  if (bearer && site.workspaceId !== bearer.workspaceId) {
    throw new PermissionError("FORBIDDEN", "Token is not scoped to this workspace.");
  }

  const member = await db.workspaceMember.findFirst({
    where: { userId, workspaceId: site.workspaceId, status: "ACTIVE" },
    include: { sitePermissions: { where: { siteId } } },
  });
  if (!member) throw new PermissionError("FORBIDDEN");

  const effectiveRole = (member.sitePermissions[0]?.roleOverride ?? member.role) as UserRoleType;
  if ((ROLE_RANK[effectiveRole] ?? -1) < ROLE_RANK[minRole]) {
    throw new PermissionError("FORBIDDEN", "Insufficient permissions");
  }
}

export async function checkWorkspaceRole(
  db: PrismaClient,
  userId: string,
  workspaceId: string,
  minRole: Exclude<UserRoleType, "VIEWER">,
  bearer?: BearerScope | null,
): Promise<void> {
  if (bearer && bearer.workspaceId !== workspaceId) {
    throw new PermissionError("FORBIDDEN", "Token is not scoped to this workspace.");
  }
  const member = await db.workspaceMember.findFirst({
    where: { userId, workspaceId, status: "ACTIVE" },
    select: { role: true },
  });
  if (!member) throw new PermissionError("FORBIDDEN");
  const role = member.role as UserRoleType;
  if ((ROLE_RANK[role] ?? -1) < ROLE_RANK[minRole]) {
    throw new PermissionError("FORBIDDEN", "Insufficient permissions");
  }
}

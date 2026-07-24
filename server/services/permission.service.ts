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

interface ScopedMember {
  id: string;
  role: string;
  _count: { sitePermissions: number };
}

/**
 * Enforce per-site scoping. A member invited to "specific sites" has one
 * SitePermission row per allowed site; such a member may reach ONLY those
 * sites. A member with no rows is on the "all sites" default (unscoped).
 * ADMIN/OWNER manage the whole workspace and are never site-scoped.
 *
 * Returns this site's SitePermission row (for its roleOverride) or null.
 * Throws FORBIDDEN when a scoped member requests a site outside their grant —
 * previously SitePermission was only an additive role override, so scoping was
 * never actually enforced and every member could reach every site.
 */
async function resolveSiteScope(
  db: PrismaClient,
  member: ScopedMember,
  siteId: string,
): Promise<{ roleOverride: string } | null> {
  const row = await db.sitePermission.findUnique({
    where: { memberId_siteId: { memberId: member.id, siteId } },
    select: { roleOverride: true },
  });
  const managesWorkspace = member.role === "ADMIN" || member.role === "OWNER";
  if (!managesWorkspace && member._count.sitePermissions > 0 && !row) {
    throw new PermissionError("FORBIDDEN", "You don't have access to this site.");
  }
  return row;
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
    select: { id: true, role: true, _count: { select: { sitePermissions: true } } },
  });
  if (!member) throw new PermissionError("FORBIDDEN");
  await resolveSiteScope(db, member, siteId);
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
    select: { id: true, role: true, _count: { select: { sitePermissions: true } } },
  });
  if (!member) throw new PermissionError("FORBIDDEN");

  // Enforce site scope AND read this site's role override in one step.
  const row = await resolveSiteScope(db, member, siteId);
  const effectiveRole = (row?.roleOverride ?? member.role) as UserRoleType;
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

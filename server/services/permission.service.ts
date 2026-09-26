import type { PrismaClient, Prisma } from "@prisma/client";
import { ROLE_RANK, type UserRoleType } from "@/lib/constants/enums";
import type { PlanName } from "@/lib/constants/plan-limits";

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

// ADMIN/OWNER manage the whole workspace and are never site-scoped — shared
// by resolveSiteScope (single-site check) and siteScopeWhere (workspace-wide
// list/aggregate filter) so the "who is exempt from scoping" rule has one
// home instead of two copies that could drift.
function managesWorkspace(role: string): boolean {
  return role === "ADMIN" || role === "OWNER";
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
  if (!managesWorkspace(member.role) && member._count.sitePermissions > 0 && !row) {
    throw new PermissionError("FORBIDDEN", "You don't have access to this site.");
  }
  return row;
}

/**
 * S-9: the same "specific sites" scoping rule as resolveSiteScope, for
 * workspace-wide LIST/aggregate queries that never had a single siteId to
 * check against. Returns a Prisma `Site.where` fragment: `{}` (no
 * restriction) for ADMIN/OWNER or an unscoped member, or `{ id: { in: [...] } }`
 * for a member scoped to specific sites. Spread the result into any query's
 * `where` (directly for a `Site` query, or under a `site: {...}` relation
 * filter for a query on a related model).
 */
export async function siteScopeWhere(
  db: PrismaClient,
  userId: string,
  workspaceId: string,
): Promise<Prisma.SiteWhereInput> {
  const member = await db.workspaceMember.findFirst({
    where: { userId, workspaceId, status: "ACTIVE" },
    select: { id: true, role: true, _count: { select: { sitePermissions: true } } },
  });
  // No ACTIVE member: callers resolve workspaceId through a membership check
  // before reaching here, so this is defensive — deny rather than leak.
  if (!member) return { id: "__no_workspace_access__" };

  if (managesWorkspace(member.role) || member._count.sitePermissions === 0) return {};

  const rows = await db.sitePermission.findMany({
    where: { memberId: member.id },
    select: { siteId: true },
  });
  return { id: { in: rows.map((r) => r.siteId) } };
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

/**
 * The one answer to "which workspace is this SITE in, and what does that
 * workspace say" — `workspaceId`, `plan`, `editsRequireApproval`.
 *
 * Consolidates three call sites (IMPORTANT 4) that
 * each read `site.workspaceId` off a bare `ctx.prisma.site.findUnique` and
 * then, in two of them, did a SECOND round-trip through `workspaceMember` just
 * to reach `workspace.plan` — the plan belongs to the workspace, not to a
 * membership row, so that join was unnecessary. Every caller here has already
 * proven site access via `checkSiteRole`/`assertSiteAccess`; this is a plain
 * read, not an authorization check.
 */
const PLAN_NAMES: readonly PlanName[] = ["FREE", "PRO", "BUSINESS"];

export async function getSiteWorkspace(
  db: PrismaClient,
  siteId: string,
): Promise<{ workspaceId: string; plan: PlanName; editsRequireApproval: boolean } | null> {
  const site = await db.site.findUnique({
    where: { id: siteId },
    select: { workspaceId: true, workspace: { select: { plan: true, editsRequireApproval: true } } },
  });
  if (!site) return null;
  // `Workspace.plan` is a plain String column, not a DB-level enum — defend
  // against a corrupt/unrecognized value the same way every prior caller did.
  const rawPlan = site.workspace?.plan;
  const plan: PlanName = (PLAN_NAMES as readonly string[]).includes(rawPlan ?? "")
    ? (rawPlan as PlanName)
    : "FREE";
  return {
    workspaceId: site.workspaceId,
    plan,
    editsRequireApproval: site.workspace?.editsRequireApproval ?? false,
  };
}

/**
 * The one answer to "what role does this user have ON THIS SITE".
 *
 * Site scope is enforced on the way through, and this site's `roleOverride`
 * (when present) caps the workspace role by ROLE_RANK — PD-6, S-6 — never
 * upgrades it. That resolution is the whole reason this exists as its
 * own export. `sites.myRole` used to answer the chrome's version of this
 * question with a bare `workspaceMember.findFirst` and return `member.role`, so
 * a member with a per-site override was told one thing by the UI and a
 * different thing by every enforcement path. A control that is enabled because
 * the chrome believes you are an EDITOR, on a server that knows you are a
 * VIEWER here, is the shape this repo files under copy-on-a-permission-boundary.
 */
export async function getEffectiveSiteRole(
  db: PrismaClient,
  userId: string,
  siteId: string,
  bearer?: BearerScope | null,
): Promise<UserRoleType> {
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
  if (!row) return member.role as UserRoleType;
  // PD-6: roleOverride is a CAP, never an upgrade. Effective role is the
  // lower-ranked of the member's workspace role and this site's override —
  // a demotion takes effect immediately on every site. On a tie, keep the
  // override so a DESIGNER/EDITOR label survives (same ROLE_RANK).
  const override = row.roleOverride as UserRoleType;
  const effective = ROLE_RANK[override] <= ROLE_RANK[member.role as UserRoleType] ? override : (member.role as UserRoleType);
  return effective;
}

export async function checkSiteRole(
  db: PrismaClient,
  userId: string,
  siteId: string,
  minRole: Exclude<UserRoleType, "VIEWER">,
  bearer?: BearerScope | null,
): Promise<void> {
  const effectiveRole = await getEffectiveSiteRole(db, userId, siteId, bearer);
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

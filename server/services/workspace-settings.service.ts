import { prisma } from "@/lib/prisma";
import type { UpdateWorkspaceInput } from "@buildrik/shared/schemas/account";

/** Thrown when the user already has a workspace by this name (case-insensitive). */
export class WorkspaceNameTakenError extends Error {
  code = "WORKSPACE_NAME_TAKEN" as const;
  constructor() {
    super("That workspace name is taken. Try another.");
    this.name = "WorkspaceNameTakenError";
  }
}

/** Thrown when a free user tries to create a 2nd workspace (W1 plan gate). */
export class WorkspaceLimitError extends Error {
  code = "WORKSPACE_LIMIT" as const;
  constructor() {
    super("Free plan is limited to one workspace. Upgrade to create more.");
    this.name = "WorkspaceLimitError";
  }
}

async function uniqueWorkspaceSlug(name: string): Promise<string> {
  const base =
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "workspace";
  let slug = base;
  for (let i = 1; i < 100; i++) {
    const existing = await prisma.workspace.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/**
 * W1: create an ADDITIONAL workspace for an existing user. Plan-gated — free
 * users get exactly one workspace (the signup one); creating more requires a paid
 * plan on a workspace the user owns (multi-workspace is the Pro/agency feature,
 * and it closes the per-workspace free site-cap bypass the eng review flagged).
 * No onboardingState row here — that's per-user and already exists from signup.
 */
export async function createWorkspace(
  userId: string,
  name: string,
): Promise<{ workspaceId: string; name: string; slug: string }> {
  const owned = await prisma.workspaceMember.findMany({
    where: { userId, role: "OWNER", status: "ACTIVE" },
    select: { workspace: { select: { plan: true } } },
  });
  const hasPaid = owned.some(
    (m) => m.workspace.plan === "PRO" || m.workspace.plan === "BUSINESS",
  );
  if (owned.length >= 1 && !hasPaid) {
    throw new WorkspaceLimitError();
  }

  // Names were never checked — only the slug was auto-deduped — so a user could
  // end up with two workspaces called the same thing and no way to tell them
  // apart in the switcher. Scoped to THIS user: two different people may both
  // have a "My Workspace".
  const clash = await prisma.workspaceMember.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      workspace: { name: { equals: name.trim(), mode: "insensitive" } },
    },
    select: { id: true },
  });
  if (clash) throw new WorkspaceNameTakenError();

  const slug = await uniqueWorkspaceSlug(name);
  const ws = await prisma.$transaction(async (tx) => {
    const created = await tx.workspace.create({ data: { name, slug, ownerId: userId } });
    await tx.workspaceMember.create({
      data: { userId, workspaceId: created.id, role: "OWNER" },
    });
    return created;
  });
  return { workspaceId: ws.id, name, slug };
}

export async function getWorkspaceSettings(workspaceId: string) {
  return prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { sharingSettings: true },
  });
}

// a6-workspace-select: every workspace the user actively belongs to, with their
// role + member count, for the post-login chooser. Newest membership first.
export async function listUserWorkspaces(userId: string) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId, status: "ACTIVE" },
    orderBy: { joinedAt: "desc" },
    select: {
      role: true,
      workspace: {
        select: {
          id: true,
          name: true,
          iconUrl: true,
          plan: true,
          // siteCount feeds the workspace chooser's "4 members · 12 sites" line,
          // which previously had no site number to read.
          _count: { select: { members: true, sites: true } },
        },
      },
    },
  });
  return memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    iconUrl: m.workspace.iconUrl,
    plan: m.workspace.plan,
    role: m.role,
    memberCount: m.workspace._count.members,
    siteCount: m.workspace._count.sites,
  }));
}

/**
 * Renaming a workspace had no duplicate-name guard — only `createWorkspace` did
 * — so the M2 onboarding "name exists" state (workspace-setup frame) had no
 * server signal to key off. Scoped the same way as create: per-user (a
 * different user's workspace of the same name is fine), excluding the
 * workspace being renamed (renaming to your own current name is a no-op).
 */
export async function updateWorkspaceSettings(
  workspaceId: string,
  data: UpdateWorkspaceInput,
  userId: string,
) {
  if (data.name) {
    const clash = await prisma.workspaceMember.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        workspaceId: { not: workspaceId },
        workspace: { name: { equals: data.name.trim(), mode: "insensitive" } },
      },
      select: { id: true },
    });
    if (clash) throw new WorkspaceNameTakenError();
  }
  return prisma.workspace.update({
    where: { id: workspaceId },
    data,
  });
}

export async function deleteWorkspace(workspaceId: string) {
  const scheduledAt = new Date(Date.now() + 30 * 86400000);
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { deletionScheduledAt: scheduledAt },
  });
  return { scheduledAt };
}

export async function cancelWorkspaceDeletion(workspaceId: string) {
  return prisma.workspace.update({
    where: { id: workspaceId },
    data: { deletionScheduledAt: null },
  });
}

export async function updateSharingSettings(
  workspaceId: string,
  data: { defaultExpiration?: string | null; requirePw?: boolean; allowEditors?: boolean; notify?: boolean },
) {
  return prisma.wSSharingSettings.upsert({
    where: { workspaceId },
    create: { workspaceId, ...data },
    update: data,
  });
}

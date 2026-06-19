import { prisma } from "@/lib/prisma";
import type { UpdateWorkspaceInput } from "@buildrik/shared/schemas/account";

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
          _count: { select: { members: true } },
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
  }));
}

export async function updateWorkspaceSettings(workspaceId: string, data: UpdateWorkspaceInput) {
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

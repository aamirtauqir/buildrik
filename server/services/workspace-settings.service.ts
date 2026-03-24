import { prisma } from "@/lib/prisma";
import type { UpdateWorkspaceInput } from "@/lib/validations/account";

export async function getWorkspaceSettings(workspaceId: string) {
  return prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { sharingSettings: true },
  });
}

export async function updateWorkspaceSettings(workspaceId: string, data: UpdateWorkspaceInput) {
  return prisma.workspace.update({
    where: { id: workspaceId },
    data,
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

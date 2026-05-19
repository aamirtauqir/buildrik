import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import type { AddIntegrationInput } from "@buildrik/shared/schemas/account";
import { decrypt } from "@/lib/encryption";

export async function listIntegrations(workspaceId: string) {
  return prisma.workspaceIntegration.findMany({
    where: { workspaceId },
  });
}

export async function addIntegration(workspaceId: string, input: AddIntegrationInput, plan: PlanName) {
  const limit = PLAN_LIMITS[plan].integrations as number;
  const existing = await prisma.workspaceIntegration.findMany({
    where: { workspaceId },
  });

  if (limit !== -1 && existing.length >= limit) {
    throw new Error("INTEGRATION_LIMIT");
  }

  return prisma.workspaceIntegration.create({
    data: {
      workspaceId,
      provider: input.provider,
      config: input.config as Record<string, string>,
      isActive: true,
    },
  });
}

export async function removeIntegration(id: string) {
  return prisma.workspaceIntegration.delete({
    where: { id },
  });
}

export interface ActiveVercelConnection {
  id: string;
  token: string;
  teamId: string | null;
}

export async function getActiveVercelConnection(
  workspaceId: string,
): Promise<ActiveVercelConnection | null> {
  const row = await prisma.workspaceIntegration.findFirst({
    where: { workspaceId, provider: "vercel", isActive: true },
  });
  if (!row) return null;
  if (!row.config || typeof row.config !== "object" || Array.isArray(row.config)) {
    throw new Error("VERCEL_CONFIG_MALFORMED");
  }
  const config = row.config as Record<string, unknown>;
  const encryptedToken = config.encryptedToken;
  if (typeof encryptedToken !== "string") {
    throw new Error("VERCEL_CONFIG_MALFORMED");
  }
  const token = decrypt(encryptedToken);
  return {
    id: row.id,
    token,
    teamId: typeof config.teamId === "string" ? config.teamId : null,
  };
}

export async function markInactive(id: string): Promise<void> {
  await prisma.workspaceIntegration.update({
    where: { id },
    data: { isActive: false },
  });
}

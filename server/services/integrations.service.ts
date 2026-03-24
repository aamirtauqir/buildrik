import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import type { AddIntegrationInput } from "@/lib/validations/account";

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
      config: input.config,
      isActive: true,
    },
  });
}

export async function removeIntegration(id: string) {
  return prisma.workspaceIntegration.delete({
    where: { id },
  });
}

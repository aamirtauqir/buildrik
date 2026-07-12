import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import type { AddIntegrationInput } from "@buildrik/shared/schemas/account";
import { decrypt } from "@/lib/encryption";
import { checkWorkspaceRole } from "@/server/services/permission.service";
import { assertPublicHttpsUrl } from "@/lib/url-guard";

async function assertSafeWebhookConfig(config: Record<string, unknown>): Promise<void> {
  const webhookUrl = config.webhookUrl;
  if (typeof webhookUrl === "string" && webhookUrl.length > 0) {
    // SSRF guard at persist time so a private/loopback URL never reaches storage.
    await assertPublicHttpsUrl(webhookUrl);
  }
}

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

  await assertSafeWebhookConfig(input.config as Record<string, unknown>);

  return prisma.workspaceIntegration.create({
    data: {
      workspaceId,
      provider: input.provider,
      config: input.config as Record<string, string>,
      isActive: true,
    },
  });
}

export async function removeIntegration(id: string, userId: string) {
  // Integrations are workspace-owned: verify the actor is an ADMIN of the
  // integration's workspace before deleting (IDOR + privilege guard).
  const integration = await prisma.workspaceIntegration.findUnique({
    where: { id },
    select: { workspaceId: true },
  });
  if (!integration) throw new Error("INTEGRATION_NOT_FOUND");
  await checkWorkspaceRole(prisma, userId, integration.workspaceId, "ADMIN");
  return prisma.workspaceIntegration.delete({ where: { id } });
}

export async function updateIntegration(
  id: string,
  config: Record<string, string>,
  userId: string,
) {
  // Same ADMIN guard as remove — config can hold credentials/webhook URLs.
  const integration = await prisma.workspaceIntegration.findUnique({
    where: { id },
    select: { workspaceId: true },
  });
  if (!integration) throw new Error("INTEGRATION_NOT_FOUND");
  await checkWorkspaceRole(prisma, userId, integration.workspaceId, "ADMIN");
  await assertSafeWebhookConfig(config as Record<string, unknown>);
  return prisma.workspaceIntegration.update({
    where: { id },
    data: { config: config as Record<string, string> },
  });
}

export interface TestEventResult {
  ok: boolean;
  status: number;
}

export async function sendIntegrationTestEvent(
  id: string,
  userId: string,
): Promise<TestEventResult> {
  const integration = await prisma.workspaceIntegration.findUnique({
    where: { id },
    select: { workspaceId: true, provider: true, config: true },
  });
  if (!integration) throw new Error("INTEGRATION_NOT_FOUND");
  await checkWorkspaceRole(prisma, userId, integration.workspaceId, "ADMIN");

  const config = (integration.config ?? {}) as Record<string, unknown>;
  const webhookUrl = typeof config.webhookUrl === "string" ? config.webhookUrl : null;
  if (!webhookUrl) {
    // GA/Mailchimp-style integrations have no inbound webhook to test.
    throw new Error("NO_WEBHOOK_URL");
  }

  // Re-validate at fetch time (defends against DNS rebinding between persist
  // and send). Throws BLOCKED_URL/INVALID_URL → surfaced as BAD_REQUEST.
  await assertPublicHttpsUrl(webhookUrl);

  const payload = {
    type: "buildrik.test_event",
    provider: integration.provider,
    message: "Test event from Buildrick — your webhook is connected.",
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
      // Do not auto-follow redirects to a possibly-internal Location.
      redirect: "manual",
    });
    return { ok: res.ok, status: res.status };
  } catch {
    // Network failure / DNS / timeout — report as unreachable, do not throw
    // a 500 (the URL is user-supplied and may simply be wrong).
    throw new Error("WEBHOOK_UNREACHABLE");
  }
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

import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { ConnectWebhookInput, WebhookEvent } from "@buildrik/shared/schemas/webhooks";

/**
 * Workspace webhooks (P6, Figma Site boards 176:456…727).
 *
 * ONE endpoint per workspace. Every delivery POSTs JSON with an
 * `x-buildrick-signature: sha256=<hmac>` header — HMAC-SHA256 of the raw body
 * with the workspace's `whsec_` secret. Delivery is BEST-EFFORT and never
 * blocks the action that fired it (publish/submit); failures are recorded and
 * surface as "N failed deliveries in 24h" in the editor.
 */

const DELIVERY_TIMEOUT_MS = 10_000;

function newSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString("hex")}`;
}

export async function getWorkspaceWebhook(workspaceId: string) {
  return prisma.workspaceWebhook.findUnique({ where: { workspaceId } });
}

/** Connect (or update) the workspace endpoint. Keeps the existing secret on
 *  URL/event edits — regeneration is its own deliberate action. */
export async function connectWebhook(workspaceId: string, input: ConnectWebhookInput) {
  return prisma.workspaceWebhook.upsert({
    where: { workspaceId },
    create: { workspaceId, url: input.url, events: [...input.events], secret: newSecret() },
    update: { url: input.url, events: [...input.events] },
  });
}

export async function disconnectWebhook(workspaceId: string) {
  await prisma.workspaceWebhook.deleteMany({ where: { workspaceId } });
}

/** New signing secret — every receiver stops verifying until it's updated. */
export async function regenerateWebhookSecret(workspaceId: string) {
  return prisma.workspaceWebhook.update({
    where: { workspaceId },
    data: { secret: newSecret() },
  });
}

export interface WebhookStatusSummary {
  url: string;
  events: string[];
  secret: string;
  /** null = never fired; else last delivery time (ok or failed). */
  lastDeliveryAt: Date | null;
  lastStatus: string | null;
  failures24h: number;
  recentFailures: Array<{ error: string; createdAt: Date }>;
}

/** Feeds the boards: never-fired / delivering · last Nm ago / N failed in 24h. */
export async function getWebhookStatus(workspaceId: string): Promise<WebhookStatusSummary | null> {
  const hook = await prisma.workspaceWebhook.findUnique({
    where: { workspaceId },
    include: { deliveries: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!hook) return null;
  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000);
  const [failures24h, recent] = await Promise.all([
    prisma.webhookDelivery.count({
      where: { webhookId: hook.id, status: "FAILED", createdAt: { gte: dayAgo } },
    }),
    prisma.webhookDelivery.findMany({
      where: { webhookId: hook.id, status: "FAILED", createdAt: { gte: dayAgo } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { error: true, createdAt: true },
    }),
  ]);
  return {
    url: hook.url,
    events: hook.events,
    secret: hook.secret,
    lastDeliveryAt: hook.deliveries[0]?.createdAt ?? null,
    lastStatus: hook.deliveries[0]?.status ?? null,
    failures24h,
    recentFailures: recent.map((r) => ({ error: r.error ?? "delivery failed", createdAt: r.createdAt })),
  };
}

/**
 * Fire an event to the workspace endpoint. Best-effort: swallows every error
 * after recording it — a webhook must never fail a publish or a form submit.
 */
export async function deliverWebhook(
  workspaceId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const hook = await prisma.workspaceWebhook.findUnique({ where: { workspaceId } });
    if (!hook || !hook.events.includes(event)) return;

    const body = JSON.stringify({ event, createdAt: new Date().toISOString(), data: payload });
    const signature = crypto.createHmac("sha256", hook.secret).update(body).digest("hex");

    let status = "OK";
    let httpStatus: number | null = null;
    let error: string | null = null;
    try {
      const res = await fetch(hook.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-buildrick-event": event,
          "x-buildrick-signature": `sha256=${signature}`,
        },
        body,
        signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
      });
      httpStatus = res.status;
      if (!res.ok) {
        status = "FAILED";
        error = `${res.status} ${res.statusText}`.slice(0, 500);
      }
    } catch (e) {
      status = "FAILED";
      error = (e instanceof Error ? e.message : "request failed").slice(0, 500);
    }
    await prisma.webhookDelivery.create({
      data: { webhookId: hook.id, event, status, httpStatus, error },
    });
  } catch {
    // Recording itself failed — still never propagate into the caller.
  }
}

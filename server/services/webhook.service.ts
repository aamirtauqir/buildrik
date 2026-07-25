import crypto from "node:crypto";
import net from "node:net";
import dns from "node:dns/promises";
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

// ── SSRF guard ────────────────────────────────────────────────────────────────
// The endpoint URL is admin-supplied and fetched from the server, so without
// a guard any workspace admin could aim deliveries at loopback services,
// RFC1918 hosts, or cloud metadata (169.254.169.254). Deliveries are blind
// (the response body never reaches the caller), but blind POSTs into internal
// services are still an SSRF primitive.

function isPrivateV4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 || // 0.0.0.0/8
    a === 10 || // 10/8
    a === 127 || // loopback
    (a === 100 && b >= 64 && b <= 127) || // 100.64/10 CGNAT
    (a === 169 && b === 254) || // link-local (cloud metadata)
    (a === 172 && b >= 16 && b <= 31) || // 172.16/12
    (a === 192 && b === 168) // 192.168/16
  );
}

export function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateV4(ip);
  const v6 = ip.toLowerCase();
  if (v6 === "::" || v6 === "::1") return true;
  if (v6.startsWith("::ffff:")) {
    const mapped = v6.slice(7);
    return net.isIPv4(mapped) ? isPrivateV4(mapped) : true;
  }
  if (/^fe[89ab]/.test(v6)) return true; // fe80::/10 link-local
  if (v6.startsWith("fc") || v6.startsWith("fd")) return true; // fc00::/7 unique-local
  return false;
}

/**
 * Throws WEBHOOK_URL_UNSAFE when the URL could reach loopback / private /
 * link-local address space. Scheme must be https (http allowed outside
 * production so local dev receivers keep working; the private-range check is
 * production-only for the same reason). Residual risk: no IP pinning between
 * this lookup and the fetch connect (DNS rebinding window) — accepted for a
 * blind, best-effort delivery; revisit with a custom undici dispatcher if
 * webhook responses ever become readable.
 */
export async function assertSafeWebhookUrl(rawUrl: string): Promise<void> {
  const url = new URL(rawUrl); // upstream zod guarantees URL shape; throws on garbage
  const isProd = process.env.NODE_ENV === "production";
  const schemeOk = url.protocol === "https:" || (url.protocol === "http:" && !isProd);
  if (!schemeOk) throw new Error("WEBHOOK_URL_UNSAFE");
  if (!isProd) return;
  const host = url.hostname.replace(/^\[|\]$/g, ""); // strip IPv6 brackets
  const addrs = net.isIP(host)
    ? [{ address: host }]
    : await dns.lookup(host, { all: true, verbatim: true }).catch(() => []);
  if (addrs.length === 0 || addrs.some((a) => isPrivateAddress(a.address))) {
    throw new Error("WEBHOOK_URL_UNSAFE");
  }
}

export async function getWorkspaceWebhook(workspaceId: string) {
  return prisma.workspaceWebhook.findUnique({ where: { workspaceId } });
}

/** Connect (or update) the workspace endpoint. Keeps the existing secret on
 *  URL/event edits — regeneration is its own deliberate action. */
export async function connectWebhook(workspaceId: string, input: ConnectWebhookInput) {
  await assertSafeWebhookUrl(input.url);
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

    // Re-validate at delivery time — the URL was checked at connect, but its
    // DNS can be repointed at private space afterwards.
    try {
      await assertSafeWebhookUrl(hook.url);
    } catch {
      await prisma.webhookDelivery.create({
        data: { webhookId: hook.id, event, status: "FAILED", httpStatus: null, error: "blocked: URL resolves to a private address" },
      });
      return;
    }

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
        // A redirect could bounce the signed POST into private address space
        // after the URL check — webhooks never follow redirects.
        redirect: "error",
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

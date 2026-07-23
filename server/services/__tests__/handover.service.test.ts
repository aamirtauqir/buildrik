/**
 * Agency handover rollup (P6). Verifies the per-site launch checklist condenses
 * the four real inputs (domain, forms→destination, approval, publish) into the
 * right statuses, and that `ready` blocks on everything EXCEPT a pending domain
 * (a Buildrik URL is a valid launch, so a missing custom domain is information,
 * not a blocker).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const siteFindMany = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { site: { findMany: (...a: unknown[]) => siteFindMany(...a) } },
}));

import { getHandoverRollup } from "@server/services/handover.service";

beforeEach(() => siteFindMany.mockReset());

const base = {
  id: "s1", name: "Acme", status: "PUBLISHED", lastPublishError: null, publishedUrl: "https://acme.vercel.app",
  domains: [{ status: "ACTIVE", isPrimary: true }],
  formBlocks: [{ notifyEmail: "team@acme.com", webhookUrl: null }],
  reviewRequests: [{ status: "APPROVED" }],
};
const item = (rollup: Awaited<ReturnType<typeof getHandoverRollup>>[number], key: string) =>
  rollup.items.find((i) => i.key === key)!;

describe("getHandoverRollup", () => {
  it("marks a fully-launched, approved, published site as ready", async () => {
    siteFindMany.mockResolvedValue([base]);
    const [r] = await getHandoverRollup("ws-1");
    expect(item(r, "domain").status).toBe("ok");
    expect(item(r, "forms").status).toBe("ok");
    expect(item(r, "approval").status).toBe("ok");
    expect(item(r, "publish").status).toBe("ok");
    expect(r.ready).toBe(true);
  });

  it("treats a form with no destination as a warning that blocks ready", async () => {
    siteFindMany.mockResolvedValue([{ ...base, formBlocks: [{ notifyEmail: null, webhookUrl: null }] }]);
    const [r] = await getHandoverRollup("ws-1");
    expect(item(r, "forms").status).toBe("warning");
    expect(item(r, "forms").label).toMatch(/no destination/i);
    expect(r.ready).toBe(false);
  });

  it("blocks ready on an un-approved site", async () => {
    siteFindMany.mockResolvedValue([{ ...base, reviewRequests: [{ status: "PENDING" }] }]);
    const [r] = await getHandoverRollup("ws-1");
    expect(item(r, "approval").status).toBe("pending");
    expect(r.ready).toBe(false);
  });

  it("blocks ready on a draft (unpublished) site", async () => {
    siteFindMany.mockResolvedValue([{ ...base, status: "DRAFT" }]);
    const [r] = await getHandoverRollup("ws-1");
    expect(item(r, "publish").status).toBe("pending");
    expect(r.ready).toBe(false);
  });

  it("does NOT block ready on a pending domain (a Buildrik URL is a valid launch)", async () => {
    siteFindMany.mockResolvedValue([{ ...base, domains: [] }]);
    const [r] = await getHandoverRollup("ws-1");
    expect(item(r, "domain").status).toBe("pending");
    expect(r.ready).toBe(true);
  });

  it("treats a site with no forms as n/a, not a blocker", async () => {
    siteFindMany.mockResolvedValue([{ ...base, formBlocks: [] }]);
    const [r] = await getHandoverRollup("ws-1");
    expect(item(r, "forms").status).toBe("na");
    expect(r.ready).toBe(true);
  });

  it("scopes the query to the workspace and non-deleted sites", async () => {
    siteFindMany.mockResolvedValue([]);
    await getHandoverRollup("ws-1");
    expect(siteFindMany.mock.calls[0][0].where).toEqual({ workspaceId: "ws-1", deletedAt: null });
  });
});

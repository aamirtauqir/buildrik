/**
 * forms.exportSubmissions — the shared schema carries the editor's view
 * (isSpam / isArchived) through to the service, after the site guard.
 */
import { describe, it, expect, vi } from "vitest";

const svc = vi.hoisted(() => ({
  updateFormBlock: vi.fn(),
  getFormBlockSettings: vi.fn(),
  listFormBlocks: vi.fn(),
  listSubmissions: vi.fn(),
  updateSubmission: vi.fn(),
  deleteSubmission: vi.fn(),
  exportSubmissions: vi.fn(),
}));
const guards = vi.hoisted(() => ({ guardSiteAccess: vi.fn(), guardSiteRole: vi.fn() }));
const prismaMock = vi.hoisted(() => ({}));

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({ extractBearer: () => null, verifyApiToken: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }) }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/server/services/form-submission.service", () => svc);
vi.mock("@/server/trpc/guards", () => ({ guardSiteAccess: guards.guardSiteAccess, guardSiteRole: guards.guardSiteRole }));

import { formsRouter } from "@/server/trpc/routers/forms";

const caller = () => formsRouter.createCaller({ session: { user: { id: "u1" } }, prisma: prismaMock } as never);

describe("forms.exportSubmissions — the editor's view rides through", () => {
  it("passes form and view filters to the service after the site guard", async () => {
    guards.guardSiteAccess.mockResolvedValue(undefined);
    svc.exportSubmissions.mockResolvedValue("id,createdAt,form");
    const csv = await caller().exportSubmissions({ siteId: "s1", formBlockId: "f1", isSpam: true, format: "csv" });
    expect(guards.guardSiteAccess).toHaveBeenCalledWith(prismaMock, "u1", "s1");
    expect(svc.exportSubmissions).toHaveBeenCalledWith("s1", "f1", "csv", { isSpam: true, isArchived: undefined });
    expect(csv).toBe("id,createdAt,form");
  });

  it("a dashboard call without a view keeps both states", async () => {
    guards.guardSiteAccess.mockResolvedValue(undefined);
    await caller().exportSubmissions({ siteId: "s1", format: "csv" });
    expect(svc.exportSubmissions).toHaveBeenLastCalledWith("s1", undefined, "csv", { isSpam: undefined, isArchived: undefined });
  });
});

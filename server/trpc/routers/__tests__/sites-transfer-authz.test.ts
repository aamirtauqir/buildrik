/**
 * sites.transfer (Q-B5, BE-8): who may hand a site on is decided once, in
 * `transferSite` — the site's creator or the workspace OWNER. The router used
 * to gate on OWNER first, so a creator who was not the OWNER was refused before
 * the service's rule ran. Router + real service + real permission service over
 * a mocked Prisma, so the whole decision is under test.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { db } = vi.hoisted(() => ({
  db: {
    site: { findUnique: vi.fn(), update: vi.fn() },
    workspaceMember: { findFirst: vi.fn() },
    sitePermission: { findUnique: vi.fn(), upsert: vi.fn() },
    user: { findUnique: vi.fn() },
    $transaction: vi.fn(async (ops: unknown[]) => Promise.all(ops)),
  },
}));

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({ extractBearer: () => null, verifyApiToken: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }) }));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/server/services/email.service", () => ({ sendSiteTransferredEmail: vi.fn().mockResolvedValue(undefined) }));

import { sitesRouter } from "@/server/trpc/routers/sites";

const caller = (userId: string) => sitesRouter.createCaller({ session: { user: { id: userId } }, prisma: db } as never);

/** The site, created by `creator`, and each caller's workspace role. */
function workspace(roles: Record<string, string>) {
  db.site.findUnique.mockResolvedValue({ id: "s1", name: "Bella", createdBy: "creator", workspaceId: "ws1", deletedAt: null });
  db.workspaceMember.findFirst.mockImplementation(async ({ where }: { where: { userId: string } }) => {
    const role = roles[where.userId];
    return role ? { id: `m-${where.userId}`, role, _count: { sitePermissions: 0 } } : null;
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  db.site.update.mockResolvedValue({});
  db.sitePermission.findUnique.mockResolvedValue(null);
  db.user.findUnique.mockResolvedValue(null);
});

describe("sites.transfer — the creator or the workspace OWNER, nobody else", () => {
  it("the creator who is not the OWNER may transfer", async () => {
    workspace({ creator: "ADMIN", "new-owner": "EDITOR" });
    await expect(caller("creator").transfer({ siteId: "s1", newOwnerId: "new-owner" })).resolves.toEqual({ success: true });
    expect(db.site.update).toHaveBeenCalledWith({ where: { id: "s1" }, data: { createdBy: "new-owner" } });
  });

  it("an EDITOR creator may transfer too", async () => {
    workspace({ creator: "EDITOR", "new-owner": "EDITOR" });
    await expect(caller("creator").transfer({ siteId: "s1", newOwnerId: "new-owner" })).resolves.toEqual({ success: true });
  });

  it("an ADMIN who is not the creator is refused (FORBIDDEN), nothing written", async () => {
    workspace({ "an-admin": "ADMIN", "new-owner": "EDITOR" });
    await expect(caller("an-admin").transfer({ siteId: "s1", newOwnerId: "new-owner" })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Only the workspace owner or the site's creator can transfer this site.",
    });
    expect(db.site.update).not.toHaveBeenCalled();
  });

  it("the workspace OWNER may transfer a site somebody else created", async () => {
    workspace({ "the-owner": "OWNER", "new-owner": "EDITOR" });
    await expect(caller("the-owner").transfer({ siteId: "s1", newOwnerId: "new-owner" })).resolves.toEqual({ success: true });
    expect(db.site.update).toHaveBeenCalledWith({ where: { id: "s1" }, data: { createdBy: "new-owner" } });
  });

  it("someone outside the workspace is refused", async () => {
    workspace({ "new-owner": "EDITOR" });
    await expect(caller("stranger").transfer({ siteId: "s1", newOwnerId: "new-owner" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.site.update).not.toHaveBeenCalled();
  });
});

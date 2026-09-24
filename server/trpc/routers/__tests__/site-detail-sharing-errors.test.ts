/**
 * siteDetail.sharing.create — plan limits are domain errors the router must
 * translate. A password link on a FREE workspace came back as a bare 500
 * (walk 2026-09-24).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const createShareLinkMock = vi.fn();

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({ extractBearer: () => null, verifyApiToken: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/server/services/permission.service", () => ({
  assertSiteAccess: vi.fn(),
  checkSiteRole: vi.fn().mockResolvedValue(undefined),
  PermissionError: class PermissionError extends Error {},
}));
vi.mock("@/server/services/share-link.service", () => ({
  listShareLinks: vi.fn(),
  revokeShareLink: vi.fn(),
  createShareLink: (...a: unknown[]) => createShareLinkMock(...a),
}));
vi.mock("@/server/services/activity-log.service", () => ({ recordForSite: vi.fn() }));

import { siteDetailRouter } from "@/server/trpc/routers/site-detail";

const caller = () => siteDetailRouter.createCaller({ session: { user: { id: "u_1" } }, prisma: {} } as never);

beforeEach(() => createShareLinkMock.mockReset());

describe("siteDetail.sharing.create — plan errors", () => {
  it.each([
    ["PASSWORD_LINKS_NOT_AVAILABLE", "FORBIDDEN", /Pro plan/],
    ["EXPIRY_EXCEEDS_PLAN", "FORBIDDEN", /expiry/],
    ["SHARE_LINK_LIMIT", "FORBIDDEN", /3 active share links/],
    ["SITE_NOT_FOUND", "NOT_FOUND", /Site not found/],
  ])("%s → %s with a readable message", async (domain, code, message) => {
    createShareLinkMock.mockRejectedValueOnce(new Error(domain));
    await expect(
      caller().sharing.create({ siteId: "s1", name: "Client", password: "secret-1" }),
    ).rejects.toMatchObject({ code, message: expect.stringMatching(message) });
  });

  it("an unknown failure still surfaces as itself, not a plan message", async () => {
    createShareLinkMock.mockRejectedValueOnce(new Error("DB down"));
    await expect(caller().sharing.create({ siteId: "s1", name: "Client" })).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });
});

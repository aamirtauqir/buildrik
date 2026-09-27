/**
 * I3 — procedures that return a Site row the service did not redact (the
 * service lives on the other side of an import cycle, or in another domain)
 * redact it at the router with the same helper: `sites.unpublish`,
 * `sites.folders.moveSite` and `siteDetail.settings.update`.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { unpublishSite, moveSiteToFolder, updateSiteSettings } = vi.hoisted(() => ({
  unpublishSite: vi.fn(),
  moveSiteToFolder: vi.fn(),
  updateSiteSettings: vi.fn(),
}));

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({ extractBearer: () => null, verifyApiToken: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }) }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/server/services/permission.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/services/permission.service")>()),
  checkSiteRole: vi.fn(),
}));
vi.mock("@/server/services/activity-log.service", () => ({ recordForSite: vi.fn(), record: vi.fn() }));
vi.mock("@/server/services/publish.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/services/publish.service")>()),
  unpublishSite,
}));
vi.mock("@/server/services/folder.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/services/folder.service")>()),
  moveSiteToFolder,
}));
vi.mock("@/server/services/site-settings.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/services/site-settings.service")>()),
  updateSiteSettings,
}));

import { sitesRouter } from "@/server/trpc/routers/sites";
import { siteDetailRouter } from "@/server/trpc/routers/site-detail";

const ctx = { session: { user: { id: "u_1" } }, prisma: {} } as never;
const ROW = { id: "s1", name: "Site", publishedPassword: "v1:ciphertext" };

beforeEach(() => {
  unpublishSite.mockReset().mockResolvedValue(ROW);
  moveSiteToFolder.mockReset().mockResolvedValue(ROW);
  updateSiteSettings.mockReset().mockResolvedValue(ROW);
});

describe("site rows returned by routers are redacted (I3)", () => {
  it("sites.unpublish", async () => {
    const result = await sitesRouter.createCaller(ctx).unpublish({ siteId: "s1" });
    expect(result).not.toHaveProperty("publishedPassword");
    expect(result.hasPublishedPassword).toBe(true);
  });

  it("sites.folders.moveSite", async () => {
    const result = await sitesRouter.createCaller(ctx).folders.moveSite({ siteId: "s1", folderId: null });
    expect(result).not.toHaveProperty("publishedPassword");
    expect(result.hasPublishedPassword).toBe(true);
  });

  it("siteDetail.settings.update", async () => {
    const result = await siteDetailRouter.createCaller(ctx).settings.update({ id: "s1", name: "Site" });
    expect(result).not.toHaveProperty("publishedPassword");
    expect(result.hasPublishedPassword).toBe(true);
  });
});

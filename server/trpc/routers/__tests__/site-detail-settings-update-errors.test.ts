/**
 * siteDetail.settings.update — the mutation's own error-mapping try/catch
 * (server/trpc/routers/site-detail.ts) had no router-level test: SA-06's
 * SLUG_TAKEN -> CONFLICT translation, and its three siblings
 * (CUSTOM_CODE_NOT_AVAILABLE, SITE_PASSWORD_NOT_AVAILABLE,
 * DEFAULT_LOCALE_NOT_ENABLED), were only ever exercised at the service
 * layer (__tests__/site-settings-slug.test.ts asserts the service throws
 * the strings; nothing asserted the router turns them into the right
 * TRPCError code/message, or that a successful update still records
 * activity).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { updateSiteSettings, checkSiteRole, recordForSite } = vi.hoisted(() => ({
  updateSiteSettings: vi.fn(),
  checkSiteRole: vi.fn(),
  recordForSite: vi.fn(),
}));

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({ extractBearer: () => null, verifyApiToken: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }) }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/server/services/permission.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/services/permission.service")>()),
  checkSiteRole,
}));
vi.mock("@/server/services/activity-log.service", () => ({ recordForSite, record: vi.fn() }));
vi.mock("@/server/services/site-settings.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/services/site-settings.service")>()),
  updateSiteSettings,
}));

import { siteDetailRouter } from "@/server/trpc/routers/site-detail";

function caller() {
  return siteDetailRouter.createCaller({ session: { user: { id: "u_1" } }, prisma: {} } as never);
}

beforeEach(() => {
  checkSiteRole.mockReset().mockResolvedValue(undefined);
  updateSiteSettings.mockReset();
  recordForSite.mockReset();
});

describe("siteDetail.settings.update — error mapping", () => {
  it("maps SLUG_TAKEN to CONFLICT with the user-facing slug message", async () => {
    updateSiteSettings.mockRejectedValue(new Error("SLUG_TAKEN"));

    await expect(
      caller().settings.update({ id: "s1", slug: "taken" })
    ).rejects.toMatchObject({ code: "CONFLICT", message: "Another site already uses that URL slug." });

    expect(recordForSite).not.toHaveBeenCalled();
  });

  it("maps PROJECT_NAME_TAKEN to CONFLICT with a slug-save message, not the domain path's", async () => {
    updateSiteSettings.mockRejectedValue(new Error("PROJECT_NAME_TAKEN"));

    await expect(
      caller().settings.update({ id: "s1", slug: "new-slug" })
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Another site already uses the address this slug would pin. Choose a different URL slug.",
    });

    expect(recordForSite).not.toHaveBeenCalled();
  });

  it("maps CUSTOM_CODE_NOT_AVAILABLE to FORBIDDEN", async () => {
    updateSiteSettings.mockRejectedValue(new Error("CUSTOM_CODE_NOT_AVAILABLE"));

    await expect(
      caller().settings.update({ id: "s1", headCode: "<script></script>" })
    ).rejects.toMatchObject({ code: "FORBIDDEN", message: "Custom code requires Pro or above" });
  });

  it("maps SITE_PASSWORD_NOT_AVAILABLE to FORBIDDEN", async () => {
    updateSiteSettings.mockRejectedValue(new Error("SITE_PASSWORD_NOT_AVAILABLE"));

    await expect(
      caller().settings.update({ id: "s1", publishedPassword: "hunter2" })
    ).rejects.toMatchObject({ code: "FORBIDDEN", message: "A published-site password requires Pro or above" });
  });

  it("maps DEFAULT_LOCALE_NOT_ENABLED to BAD_REQUEST", async () => {
    updateSiteSettings.mockRejectedValue(new Error("DEFAULT_LOCALE_NOT_ENABLED"));

    await expect(
      caller().settings.update({ id: "s1", name: "Site" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rethrows an unrecognized service error unmapped", async () => {
    updateSiteSettings.mockRejectedValue(new Error("SOMETHING_ELSE"));

    await expect(caller().settings.update({ id: "s1", name: "Site" })).rejects.toThrow("SOMETHING_ELSE");
  });

  it("on success, redacts the password and records one settings.updated activity entry with the changed keys", async () => {
    updateSiteSettings.mockResolvedValue({ id: "s1", name: "New Name", publishedPassword: "v1:secret" });

    const result = await caller().settings.update({ id: "s1", name: "New Name", allowIndexing: true });

    expect(result).not.toHaveProperty("publishedPassword");
    expect(recordForSite).toHaveBeenCalledTimes(1);
    expect(recordForSite).toHaveBeenCalledWith(
      expect.objectContaining({
        siteId: "s1",
        actorId: "u_1",
        action: "site.settings.updated",
        metadata: { changedKeys: ["name", "allowIndexing"] },
      })
    );
  });
});

/**
 * siteDetail.projectSettings.update (Settings Phase B, BE-2) — the Settings
 * Save's JSON half. The role follows the key: analytics and the 404 switch are
 * EDITOR (what saving the project they rode in required), global CSS is ADMIN
 * like head/body code. A refused id never reaches the service, and the error
 * carries the refused path (`zodIssues`) so the editor can name the field.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

const { updateProjectSettings, checkSiteRole, recordForSite } = vi.hoisted(() => ({
  updateProjectSettings: vi.fn(),
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
  updateProjectSettings,
}));

import { siteDetailRouter } from "@/server/trpc/routers/site-detail";
import { PermissionError } from "@/server/services/permission.service";
import { getErrorShape } from "@trpc/server/unstable-core-do-not-import";

const caller = () => siteDetailRouter.createCaller({ session: { user: { id: "u_1" } }, prisma: {} } as never);

beforeEach(() => {
  checkSiteRole.mockReset().mockResolvedValue(undefined);
  updateProjectSettings.mockReset().mockResolvedValue({ saved: {}, warnings: { legacyAnalyticsIds: [] } });
  recordForSite.mockReset();
});

describe("siteDetail.projectSettings.update — role per key", () => {
  it("analytics and the 404 switch need EDITOR", async () => {
    await caller().projectSettings.update({ siteId: "s1", patch: { analytics: { cookieConsent: { enabled: true } }, redirects: { suggestFrom404s: false } } });
    expect(checkSiteRole).toHaveBeenCalledWith({}, "u_1", "s1", "EDITOR");
  });

  it("global CSS needs ADMIN, and an EDITOR is refused before the service runs", async () => {
    checkSiteRole.mockImplementation(async (_db, _u, _s, min) => {
      if (min === "ADMIN") throw new PermissionError("FORBIDDEN", "Insufficient permissions");
    });
    await expect(
      caller().projectSettings.update({ siteId: "s1", patch: { customCode: { globalCss: "h1{}" } } }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(updateProjectSettings).not.toHaveBeenCalled();
  });

  it("logs the changed keys and returns the service's answer", async () => {
    updateProjectSettings.mockResolvedValue({ saved: { redirects: { suggestFrom404s: true } }, warnings: { legacyAnalyticsIds: [] } });
    const result = await caller().projectSettings.update({ siteId: "s1", patch: { redirects: { suggestFrom404s: true } } });
    expect(result.saved).toEqual({ redirects: { suggestFrom404s: true } });
    expect(recordForSite).toHaveBeenCalledWith(
      expect.objectContaining({ siteId: "s1", action: "site.settings.updated", metadata: { changedKeys: ["redirects"] } }),
    );
  });

  it("maps the Pro gate to FORBIDDEN", async () => {
    updateProjectSettings.mockRejectedValue(new Error("CUSTOM_CODE_NOT_AVAILABLE"));
    await expect(
      caller().projectSettings.update({ siteId: "s1", patch: { customCode: { globalCss: "h1{}" } } }),
    ).rejects.toMatchObject({ code: "FORBIDDEN", message: "Custom code requires Pro or above" });
  });

  it("refuses an injection-shaped id; the error names the field's path", async () => {
    let error: unknown;
    try {
      await caller().projectSettings.update({
        siteId: "s1",
        patch: { analytics: { googleAnalytics: { enabled: true, measurementId: "x');alert(1)//" } } },
      });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(TRPCError);
    expect(updateProjectSettings).not.toHaveBeenCalled();
    const shape = getErrorShape({
      config: siteDetailRouter._def._config,
      error: error as TRPCError,
      type: "mutation",
      path: "siteDetail.projectSettings.update",
      input: undefined,
      ctx: undefined,
    });
    expect(shape.data).toMatchObject({
      zodIssues: [{ path: "patch.analytics.googleAnalytics.measurementId", message: "Use only letters, numbers, - and _." }],
    });
  });
});

/**
 * S-7 / PD-9: sites.publish's `acknowledgeStale` override ships past a
 * stale-approval block — a reviewer signed off on an earlier version of the
 * site. That override needs ADMIN+, not the plain EDITOR tier that may
 * publish under a fresh approval.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

const checkSiteRoleMock = vi.fn();
const startPublishMock = vi.fn();

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({
  extractBearer: () => null,
  verifyApiToken: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/server/trpc/workspace-ctx", () => ({
  resolveWorkspaceId: vi.fn().mockResolvedValue("ws_1"),
}));
vi.mock("@/server/services/permission.service", () => ({
  assertSiteAccess: vi.fn(),
  checkSiteRole: (...a: unknown[]) => checkSiteRoleMock(...a),
  checkWorkspaceRole: vi.fn(),
  getEffectiveSiteRole: vi.fn(),
  PermissionError: class PermissionError extends Error {
    code: string;
    constructor(code: string, msg?: string) { super(msg ?? code); this.code = code; }
  },
}));
vi.mock("@/server/services/sites.service", () => ({
  listSites: vi.fn(), getSite: vi.fn(), renameSite: vi.fn(), archiveSite: vi.fn(),
  unarchiveSite: vi.fn(), deleteSite: vi.fn(), bulkAction: vi.fn(),
  checkSlugAvailability: vi.fn(), transferSite: vi.fn(), saveProjectData: vi.fn(),
  saveProjectFromEditor: vi.fn(), getProjectData: vi.fn(), createSite: vi.fn(),
  duplicateSite: vi.fn(),
}));
vi.mock("@/server/services/folder.service", () => ({
  listFolders: vi.fn(), createFolder: vi.fn(), deleteFolder: vi.fn(),
  moveSiteToFolder: vi.fn(), renameFolder: vi.fn(),
}));
vi.mock("@/server/services/publish.service", () => ({
  runPrePublishChecks: vi.fn(), startPublish: (...a: unknown[]) => startPublishMock(...a),
  getPublishStatus: vi.fn(),
  cancelPublish: vi.fn(), unpublishSite: vi.fn(), getPublishHistory: vi.fn(),
  rollbackPublish: vi.fn(),
}));
vi.mock("@/server/services/scheduled-publish.service", () => ({
  schedulePublish: vi.fn(), cancelScheduledPublish: vi.fn(), getScheduledPublish: vi.fn(),
  ScheduledPublishError: class ScheduledPublishError extends Error {},
}));
vi.mock("@/server/services/activity-log.service", () => ({ recordForSite: vi.fn() }));
vi.mock("@/server/services/template.service", () => ({
  listTemplates: vi.fn(), getTemplate: vi.fn(), cloneSiteAsTemplate: vi.fn(),
  applyTemplateToSite: vi.fn(), useTemplate: vi.fn(),
  TemplateError: class TemplateError extends Error {},
}));
vi.mock("@/server/services/ai-generation.service", () => ({
  createGenerationJob: vi.fn(), getJobStatus: vi.fn(), cancelJob: vi.fn(),
}));
vi.mock("@buildrik/shared/schemas/sites", () => {
  const any = z.any();
  return {
    listSitesSchema: any, createSiteSchema: any, bulkActionSchema: any,
    transferSiteSchema: any, checkSlugSchema: any, saveProjectDataSchema: any,
    getProjectDataSchema: any, editorSaveProjectSchema: any,
  };
});

import { sitesRouter } from "@/server/trpc/routers/sites";
import { PermissionError } from "@/server/services/permission.service";

const ctx = () => ({ session: { user: { id: "u_1" } }, prisma: {} as never });

beforeEach(() => {
  [checkSiteRoleMock, startPublishMock].forEach((m) => m.mockReset());
  startPublishMock.mockResolvedValue({ jobId: "job_1" });
});

describe("sites.publish — acknowledgeStale requires ADMIN (S-7 / PD-9)", () => {
  it("an EDITOR publishing WITHOUT acknowledgeStale needs only EDITOR", async () => {
    checkSiteRoleMock.mockResolvedValueOnce(undefined); // EDITOR gate only
    const caller = sitesRouter.createCaller(ctx() as never);
    await expect(caller.publish({ siteId: "s1", pages: [] } as never)).resolves.toEqual({ jobId: "job_1" });
    expect(checkSiteRoleMock).toHaveBeenCalledTimes(1);
    expect(checkSiteRoleMock).toHaveBeenCalledWith(expect.anything(), "u_1", "s1", "EDITOR");
  });

  it("an EDITOR (not ADMIN) publishing WITH acknowledgeStale is FORBIDDEN, never publishes", async () => {
    checkSiteRoleMock
      .mockResolvedValueOnce(undefined) // EDITOR gate passes
      .mockRejectedValueOnce(new PermissionError("FORBIDDEN", "needs ADMIN")); // ADMIN gate for acknowledgeStale
    const caller = sitesRouter.createCaller(ctx() as never);
    await expect(
      caller.publish({ siteId: "s1", pages: [], acknowledgeStale: true } as never),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(startPublishMock).not.toHaveBeenCalled();
  });

  it("an ADMIN publishing WITH acknowledgeStale succeeds", async () => {
    checkSiteRoleMock
      .mockResolvedValueOnce(undefined) // EDITOR gate
      .mockResolvedValueOnce(undefined); // ADMIN gate
    const caller = sitesRouter.createCaller(ctx() as never);
    await expect(
      caller.publish({ siteId: "s1", pages: [], acknowledgeStale: true } as never),
    ).resolves.toEqual({ jobId: "job_1" });
    expect(startPublishMock).toHaveBeenCalledWith("s1", "ws_1", "u_1", [], true, {
      expectedLastEditedAt: undefined,
    });
  });
});

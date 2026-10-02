import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

const checkSiteRoleMock = vi.fn();
const startPublishMock = vi.fn();
const rollbackPublishMock = vi.fn();
const schedulePublishMock = vi.fn();

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
  rollbackPublish: (...a: unknown[]) => rollbackPublishMock(...a),
}));
vi.mock("@/server/services/scheduled-publish.service", () => ({
  schedulePublish: (...a: unknown[]) => schedulePublishMock(...a), cancelScheduledPublish: vi.fn(), getScheduledPublish: vi.fn(),
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
    getProjectDataSchema: any, editorSaveProjectSchema: any, restoreSiteSchema: any,
    SITE_RESTORE_WINDOW_DAYS: 30,
  };
});

import { sitesRouter } from "@/server/trpc/routers/sites";

const ctx = () => ({ session: { user: { id: "u_1" } }, prisma: {} as never });
const MESSAGE = "This workspace is scheduled for deletion. Cancel the deletion to publish.";

beforeEach(() => {
  [checkSiteRoleMock, startPublishMock, rollbackPublishMock, schedulePublishMock].forEach((m) => m.mockReset());
  checkSiteRoleMock.mockResolvedValue(undefined);
  const refused = new Error("WORKSPACE_DELETION_SCHEDULED");
  startPublishMock.mockRejectedValue(refused);
  rollbackPublishMock.mockRejectedValue(refused);
  schedulePublishMock.mockRejectedValue(refused);
});

/* SA-04 (D6): the service refuses; the router says why and what to do. */
describe("publishing into a workspace scheduled for deletion", () => {
  it("sites.publish → PRECONDITION_FAILED with the cancel-to-publish message", async () => {
    const caller = sitesRouter.createCaller(ctx() as never);
    await expect(caller.publish({ siteId: "s1", pages: [] } as never)).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
      message: MESSAGE,
    });
  });

  it("sites.rollback → PRECONDITION_FAILED with the same message", async () => {
    const caller = sitesRouter.createCaller(ctx() as never);
    await expect(caller.rollback({ siteId: "s1", jobId: "j1" } as never)).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
      message: MESSAGE,
    });
  });

  it("sites.schedulePublish → PRECONDITION_FAILED with the same message", async () => {
    const caller = sitesRouter.createCaller(ctx() as never);
    await expect(
      caller.schedulePublish({ siteId: "s1", scheduledFor: new Date("2026-11-01") }),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED", message: MESSAGE });
  });
});

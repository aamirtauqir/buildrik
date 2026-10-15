/**
 * S6 (ER-T3/ER-T4/DR-T4): the server's own checks refusing a publish reaches
 * the client as one contract (`Publish stopped: <labels>.` + cause.blockers),
 * and the two retries that never redeploy are EDITOR-gated per site.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

const checkSiteRoleMock = vi.fn();
const startPublishMock = vi.fn();
const retryFormsMock = vi.fn();
const retryPostDeployMock = vi.fn();
const blocked = vi.hoisted(() => ({
  PublishBlockedError: class PublishBlockedError extends Error {
    constructor(public blockers: Array<{ label: string; detail: string }>) {
      super(`PUBLISH_BLOCKED: ${blockers.map((b) => b.label).join(", ")}`);
    }
    get userMessage() {
      return `Publish stopped: ${this.blockers.map((b) => b.label).join(", ")}.`;
    }
  },
}));

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
  PublishBlockedError: blocked.PublishBlockedError,
}));
vi.mock("@/server/services/publish-bundle.service", () => ({
  retryFormsActivation: (...a: unknown[]) => retryFormsMock(...a),
  retryPostDeployStep: (...a: unknown[]) => retryPostDeployMock(...a),
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
    getProjectDataSchema: any, editorSaveProjectSchema: any, restoreSiteSchema: any,
    SITE_RESTORE_WINDOW_DAYS: 30,
  };
});

import { sitesRouter } from "@/server/trpc/routers/sites";
import { PermissionError } from "@/server/services/permission.service";

const ctx = () => ({ session: { user: { id: "u_1" } }, prisma: {} as never });

beforeEach(() => {
  [checkSiteRoleMock, startPublishMock, retryFormsMock, retryPostDeployMock].forEach((m) => m.mockReset());
});

const PUBLISH = { siteId: "s1", pages: [], expectedLastEditedAt: "2026-10-08T10:00:00.000Z" } as never;

describe("sites.publish — the server's checks refused it (DR-T4)", () => {
  it("is PRECONDITION_FAILED with the sentence the editor reads and the rows as data", async () => {
    checkSiteRoleMock.mockResolvedValueOnce(undefined);
    startPublishMock.mockRejectedValueOnce(
      new blocked.PublishBlockedError([
        { label: "Pages ready", detail: "No pages." },
        { label: "Collection lists", detail: "Home › List isn't connected." },
      ]),
    );
    const caller = sitesRouter.createCaller(ctx() as never);
    await expect(caller.publish(PUBLISH)).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
      message: "Publish stopped: Pages ready, Collection lists.",
      cause: expect.objectContaining({
        reason: "PUBLISH_BLOCKED",
        blockers: [
          { label: "Pages ready", detail: "No pages." },
          { label: "Collection lists", detail: "Home › List isn't connected." },
        ],
      }),
    });
  });
});

describe("sites.retryFormsActivation / retryPostDeploy — EDITOR on the site", () => {
  const JOB = { siteId: "s1", jobId: "j1" };

  it("a VIEWER is FORBIDDEN on both and nothing runs", async () => {
    checkSiteRoleMock.mockRejectedValue(new PermissionError("FORBIDDEN", "needs EDITOR"));
    const caller = sitesRouter.createCaller(ctx() as never);
    await expect(caller.retryFormsActivation(JOB)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.retryPostDeploy(JOB)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(checkSiteRoleMock).toHaveBeenCalledWith(expect.anything(), "u_1", "s1", "EDITOR");
    expect(retryFormsMock).not.toHaveBeenCalled();
    expect(retryPostDeployMock).not.toHaveBeenCalled();
  });

  it("an EDITOR's retry runs for that site's job", async () => {
    checkSiteRoleMock.mockResolvedValue(undefined);
    retryFormsMock.mockResolvedValueOnce("ACTIVE");
    retryPostDeployMock.mockResolvedValueOnce(undefined);
    const caller = sitesRouter.createCaller(ctx() as never);
    await expect(caller.retryFormsActivation(JOB)).resolves.toEqual({ formsStatus: "ACTIVE" });
    await expect(caller.retryPostDeploy(JOB)).resolves.toEqual({ ok: true });
    expect(retryFormsMock).toHaveBeenCalledWith("s1", "j1");
    expect(retryPostDeployMock).toHaveBeenCalledWith("s1", "j1");
  });

  it("a job of another site, or one with nothing to retry, is NOT_FOUND", async () => {
    checkSiteRoleMock.mockResolvedValue(undefined);
    retryFormsMock.mockRejectedValueOnce(new Error("NOT_FOUND"));
    retryPostDeployMock.mockRejectedValueOnce(new Error("NOT_FOUND"));
    const caller = sitesRouter.createCaller(ctx() as never);
    await expect(caller.retryFormsActivation(JOB)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.retryPostDeploy(JOB)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

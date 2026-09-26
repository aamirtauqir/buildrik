/**
 * S-10: sites.duplicate must also check the DESTINATION workspace (the
 * caller's current session workspace, which can differ from the source
 * site's workspace that checkSiteRole already validated); sites.getScheduledPublish
 * must translate a PermissionError into a TRPCError instead of letting it
 * fall through as a 500.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

const checkSiteRoleMock = vi.fn();
const checkWorkspaceRoleMock = vi.fn();
const assertSiteAccessMock = vi.fn();
const duplicateSiteMock = vi.fn();
const getScheduledPublishMock = vi.fn();
const saveProjectFromEditorMock = vi.fn();

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
  resolveWorkspaceId: vi.fn().mockResolvedValue("ws_dest"),
}));
vi.mock("@/server/services/permission.service", () => ({
  assertSiteAccess: (...a: unknown[]) => assertSiteAccessMock(...a),
  checkSiteRole: (...a: unknown[]) => checkSiteRoleMock(...a),
  checkWorkspaceRole: (...a: unknown[]) => checkWorkspaceRoleMock(...a),
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
  saveProjectFromEditor: (...a: unknown[]) => saveProjectFromEditorMock(...a), getProjectData: vi.fn(), createSite: vi.fn(),
  duplicateSite: (...a: unknown[]) => duplicateSiteMock(...a),
}));
vi.mock("@/server/services/folder.service", () => ({
  listFolders: vi.fn(), createFolder: vi.fn(), deleteFolder: vi.fn(),
  moveSiteToFolder: vi.fn(), renameFolder: vi.fn(),
}));
vi.mock("@/server/services/publish.service", () => ({
  runPrePublishChecks: vi.fn(), startPublish: vi.fn(), getPublishStatus: vi.fn(),
  cancelPublish: vi.fn(), unpublishSite: vi.fn(), getPublishHistory: vi.fn(),
  rollbackPublish: vi.fn(),
}));
vi.mock("@/server/services/scheduled-publish.service", () => ({
  schedulePublish: vi.fn(), cancelScheduledPublish: vi.fn(),
  getScheduledPublish: (...a: unknown[]) => getScheduledPublishMock(...a),
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
  [checkSiteRoleMock, checkWorkspaceRoleMock, assertSiteAccessMock, duplicateSiteMock, getScheduledPublishMock, saveProjectFromEditorMock].forEach((m) =>
    m.mockReset(),
  );
});

describe("sites.duplicate — destination workspace role (S-10)", () => {
  it("EDITOR on the source site but not on the destination (session) workspace is FORBIDDEN, never duplicates", async () => {
    checkSiteRoleMock.mockResolvedValueOnce(undefined); // source site: EDITOR OK
    checkWorkspaceRoleMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN", "needs EDITOR"));
    const caller = sitesRouter.createCaller(ctx() as never);
    await expect(caller.duplicate({ id: "s_src" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(duplicateSiteMock).not.toHaveBeenCalled();
  });

  it("EDITOR on both source and destination workspace succeeds", async () => {
    checkSiteRoleMock.mockResolvedValueOnce(undefined);
    checkWorkspaceRoleMock.mockResolvedValueOnce(undefined);
    duplicateSiteMock.mockResolvedValueOnce({ id: "s_copy" });
    const caller = sitesRouter.createCaller(ctx() as never);
    await expect(caller.duplicate({ id: "s_src" })).resolves.toEqual({ id: "s_copy" });
    expect(checkWorkspaceRoleMock).toHaveBeenCalledWith(expect.anything(), "u_1", "ws_dest", "EDITOR");
  });
});

describe("sites.getScheduledPublish — PermissionError translation (S-10)", () => {
  it("a foreign site is FORBIDDEN, not a 500", async () => {
    assertSiteAccessMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN"));
    const caller = sitesRouter.createCaller(ctx() as never);
    await expect(caller.getScheduledPublish({ siteId: "s_foreign" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(getScheduledPublishMock).not.toHaveBeenCalled();
  });

  it("a member reads the schedule", async () => {
    assertSiteAccessMock.mockResolvedValueOnce(undefined);
    getScheduledPublishMock.mockResolvedValueOnce({ scheduledFor: null });
    const caller = sitesRouter.createCaller(ctx() as never);
    await expect(caller.getScheduledPublish({ siteId: "s_1" })).resolves.toEqual({ scheduledFor: null });
  });
});

describe("sites.saveProject — a page of another site (I-2)", () => {
  it("the service's PermissionError reaches the client as FORBIDDEN, not a 500", async () => {
    checkSiteRoleMock.mockResolvedValueOnce(undefined);
    saveProjectFromEditorMock.mockRejectedValueOnce(new PermissionError("FORBIDDEN", "belongs to another site"));
    const caller = sitesRouter.createCaller(ctx() as never);
    await expect(
      caller.saveProject({ siteId: "s_a", projectData: { version: "1", pages: [], styles: [], assets: [] } } as never),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

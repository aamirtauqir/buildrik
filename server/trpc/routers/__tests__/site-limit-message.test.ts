/**
 * What a user is told when they hit the site limit.
 *
 * Three doors create a site — create, duplicate, and apply a template — and all
 * three raise the same SITE_LIMIT from the same `assertSiteQuota`. Only one of
 * them mentioned upgrading. The other two toasted "Site limit reached." and
 * stopped there, on the one screen where the product has a paid answer to the
 * problem it just described.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

const createSiteMock = vi.fn();
const duplicateSiteMock = vi.fn();
const useTemplateMock = vi.fn();

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
  checkSiteRole: vi.fn(),
  checkWorkspaceRole: vi.fn(),
  PermissionError: class PermissionError extends Error {
    code: string;
    constructor(code: string, msg?: string) { super(msg ?? code); this.code = code; }
  },
}));
vi.mock("@/server/services/sites.service", () => ({
  listSites: vi.fn(), getSite: vi.fn(), renameSite: vi.fn(), archiveSite: vi.fn(),
  unarchiveSite: vi.fn(), deleteSite: vi.fn(), bulkAction: vi.fn(),
  checkSlugAvailability: vi.fn(), transferSite: vi.fn(), saveProjectData: vi.fn(),
  saveProjectFromEditor: vi.fn(), getProjectData: vi.fn(),
  createSite: (...a: unknown[]) => createSiteMock(...a),
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
vi.mock("@/server/services/activity-log.service", () => ({ recordForSite: vi.fn() }));
vi.mock("@/server/services/template.service", () => ({
  listTemplates: vi.fn(), getTemplate: vi.fn(), cloneSiteAsTemplate: vi.fn(),
  applyTemplateToSite: vi.fn(),
  useTemplate: (...a: unknown[]) => useTemplateMock(...a),
  TemplateError: class TemplateError extends Error {
    code: string;
    constructor(code: string, msg?: string) { super(msg ?? code); this.code = code; }
  },
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
vi.mock("@buildrik/shared/schemas/templates", () => {
  const any = z.any();
  return { listTemplatesSchema: any, generateSiteSchema: any, applyTemplateToSiteSchema: any };
});

import { sitesRouter } from "@/server/trpc/routers/sites";
import { templatesRouter } from "@/server/trpc/routers/templates";

const ctx = () => ({ session: { user: { id: "u_1", workspaceId: "ws_1" } }, prisma: {} as never });

beforeEach(() => {
  for (const m of [createSiteMock, duplicateSiteMock, useTemplateMock]) {
    m.mockReset();
    m.mockRejectedValue(new Error("SITE_LIMIT"));
  }
});

/** Every door must name the limit AND the way past it. */
const tellsThemHowToUpgrade = (message: string) =>
  /limit/i.test(message) && /upgrade/i.test(message);

describe("the site limit tells the same story at every door", () => {
  it("create", async () => {
    const caller = sitesRouter.createCaller(ctx() as never);
    await expect(caller.create({ name: "x", method: "blank" } as never)).rejects.toSatisfy(
      (e: { message: string }) => tellsThemHowToUpgrade(e.message),
    );
  });

  it("duplicate", async () => {
    const caller = sitesRouter.createCaller(ctx() as never);
    await expect(caller.duplicate({ id: "s_1" } as never)).rejects.toSatisfy(
      (e: { message: string }) => tellsThemHowToUpgrade(e.message),
    );
  });

  it("apply a template", async () => {
    const caller = templatesRouter.createCaller(ctx() as never);
    await expect(
      caller.use({ templateId: "t_1", siteName: "My Site" } as never),
    ).rejects.toSatisfy((e: { message: string }) => tellsThemHowToUpgrade(e.message));
  });
});

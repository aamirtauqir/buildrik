/**
 * The pre-publish checks describe the deploy, so they have to count what the
 * deploy ships. Hidden and password pages stopped being published this
 * morning; these checks still counted every page, so a site with one live page
 * and one hidden read "2 pages ready to publish" and warned that the hidden
 * one had no content — a warning about something that does not ship.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const pageFindManyMock = vi.fn();
const siteFindUniqueMock = vi.fn();
const domainFindFirstMock = vi.fn();
const cmsCollectionFindManyMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    page: { findMany: (...a: unknown[]) => pageFindManyMock(...a) },
    site: { findUnique: (...a: unknown[]) => siteFindUniqueMock(...a) },
    domain: { findFirst: (...a: unknown[]) => domainFindFirstMock(...a) },
    // The module touches these elsewhere; the checks under test do not, but a
    // bare mock object makes the import graph resolvable.
    publishBuildJob: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
    workspace: { findUnique: vi.fn() },
    workspaceMember: { findUnique: vi.fn() },
    reviewRequest: { findFirst: vi.fn() },
    // `getActiveVercelConnection` lives in integrations.service, not lib/vercel
    // — it reads this table directly.

    // A-17: runPrePublishChecks' CMS-templates check reads this via
    // cms.service's findStaleTemplateBindings.
    cmsCollection: { findMany: (...a: unknown[]) => cmsCollectionFindManyMock(...a) },

    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/vercel", () => ({
  createVercelDeployment: vi.fn(),
  pollDeploymentReady: vi.fn(),
  deleteDeployment: vi.fn(),
  VercelApiError: class extends Error {},
}));
// The Vercel check is not what these tests are about; it reads an encrypted
// config off the workspace, so mock the reader rather than the table.
vi.mock("@server/services/integrations.service", () => ({
  getActiveVercelConnection: vi.fn(async () => ({ id: "i1", token: "tok", teamId: null })),
}));

import { runPrePublishChecks } from "@server/services/publish.service";

const detail = (checks: Array<{ label: string; detail: string }>, label: string) =>
  checks.find((c) => c.label === label)?.detail ?? "";
const status = (checks: Array<{ label: string; status: string }>, label: string) =>
  checks.find((c) => c.label === label)?.status;

beforeEach(() => {
  pageFindManyMock.mockReset();
  siteFindUniqueMock.mockReset().mockResolvedValue({
    metaTitleTemplate: "{page} — Site", touchIcon: "x", deletedAt: null, workspaceId: "ws1",
  });
  domainFindFirstMock.mockReset().mockResolvedValue(null);
  cmsCollectionFindManyMock.mockReset().mockResolvedValue([]);
});

describe("pre-publish checks count what ships", () => {
  it("leaves a hidden page out of the ready count", async () => {
    pageFindManyMock.mockResolvedValue([
      { id: "1", name: "Home", blocks: [{}], settings: null },
      { id: "2", name: "Draft", blocks: [{}], settings: { visibility: "hidden" } },
    ]);
    const { checks } = await runPrePublishChecks("s1");
    expect(detail(checks, "Pages ready")).toContain("1 page ready");
  });

  it("does not warn about a hidden page having no content", async () => {
    pageFindManyMock.mockResolvedValue([
      { id: "1", name: "Home", blocks: [{}], settings: { visibility: "live" } },
      { id: "2", name: "Draft", blocks: [], settings: { visibility: "hidden" } },
    ]);
    const { checks } = await runPrePublishChecks("s1");
    expect(status(checks, "Empty pages")).toBe("pass");
  });

  it("still warns about an empty page that DOES ship", async () => {
    pageFindManyMock.mockResolvedValue([
      { id: "1", name: "Home", blocks: [], settings: null },
    ]);
    const { checks } = await runPrePublishChecks("s1");
    expect(status(checks, "Empty pages")).toBe("warning");
  });

  it("fails when every page is non-live, rather than claiming pages are ready", async () => {
    pageFindManyMock.mockResolvedValue([
      { id: "1", name: "Home", blocks: [{}], settings: { visibility: "password" } },
    ]);
    const { checks } = await runPrePublishChecks("s1");
    expect(status(checks, "Pages ready")).toBe("fail");
  });

  // A-17: a page-generating CMS collection whose bound template page is gone
  // used to ship silently with no generated pages — surface it as a warning
  // before publish.
  it("passes CMS templates when there is no page-generating collection", async () => {
    pageFindManyMock.mockResolvedValue([{ id: "1", name: "Home", blocks: [{}], settings: null, slug: "home", isHomePage: true }]);
    const { checks } = await runPrePublishChecks("s1");
    expect(status(checks, "CMS templates")).toBe("pass");
  });

  it("warns when a collection's bound template page no longer exists", async () => {
    pageFindManyMock.mockResolvedValue([{ id: "1", name: "Home", blocks: [{}], settings: null, slug: "home", isHomePage: true }]);
    cmsCollectionFindManyMock.mockResolvedValue([{ id: "c1", name: "Blog", pageTemplatePath: "gone.html" }]);
    const { checks } = await runPrePublishChecks("s1");
    expect(status(checks, "CMS templates")).toBe("warning");
    expect(detail(checks, "CMS templates")).toContain("Blog");
  });

  it("passes when the bound template page still exists", async () => {
    pageFindManyMock.mockResolvedValue([
      { id: "1", name: "Home", blocks: [{}], settings: null, slug: "home", isHomePage: true },
      { id: "2", name: "Blog template", blocks: [{}], settings: null, slug: "blog-template", isHomePage: false },
    ]);
    cmsCollectionFindManyMock.mockResolvedValue([{ id: "c1", name: "Blog", pageTemplatePath: "blog-template.html" }]);
    const { checks } = await runPrePublishChecks("s1");
    expect(status(checks, "CMS templates")).toBe("pass");
  });
});

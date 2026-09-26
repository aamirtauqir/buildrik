/**
 * The pre-publish checks describe the deploy, so they have to count what the
 * deploy ships. Hidden and password pages stopped being published this
 * morning; these checks still counted every page, so a site with one live page
 * and one hidden read "2 pages ready to publish" and warned that the hidden
 * one had no content — a warning about something that does not ship.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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

  /* Lrt round 1: a real page stores an element ROOT, not an array, so the
     [] test never warned for one — and new pages now store an empty root
     object (blankPageRoot) instead of []. Both shapes are empty. */
  it("warns about a page whose stored root has no children", async () => {
    pageFindManyMock.mockResolvedValue([
      { id: "1", name: "Home", blocks: { id: "root", type: "container", children: [{ id: "h", type: "heading" }] }, settings: null },
      { id: "2", name: "New", blocks: { id: "el-x", type: "container", children: [] }, settings: null },
    ]);
    const { checks } = await runPrePublishChecks("s1");
    expect(status(checks, "Empty pages")).toBe("warning");
    expect(detail(checks, "Empty pages")).toContain("1 page has");
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
  // Minor fix: a "pass" row for a check that
  // never applies is noise on the near-all-sites-have-no-CMS-collection
  // case — the row is absent entirely, not a pass.
  it("omits the CMS templates row entirely when there is no page-generating collection", async () => {
    pageFindManyMock.mockResolvedValue([{ id: "1", name: "Home", blocks: [{}], settings: null, slug: "home", isHomePage: true }]);
    const { checks } = await runPrePublishChecks("s1");
    expect(status(checks, "CMS templates")).toBeUndefined();
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

  /* Lv3 review #7: a bound template page is a blueprint and is no longer
     published as a page of its own (appendDynamicPagesToPublish) — the
     checks say so, by name, before the publish. */
  it("names each template page that will not be published as a page", async () => {
    pageFindManyMock.mockResolvedValue([
      { id: "1", name: "Home", blocks: [{}], settings: null, slug: "home", isHomePage: true },
      { id: "2", name: "Blog template", blocks: [{}], settings: null, slug: "blog-template", isHomePage: false },
    ]);
    cmsCollectionFindManyMock.mockResolvedValue([{ id: "c1", name: "Blog", pageTemplatePath: "blog-template.html" }]);
    const { checks, ready } = await runPrePublishChecks("s1");
    expect(status(checks, "Template pages")).toBe("warning");
    expect(detail(checks, "Template pages")).toBe("Blog template is a template for Blog — not published.");
    expect(ready).toBe(true);
  });
});

/* B-14 / A02-9: Publish listed no content facts at all, so the Issues panel
   and Publish could not agree on an image with no alt text or a link to a
   deleted page. The checks now run the shared detector
   (`@buildrik/shared/content/contentIssues`) over the stored blocks — the
   same one the editor scanner runs — as warnings, never blocking. Shapes
   below are the real stored `pages.blocks` root (buildrik_verify S2/Home). */
describe("pre-publish content checks (shared detector)", () => {
  const storedHome = {
    id: "root",
    type: "container",
    tagName: "div",
    children: [
      { id: "img-noalt", type: "image", tagName: "img", children: [], attributes: { src: "https://placehold.co/300x200" } },
      { id: "img-ok", type: "image", tagName: "img", children: [], attributes: { alt: "Image" } },
      { id: "link-dead", type: "link", tagName: "a", content: "Dead", children: [], attributes: { href: "#page:does-not-exist-xyz" } },
      { id: "link-ok", type: "link", tagName: "a", content: "Services", children: [], attributes: { href: "#page:p2" } },
    ],
  };

  it("warns about a missing alt and a dead internal link, without blocking", async () => {
    pageFindManyMock.mockResolvedValue([
      { id: "p1", name: "Home", blocks: storedHome, settings: null },
      { id: "p2", name: "Services", blocks: { id: "r2", type: "container", children: [] }, settings: null },
    ]);
    const result = await runPrePublishChecks("s1");
    expect(status(result.checks, "Image alt text")).toBe("warning");
    expect(detail(result.checks, "Image alt text")).toContain("1 image");
    expect(status(result.checks, "Links")).toBe("warning");
    expect(detail(result.checks, "Links")).toContain("1 link");
    expect(result.ready).toBe(true);
  });

  it("passes Links for root-relative internal paths (/, /about, /services)", async () => {
    const nav = ["/", "/about", "/services"].map((href, i) => ({
      id: `nav-${i}`, type: "link", tagName: "a", content: href, children: [], attributes: { href },
    }));
    pageFindManyMock.mockResolvedValue([
      { id: "p1", name: "Home", blocks: { id: "root", type: "container", tagName: "div", children: nav }, settings: null },
    ]);
    const { checks } = await runPrePublishChecks("s1");
    expect(status(checks, "Links")).toBe("pass");
  });

  it("passes both rows when content is clean, and tolerates legacy array blocks", async () => {
    pageFindManyMock.mockResolvedValue([
      { id: "p1", name: "Home", blocks: [], settings: null },
      { id: "p2", name: "Services", blocks: { id: "r2", type: "container", children: [] }, settings: null },
    ]);
    const { checks } = await runPrePublishChecks("s1");
    expect(status(checks, "Image alt text")).toBe("pass");
    expect(status(checks, "Links")).toBe("pass");
  });
});

/* Lv3 (verify pass 3, Found #3): under PUBLISH_ALLOW_SIMULATION startPublish
   and the worker skip the Vercel connection, and root CLAUDE.md says the flag
   skips this check — but the check still FAILED with no connection, so the
   editor's "Publish now" stayed disabled and the local simulation loop could
   not be reached from the UI. Keyed on the flag, never on NODE_ENV. */
describe("Vercel connected check — PUBLISH_ALLOW_SIMULATION", () => {
  afterEach(() => vi.unstubAllEnvs());
  const noConnection = async () => {
    const { getActiveVercelConnection } = await import("@server/services/integrations.service");
    vi.mocked(getActiveVercelConnection).mockResolvedValueOnce(null as never);
    pageFindManyMock.mockResolvedValue([{ id: "1", name: "Home", blocks: [{}], settings: null, slug: "home", isHomePage: true }]);
  };

  it("does not fail the publish under the flag with no connection — it says it will simulate", async () => {
    vi.stubEnv("PUBLISH_ALLOW_SIMULATION", "true");
    await noConnection();
    const { checks, ready } = await runPrePublishChecks("s1");
    expect(status(checks, "Vercel connected")).toBe("warning");
    expect(detail(checks, "Vercel connected")).toMatch(/simulat/i);
    expect(ready).toBe(true);
  });

  it("still fails without the flag, whatever NODE_ENV says", async () => {
    vi.stubEnv("PUBLISH_ALLOW_SIMULATION", "");
    vi.stubEnv("NODE_ENV", "development");
    await noConnection();
    const { checks, ready } = await runPrePublishChecks("s1");
    expect(status(checks, "Vercel connected")).toBe("fail");
    expect(ready).toBe(false);
  });
});

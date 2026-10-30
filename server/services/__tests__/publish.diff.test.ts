/**
 * getPublishDiff — what changed between two published versions, page by page.
 * The HTML never leaves the service; only paths, change kinds and sizes do.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const findManyMock = vi.fn();
const siteMock = vi.fn();
const cmsCountMock = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    publishBuildJob: { findMany: (...a: unknown[]) => findManyMock(...a) },
    site: { findUnique: (...a: unknown[]) => siteMock(...a) },
    cmsEntry: { count: (...a: unknown[]) => cmsCountMock(...a) },
  },
}));
vi.mock("@server/services/integrations.service", () => ({ getActiveVercelConnection: vi.fn() }));
vi.mock("@/lib/vercel", () => ({ createVercelDeployment: vi.fn(), deleteVercelDeployment: vi.fn(), pollDeploymentReady: vi.fn() }));

import { getPublishDiff, getPublishPreviewDiff } from "@server/services/publish.service";

const job = (id: string, pages: Array<{ path: string; html: string }> | null) => ({ id, log: pages ? { pages } : null });

beforeEach(() => findManyMock.mockReset());

describe("getPublishDiff", () => {
  it("classifies every page as added, removed, changed or same, with sizes", async () => {
    findManyMock.mockResolvedValue([
      job("j1", [{ path: "index.html", html: "<h1>a</h1>" }, { path: "about.html", html: "<p>x</p>" }, { path: "old.html", html: "gone" }]),
      job("j2", [{ path: "index.html", html: "<h1>a</h1>" }, { path: "about.html", html: "<p>xy</p>" }, { path: "new.html", html: "fresh" }]),
    ]);
    const d = await getPublishDiff("s1", "j1", "j2");
    expect(d.retained).toBe(true);
    expect(d.pages.map((p) => [p.path, p.change])).toEqual([
      ["about.html", "changed"], ["index.html", "same"], ["new.html", "added"], ["old.html", "removed"],
    ]);
    expect(d.pages.find((p) => p.path === "about.html")).toMatchObject({ fromBytes: 8, toBytes: 9 });
    expect(d.pages.find((p) => p.path === "old.html")).toMatchObject({ fromBytes: 4, toBytes: null });
    expect({ added: d.added, removed: d.removed, changed: d.changed }).toEqual({ added: 1, removed: 1, changed: 1 });
  });

  it("never returns html", async () => {
    findManyMock.mockResolvedValue([job("j1", [{ path: "i", html: "SECRET" }]), job("j2", [{ path: "i", html: "SECRET2" }])]);
    const d = await getPublishDiff("s1", "j1", "j2");
    expect(JSON.stringify(d)).not.toContain("SECRET");
  });

  it("says not retained when either payload was pruned, rather than an empty diff", async () => {
    findManyMock.mockResolvedValue([job("j1", null), job("j2", [{ path: "i", html: "x" }])]);
    const d = await getPublishDiff("s1", "j1", "j2");
    expect(d).toEqual({ retained: false, pages: [], added: 0, removed: 0, changed: 0 });
  });

  it("refuses when either job is not a completed publish of this site", async () => {
    findManyMock.mockResolvedValue([job("j2", [])]);
    await expect(getPublishDiff("s1", "j1", "j2")).rejects.toThrow(/PUBLISH_DIFF_NOT_FOUND/);
    expect(findManyMock).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ siteId: "s1", status: "COMPLETED" }) }));
  });
});

/* A-33 (2L9 B8-PB01–PB03): what a publish NOW would change, against the live
   job's retained payload. */
describe("getPublishPreviewDiff", () => {
  const live = new Date("2026-10-20T10:00:00.000Z");
  beforeEach(() => {
    siteMock.mockReset().mockResolvedValue({ publishedUrl: "https://fieldwork.studio", lastPublishedAt: live });
    cmsCountMock.mockReset().mockResolvedValue(4);
  });

  it("compares the draft export with the LIVE (newest completed) job, page by page", async () => {
    findManyMock.mockResolvedValue([
      job("j13", [{ path: "index.html", html: "a" }, { path: "work.html", html: "w" }, { path: "about.html", html: "x" }]),
      job("j12", [{ path: "index.html", html: "old" }]),
    ]);
    const d = await getPublishPreviewDiff("s1", [
      { path: "index.html", html: "a2" },
      { path: "work.html", html: "w" },
      { path: "services.html", html: "s" },
    ]);
    expect(d.liveVersion).toBe(2);
    expect({ added: d.added, removed: d.removed, changed: d.changed }).toEqual({ added: 1, removed: 1, changed: 1 });
    expect(d.pages.map((p) => [p.path, p.change])).toEqual([
      ["about.html", "removed"], ["index.html", "changed"], ["services.html", "added"], ["work.html", "same"],
    ]);
    expect(JSON.stringify(d)).not.toContain("a2");
  });

  it("counts published CMS records changed since the site last went live", async () => {
    findManyMock.mockResolvedValue([job("j1", [])]);
    const d = await getPublishPreviewDiff("s1", []);
    expect(d.cmsRecords).toBe(4);
    expect(cmsCountMock).toHaveBeenCalledWith({
      where: { collection: { siteId: "s1" }, status: "PUBLISHED", deletedAt: null, updatedAt: { gt: live } },
    });
  });

  it("a site never published: every page is added, no live version", async () => {
    siteMock.mockResolvedValue({ publishedUrl: null, lastPublishedAt: null });
    findManyMock.mockResolvedValue([]);
    const d = await getPublishPreviewDiff("s1", [{ path: "index.html", html: "x" }]);
    expect(d).toMatchObject({ liveVersion: null, added: 1, changed: 0, removed: 0, retained: true });
  });

  it("a live payload pruned past the retained window is 'not retained', not an empty diff", async () => {
    findManyMock.mockResolvedValue([job("j1", null)]);
    const d = await getPublishPreviewDiff("s1", [{ path: "index.html", html: "x" }]);
    expect(d).toMatchObject({ retained: false, pages: [] });
  });
});

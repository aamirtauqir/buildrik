/**
 * getPublishedSnapshot — the pages one COMPLETED publish shipped, for the
 * editor's Compare (post-Oct-1 R3). Scoped to the site and to completed jobs;
 * null when the payload was pruned.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const findFirstMock = vi.fn();
vi.mock("@/lib/prisma", () => ({ prisma: { publishBuildJob: { findFirst: (...a: unknown[]) => findFirstMock(...a) } } }));
vi.mock("@server/services/integrations.service", () => ({ getActiveVercelConnection: vi.fn() }));
vi.mock("@/lib/vercel", () => ({ createVercelDeployment: vi.fn(), deleteVercelDeployment: vi.fn(), pollDeploymentReady: vi.fn() }));

import { getPublishedSnapshot } from "@server/services/publish.service";

beforeEach(() => findFirstMock.mockReset());

describe("getPublishedSnapshot", () => {
  it("reads only a COMPLETED job of this site", async () => {
    findFirstMock.mockResolvedValue({ log: { pages: [] } });
    await getPublishedSnapshot("s1", "j1");
    expect(findFirstMock.mock.calls[0][0].where).toEqual({ id: "j1", siteId: "s1", status: "COMPLETED" });
  });

  it("returns the shipped pages as { path, html }", async () => {
    findFirstMock.mockResolvedValue({
      log: { pages: [{ path: "index.html", html: "<h1>a</h1>" }, { path: "about/index.html", html: "<p>b</p>" }] },
    });
    expect(await getPublishedSnapshot("s1", "j1")).toEqual([
      { path: "index.html", html: "<h1>a</h1>" },
      { path: "about/index.html", html: "<p>b</p>" },
    ]);
  });

  it("drops malformed payload rows rather than handing back half a page", async () => {
    findFirstMock.mockResolvedValue({ log: { pages: [{ path: "index.html" }, { html: "x" }, { path: "a.html", html: "ok" }] } });
    expect(await getPublishedSnapshot("s1", "j1")).toEqual([{ path: "a.html", html: "ok" }]);
  });

  it("is null when the payload was pruned — a state, not an error", async () => {
    findFirstMock.mockResolvedValue({ log: null });
    expect(await getPublishedSnapshot("s1", "j1")).toBeNull();
  });

  it("throws NOT_FOUND for a job that is not a completed publish of this site", async () => {
    findFirstMock.mockResolvedValue(null);
    await expect(getPublishedSnapshot("s1", "other-site-job")).rejects.toThrow("NOT_FOUND");
  });
});

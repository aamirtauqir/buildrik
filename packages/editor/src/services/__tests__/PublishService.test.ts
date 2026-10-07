/**
 * PublishService tests — editor → dashboard publish bridge.
 * Verifies payload shapes for sites.publish/publishStatus/cancelPublish,
 * the COMPLETED → sites.get publishedUrl resolution hop, and the
 * Topbar "Published" hydration mapping (fetchSitePublishState).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const publishMutate = vi.fn();
const publishStatusQuery = vi.fn();
const cancelMutate = vi.fn();
const sitesGetQuery = vi.fn();

vi.mock("../api-client", () => ({
  createBuildrikApiClient: () => ({
    sites: {
      publish: { mutate: (...a: unknown[]) => publishMutate(...a) },
      publishStatus: { query: (...a: unknown[]) => publishStatusQuery(...a) },
      cancelPublish: { mutate: (...a: unknown[]) => cancelMutate(...a) },
      get: { query: (...a: unknown[]) => sitesGetQuery(...a) },
    },
  }),
}));

const settledBaseline = vi.fn(() => Promise.resolve<string | null>("2026-09-20T10:00:00.000Z"));
const raiseSaveConflict = vi.fn((err: unknown) =>
  /SAVE_CONFLICT:/.test(String(err)) ? new Error("SAVE_CONFLICT") : null,
);
const siteColumnsLoaded = vi.fn((_siteId: string) => true);
const hasProjectLoaded = vi.fn((_siteId: string) => true);
vi.mock("../BuildrikSyncProvider", () => ({
  siteColumnsLoaded: (siteId: string) => siteColumnsLoaded(siteId),
  hasProjectLoaded: (siteId: string) => hasProjectLoaded(siteId),
  settledBaselineLastEditedAt: () => settledBaseline(),
  raiseSaveConflict: (e: unknown) => raiseSaveConflict(e),
}));

import {
  publishSite,
  fetchPublishStatus,
  cancelPublish,
  fetchSitePublishState,
} from "../PublishService";

beforeEach(() => {
  [publishMutate, publishStatusQuery, cancelMutate, sitesGetQuery].forEach((m) => m.mockReset());
});

describe("publishSite", () => {
  it("posts siteId + pre-rendered pages and returns the created job id", async () => {
    publishMutate.mockResolvedValueOnce({ id: "job-1", status: "QUEUED" });

    const pages = [
      { path: "index.html", html: "<html>home</html>" },
      { path: "about.html", html: "<html>about</html>" },
    ];
    const result = await publishSite("site-1", pages);

    expect(publishMutate).toHaveBeenCalledWith({
      siteId: "site-1",
      pages,
      expectedLastEditedAt: "2026-09-20T10:00:00.000Z",
    });
    expect(result).toEqual({ jobId: "job-1" });
  });

  /* C-3: the token is read only after in-flight saves settle — otherwise the
     tab's own save, landed on the server but not yet answered, would read as
     someone else's newer copy. */
  it("waits for the in-flight save before reading the freshness token", async () => {
    let release!: (v: string) => void;
    settledBaseline.mockImplementationOnce(() => new Promise((r) => (release = r)));
    publishMutate.mockResolvedValueOnce({ id: "job-2" });

    const pending = publishSite("site-1", []);
    await Promise.resolve();
    expect(publishMutate).not.toHaveBeenCalled();
    release("2026-09-20T10:05:00.000Z");
    await pending;
    expect(publishMutate).toHaveBeenCalledWith(
      expect.objectContaining({ expectedLastEditedAt: "2026-09-20T10:05:00.000Z" }),
    );
  });

  it("a stale-tab refusal raises the save conflict instead of a bare publish error", async () => {
    publishMutate.mockRejectedValueOnce(new Error("SAVE_CONFLICT:2026-09-20T10:05:00.000Z"));
    await expect(publishSite("site-1", [])).rejects.toThrow(/changed somewhere else/);
    expect(raiseSaveConflict).toHaveBeenCalled();
  });

  /* SA-01: the columns are the only source of the site's <head> settings; a
     session whose settings read failed renders pages without them. */
  it("refuses, before any request, while the site's settings have not loaded", async () => {
    siteColumnsLoaded.mockReturnValueOnce(false);
    await expect(publishSite("site-1", [{ path: "index.html", html: "<html></html>" }])).rejects.toThrow(
      "Site settings didn't load. Reload the editor before publishing.",
    );
    expect(siteColumnsLoaded).toHaveBeenCalledWith("site-1");
    expect(publishMutate).not.toHaveBeenCalled();
  });

  /* P1-2: a tab whose project never loaded shows the fallback; publishing it
     would replace the live site with that. Same invariant the save boundary
     enforces. */
  it("refuses, before any request, while the project has not loaded from the server", async () => {
    hasProjectLoaded.mockReturnValueOnce(false);
    await expect(publishSite("site-1", [{ path: "index.html", html: "<html></html>" }])).rejects.toThrow(
      "This site didn't load. Reload the editor before publishing.",
    );
    expect(hasProjectLoaded).toHaveBeenCalledWith("site-1");
    expect(publishMutate).not.toHaveBeenCalled();
  });

  /* P2-3: the router's sentence does not name the code the editor's
     "Vercel not connected" toast keys on; the code arrives as data.cause.reason. */
  it("names VERCEL_NOT_CONNECTED when the server refuses for a missing Vercel connection", async () => {
    publishMutate.mockRejectedValueOnce(
      Object.assign(new Error("Connect this workspace to Vercel before publishing."), {
        data: { code: "PRECONDITION_FAILED", cause: { reason: "VERCEL_NOT_CONNECTED" } },
      }),
    );
    await expect(publishSite("site-1", [])).rejects.toThrow(
      "VERCEL_NOT_CONNECTED: Connect this workspace to Vercel before publishing.",
    );
  });

  it("propagates a tRPC failure (pre-publish checks / no Vercel connection)", async () => {
    publishMutate.mockRejectedValueOnce(new Error("Connect Vercel before publishing"));
    await expect(publishSite("site-1", [])).rejects.toThrow(/Connect Vercel/);
  });
});

describe("fetchPublishStatus", () => {
  const job = (status: string) => ({
    id: "job-1",
    status,
    progress: 40,
    deploymentId: "dep-1",
    error: null,
    siteId: "site-1",
  });

  it("maps an in-flight job WITHOUT resolving publishedUrl (no sites.get hop)", async () => {
    publishStatusQuery.mockResolvedValueOnce(job("BUILDING"));

    const status = await fetchPublishStatus("job-1");

    expect(publishStatusQuery).toHaveBeenCalledWith({ jobId: "job-1" });
    expect(sitesGetQuery).not.toHaveBeenCalled();
    expect(status).toEqual({
      jobId: "job-1",
      status: "BUILDING",
      progress: 40,
      publishedUrl: null,
      error: null,
      deploymentId: "dep-1",
    });
  });

  it("resolves publishedUrl from sites.get once the job is COMPLETED", async () => {
    publishStatusQuery.mockResolvedValueOnce({ ...job("COMPLETED"), progress: 100 });
    sitesGetQuery.mockResolvedValueOnce({ publishedUrl: "https://my-site.vercel.app" });

    const status = await fetchPublishStatus("job-1");

    expect(sitesGetQuery).toHaveBeenCalledWith({ id: "site-1" });
    expect(status.publishedUrl).toBe("https://my-site.vercel.app");
    expect(status.status).toBe("COMPLETED");
    expect(status.progress).toBe(100);
  });

  it("returns publishedUrl null when the completed site row carries none", async () => {
    publishStatusQuery.mockResolvedValueOnce(job("COMPLETED"));
    sitesGetQuery.mockResolvedValueOnce({});

    const status = await fetchPublishStatus("job-1");
    expect(status.publishedUrl).toBeNull();
  });

  it("does not hit sites.get for a FAILED job and surfaces the job error", async () => {
    publishStatusQuery.mockResolvedValueOnce({ ...job("FAILED"), error: "deploy exploded" });

    const status = await fetchPublishStatus("job-1");

    expect(sitesGetQuery).not.toHaveBeenCalled();
    expect(status.status).toBe("FAILED");
    expect(status.error).toBe("deploy exploded");
    expect(status.publishedUrl).toBeNull();
  });
});

describe("cancelPublish", () => {
  it("mutates sites.cancelPublish with the jobId", async () => {
    cancelMutate.mockResolvedValueOnce(undefined);
    await cancelPublish("job-9");
    expect(cancelMutate).toHaveBeenCalledWith({ jobId: "job-9" });
  });
});

describe("fetchSitePublishState", () => {
  it("reports published only when status is PUBLISHED AND a url exists", async () => {
    sitesGetQuery.mockResolvedValueOnce({ status: "PUBLISHED", publishedUrl: "https://x.vercel.app" });

    const state = await fetchSitePublishState("site-1");

    expect(sitesGetQuery).toHaveBeenCalledWith({ id: "site-1" });
    expect(state).toEqual({
      isPublished: true,
      publishedUrl: "https://x.vercel.app",
      hasUnpublishedChanges: null,
      lastPublishedAt: null,
      lastEditedAt: null,
    });
  });

  it("is NOT published when status is PUBLISHED but the url is missing", async () => {
    sitesGetQuery.mockResolvedValueOnce({ status: "PUBLISHED", publishedUrl: null });
    const state = await fetchSitePublishState("site-1");
    expect(state).toEqual({
      isPublished: false,
      publishedUrl: null,
      hasUnpublishedChanges: null,
      lastPublishedAt: null,
      lastEditedAt: null,
    });
  });

  it("is NOT published for a DRAFT site even if a stale url remains", async () => {
    sitesGetQuery.mockResolvedValueOnce({ status: "DRAFT", publishedUrl: "https://old.vercel.app" });
    const state = await fetchSitePublishState("site-1");
    // Current behavior: the stale url is still returned; only the flag gates the UI.
    expect(state).toEqual({
      isPublished: false,
      publishedUrl: "https://old.vercel.app",
      hasUnpublishedChanges: null,
      lastPublishedAt: null,
      lastEditedAt: null,
    });
  });

  /* The durable "edited since publish" signal. The editor's other one counts
     composer.history entries after the last deploy, and that stack is
     memory-only — publish, edit, reopen the tab, and it reads 0 over a site
     with real unpublished changes. These stamps survive the reload. */
  it("edited after the last deploy → unpublished changes", async () => {
    sitesGetQuery.mockResolvedValueOnce({
      status: "PUBLISHED",
      publishedUrl: "https://x.vercel.app",
      lastPublishedAt: "2026-08-20T10:00:00.000Z",
      lastEditedAt: "2026-08-21T09:00:00.000Z",
    });
    const state = await fetchSitePublishState("site-1");
    expect(state.hasUnpublishedChanges).toBe(true);
    expect(state.lastPublishedAt).toBe("2026-08-20T10:00:00.000Z");
  });

  it("last edit predates the deploy → nothing to publish", async () => {
    sitesGetQuery.mockResolvedValueOnce({
      status: "PUBLISHED",
      publishedUrl: "https://x.vercel.app",
      lastPublishedAt: "2026-08-21T10:00:00.000Z",
      lastEditedAt: "2026-08-20T09:00:00.000Z",
    });
    expect((await fetchSitePublishState("site-1")).hasUnpublishedChanges).toBe(false);
  });

  /* Never published, or the server sent no stamps: UNKNOWN, not "no". A caller
     that reads null as false tells someone their site is up to date on a site
     that has never been live. */
  it("never published → unknown, not false", async () => {
    sitesGetQuery.mockResolvedValueOnce({
      status: "DRAFT",
      publishedUrl: null,
      lastPublishedAt: null,
      lastEditedAt: "2026-08-21T09:00:00.000Z",
    });
    expect((await fetchSitePublishState("site-1")).hasUnpublishedChanges).toBeNull();
  });
});

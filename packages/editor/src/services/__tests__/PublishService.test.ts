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

    expect(publishMutate).toHaveBeenCalledWith({ siteId: "site-1", pages });
    expect(result).toEqual({ jobId: "job-1" });
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

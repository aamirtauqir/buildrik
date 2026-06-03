import { describe, it, expect, vi } from "vitest";
import { loadProject, initBuildrikSync } from "../BuildrikSyncProvider";

const mocks = vi.hoisted(() => ({
  sitesGetQuery: vi.fn(),
  sitesSaveProjectMutate: vi.fn(),
  pagesListQuery: vi.fn(),
  siteDetailSettingsGetQuery: vi.fn().mockResolvedValue(null),
  siteDetailSettingsUpdateMutate: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("../api-client", () => ({
  createBuildrikApiClient: vi.fn(() => ({
    sites: {
      get: {
        query: mocks.sitesGetQuery,
      },
      saveProject: {
        mutate: mocks.sitesSaveProjectMutate,
      },
    },
    pages: {
      list: {
        query: mocks.pagesListQuery,
      },
    },
    siteDetail: {
      settings: {
        get: { query: mocks.siteDetailSettingsGetQuery },
        update: { mutate: mocks.siteDetailSettingsUpdateMutate },
      },
    },
  })),
}));

describe("loadProject error handling", () => {
  it("throws domain error on tRPC failure", async () => {
    mocks.sitesGetQuery.mockRejectedValue(new Error("network"));
    await expect(loadProject("s1")).rejects.toThrow(
      "BuildrikSyncProvider.loadProject failed for site s1"
    );
  });
});

// A page whose root has children — `projectHasContent` returns true for this.
const PROJECT_WITH_CONTENT = {
  version: "1.0",
  pagesOrder: ["p1"],
  pages: [{ id: "p1", name: "Home", slug: "/", isHome: true, root: { id: "root", type: "container", children: [{ id: "h1", type: "heading" }] } }],
  styles: [],
  assets: [],
  metadata: {},
} as any;

const EMPTY_PROJECT = {
  version: "1.0",
  pagesOrder: [],
  pages: [],
  styles: [],
  assets: [],
  metadata: {},
} as any;

function makeComposer(exportValue: unknown) {
  const handlers: Record<string, (() => void)[]> = {};
  return {
    importProject: vi.fn(),
    exportProject: vi.fn(() => exportValue),
    on: vi.fn((event: string, cb: () => void) => {
      (handlers[event] ??= []).push(cb);
    }),
    emit: vi.fn((event: string) => handlers[event]?.forEach((cb) => cb())),
    handlers,
  };
}

describe("initBuildrikSync", () => {
  it("queues pending changes while a save is in flight", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mocks.sitesGetQuery.mockResolvedValue({ name: "Test Site" });
    mocks.pagesListQuery.mockResolvedValue([]);
    let saveCount = 0;
    mocks.sitesSaveProjectMutate.mockImplementation(() => {
      saveCount++;
      return new Promise((resolve) => setTimeout(() => resolve({ success: true, savedAt: new Date() }), 20));
    });

    // Export real content so the data-loss guard allows the save — this test
    // exercises the in-flight queue mechanism, not empty-save semantics.
    const composer = makeComposer(PROJECT_WITH_CONTENT);

    await initBuildrikSync(composer as any, "s1");
    const handler = composer.handlers["project:changed"]![0];

    handler(); // schedules first timeout
    vi.advanceTimersByTime(5000); // first save starts
    handler(); // queued while in flight
    await vi.advanceTimersByTimeAsync(20); // first save completes, triggers re-save via emit
    vi.advanceTimersByTime(5000); // second save starts
    expect(saveCount).toBe(2);

    vi.useRealTimers();
  });

  it("refuses to auto-save an empty project when the load brought no content (data-loss guard)", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Load returns no pages → no content observed at mount.
    mocks.sitesGetQuery.mockResolvedValue({ name: "Test Site" });
    mocks.pagesListQuery.mockResolvedValue([]);
    mocks.sitesSaveProjectMutate.mockClear();
    mocks.sitesSaveProjectMutate.mockResolvedValue({ success: true, savedAt: new Date() });

    // The editor exports an empty tree (the raced/failed-load scenario).
    const composer = makeComposer(EMPTY_PROJECT);
    await initBuildrikSync(composer as any, "s1");
    composer.handlers["project:changed"]![0]();
    await vi.advanceTimersByTimeAsync(6000);

    expect(mocks.sitesSaveProjectMutate).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("saves an empty project once content has been observed (genuine delete-all)", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mocks.sitesGetQuery.mockResolvedValue({ name: "Test Site" });
    // Load brings content → observedContent starts true.
    mocks.pagesListQuery.mockResolvedValue([
      { id: "p1", name: "Home", slug: "/", isHomePage: true, position: 0, blocks: { id: "root", type: "container", children: [{ id: "h1", type: "heading" }] } },
    ]);
    mocks.sitesSaveProjectMutate.mockClear();
    mocks.sitesSaveProjectMutate.mockResolvedValue({ success: true, savedAt: new Date() });

    // User deletes everything → export is now empty, but content WAS observed.
    const composer = makeComposer(EMPTY_PROJECT);
    await initBuildrikSync(composer as any, "s1");
    composer.handlers["project:changed"]![0]();
    await vi.advanceTimersByTimeAsync(6000);

    expect(mocks.sitesSaveProjectMutate).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});

import { describe, it, expect, vi } from "vitest";
import { loadProject, initBuildrikSync } from "../BuildrikSyncProvider";

const mocks = vi.hoisted(() => ({
  sitesGetQuery: vi.fn(),
  sitesSaveProjectMutate: vi.fn(),
  pagesListQuery: vi.fn(),
  siteDetailSettingsGetQuery: vi.fn().mockResolvedValue(null),
  siteDetailSettingsUpdateMutate: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@buildrik/shared", () => ({
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

    const handlers: Record<string, (() => void)[]> = {};
    const composer = {
      importProject: vi.fn(),
      exportProject: vi.fn(() => ({ version: "1.0", pagesOrder: [], pages: [], styles: [], assets: [], metadata: {} } as any)),
      on: vi.fn((event: string, cb: () => void) => {
        if (!handlers[event]) handlers[event] = [];
        handlers[event].push(cb);
      }),
      emit: vi.fn((event: string) => {
        handlers[event]?.forEach((cb) => cb());
      }),
    };

    await initBuildrikSync(composer as any, "s1");
    const handler = handlers["project:changed"]![0];

    handler(); // schedules first timeout
    vi.advanceTimersByTime(5000); // first save starts
    handler(); // queued while in flight
    await vi.advanceTimersByTimeAsync(20); // first save completes, triggers re-save via emit
    vi.advanceTimersByTime(5000); // second save starts
    expect(saveCount).toBe(2);

    vi.useRealTimers();
  });
});

/**
 * useDynamicPagesSummary — FC-1 (fix-all 2026-09-25).
 *
 * Sums cms.dynamicPages across every collection with a pageSlugPattern set,
 * tolerates one collection's query failing without blanking the others, and
 * recomputes when the composer says the CMS store changed.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const dynamicPagesQuery = vi.fn();

vi.mock("@/services/api-client", () => ({
  getBuildrikClient: () => ({
    cms: { dynamicPages: { query: (...a: unknown[]) => dynamicPagesQuery(...a) } },
  }),
}));
vi.mock("@/shared/utils/runtimeEnv", () => ({ DASHBOARD_URL: "http://localhost:3000" }));
vi.mock("@/services/BuildrikSyncProvider", () => ({
  getSiteIdFromUrl: () => "site-1",
}));

import { useDynamicPagesSummary } from "../useDynamicPagesSummary";
import { EVENTS } from "@/shared/constants/events";

interface FakeCollection {
  id: string;
  pageSlugPattern?: string;
}

function fakeComposer(collections: FakeCollection[]) {
  const listeners = new Map<string, Set<(...a: unknown[]) => void>>();
  return {
    cms: {
      collections: {
        getAllCollections: () => collections,
      },
    },
    on: (event: string, fn: (...a: unknown[]) => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(fn);
    },
    off: (event: string, fn: (...a: unknown[]) => void) => {
      listeners.get(event)?.delete(fn);
    },
    emit: (event: string, ...args: unknown[]) => {
      listeners.get(event)?.forEach((fn) => fn(...args));
    },
  };
}

beforeEach(() => {
  dynamicPagesQuery.mockReset();
});

describe("useDynamicPagesSummary", () => {
  it("is empty with no composer", () => {
    const { result } = renderHook(() => useDynamicPagesSummary(null));
    expect(result.current).toEqual({ count: 0, collectionId: null });
  });

  it("is empty when no collection has a pageSlugPattern", async () => {
    const composer = fakeComposer([{ id: "c1" }, { id: "c2" }]);
    const { result } = renderHook(() => useDynamicPagesSummary(composer as never));
    await waitFor(() => expect(result.current).toEqual({ count: 0, collectionId: null }));
    expect(dynamicPagesQuery).not.toHaveBeenCalled();
  });

  it("sums published pages across every page-generating collection", async () => {
    const composer = fakeComposer([
      { id: "blog", pageSlugPattern: "/blog/{slug}" },
      { id: "docs", pageSlugPattern: "/docs/{slug}" },
      { id: "no-pages" },
    ]);
    dynamicPagesQuery.mockImplementation(({ collectionId }: { collectionId: string }) =>
      Promise.resolve(collectionId === "blog" ? [{ entryId: "1" }, { entryId: "2" }] : [{ entryId: "3" }]),
    );
    const { result } = renderHook(() => useDynamicPagesSummary(composer as never));
    await waitFor(() => expect(result.current.count).toBe(3));
    expect(dynamicPagesQuery).toHaveBeenCalledTimes(2);
    expect(dynamicPagesQuery).toHaveBeenCalledWith({ siteId: "site-1", collectionId: "blog" });
    expect(dynamicPagesQuery).toHaveBeenCalledWith({ siteId: "site-1", collectionId: "docs" });
    // collectionId is the first collection that produced output (the row's "›").
    expect(result.current.collectionId).toBe("blog");
  });

  it("tolerates one collection's query failing — the others still count", async () => {
    const composer = fakeComposer([
      { id: "blog", pageSlugPattern: "/blog/{slug}" },
      { id: "broken", pageSlugPattern: "/broken/{slug}" },
    ]);
    dynamicPagesQuery.mockImplementation(({ collectionId }: { collectionId: string }) =>
      collectionId === "broken"
        ? Promise.reject(new Error("boom"))
        : Promise.resolve([{ entryId: "1" }]),
    );
    const { result } = renderHook(() => useDynamicPagesSummary(composer as never));
    await waitFor(() => expect(result.current.count).toBe(1));
    expect(result.current.collectionId).toBe("blog");
  });

  it("re-fetches when the composer reports the CMS store refreshed", async () => {
    const composer = fakeComposer([{ id: "blog", pageSlugPattern: "/blog/{slug}" }]);
    dynamicPagesQuery.mockResolvedValue([{ entryId: "1" }]);
    const { result } = renderHook(() => useDynamicPagesSummary(composer as never));
    await waitFor(() => expect(result.current.count).toBe(1));
    expect(dynamicPagesQuery).toHaveBeenCalledTimes(1);

    dynamicPagesQuery.mockResolvedValue([{ entryId: "1" }, { entryId: "2" }, { entryId: "3" }]);
    composer.emit(EVENTS.CMS_STORE_REFRESHED, []);
    await waitFor(() => expect(result.current.count).toBe(3));
    expect(dynamicPagesQuery).toHaveBeenCalledTimes(2);
  });
});

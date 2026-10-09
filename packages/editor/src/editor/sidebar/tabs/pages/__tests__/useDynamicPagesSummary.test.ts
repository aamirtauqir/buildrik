/**
 * useDynamicPagesSummary — FC-1 (fix-all 2026-09-25).
 *
 * Sums cms.dynamicPages across every collection with a pageSlugPattern set,
 * tolerates one collection's query failing without blanking the others, and
 * recomputes when the CMS store (the CollectionManager's own emitter) changes.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

const dynamicPagesQuery = vi.fn();

vi.mock("@/services/api-client", () => ({
  getBuildrikClient: () => ({
    cms: { dynamicPages: { query: (...a: unknown[]) => dynamicPagesQuery(...a) } },
  }),
}));
vi.mock("@/shared/utils/runtimeEnv", () => ({ DASHBOARD_URL: "http://localhost:3000", IS_DEV_BUILD: false }));
vi.mock("@/services/BuildrikSyncProvider", () => ({
  getSiteIdFromUrl: () => "site-1",
}));

const storedCollections = vi.fn();
vi.mock("@/engine/cms/CollectionStorage", () => ({
  loadCollections: () => storedCollections(),
}));

import { useDynamicPagesSummary } from "../useDynamicPagesSummary";
import { EVENTS } from "@/shared/constants/events";
import { EventEmitter } from "@/engine/EventEmitter";
import { CollectionManager } from "@/engine/cms/CollectionManager";

interface FakeCollection {
  id: string;
  pageSlugPattern?: string;
}

/* X-6 (live verify 2026-09-26): the CMS events are emitted by the
   CollectionManager ITSELF, not by the composer — the composer is a different
   emitter. The earlier fake re-emitted them on the composer, so the tests
   passed while the live row never appeared: the Pages tab computed once,
   before the store loaded, and never heard the refresh. The fake now has the
   real topology: a real CollectionManager (storage mocked) under a composer
   whose own emitter never carries CMS events. */
function fakeComposer(collections: FakeCollection[]) {
  storedCollections.mockResolvedValue(collections.map((c) => ({ name: c.id, ...c })));
  const manager = new CollectionManager();
  const composer = Object.assign(new EventEmitter(), { cms: { collections: manager } });
  return { composer, manager };
}

async function loaded(collections: FakeCollection[]) {
  const f = fakeComposer(collections);
  await f.manager.refreshFromStorage();
  return f;
}

beforeEach(() => {
  dynamicPagesQuery.mockReset();
  storedCollections.mockReset();
});

describe("useDynamicPagesSummary", () => {
  it("is empty with no composer", () => {
    const { result } = renderHook(() => useDynamicPagesSummary(null));
    expect(result.current).toEqual({ count: 0, collectionId: null, byCollection: {} });
  });

  it("is empty when no collection has a pageSlugPattern", async () => {
    const { composer } = await loaded([{ id: "c1" }, { id: "c2" }]);
    const { result } = renderHook(() => useDynamicPagesSummary(composer as never));
    await waitFor(() => expect(result.current).toEqual({ count: 0, collectionId: null, byCollection: {} }));
    expect(dynamicPagesQuery).not.toHaveBeenCalled();
  });

  it("sums published pages across every page-generating collection", async () => {
    const { composer } = await loaded([
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
    // EDT-057: each collection's own count, for the template page's delete confirm.
    expect(result.current.byCollection).toEqual({ blog: 2, docs: 1 });
  });

  it("tolerates one collection's query failing — the others still count", async () => {
    const { composer } = await loaded([
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

  it("X-6: counts a collection that only arrives when the store loads after mount", async () => {
    // Live shape: the Pages tab is open at load, so the hook mounts while the
    // store is still empty; the server hydrate lands later and the manager
    // announces it with CMS_STORE_REFRESHED on ITSELF.
    const { composer, manager } = fakeComposer([]);
    dynamicPagesQuery.mockResolvedValue([{ entryId: "e1", slug: "/blog/" }]);
    const { result } = renderHook(() => useDynamicPagesSummary(composer as never));
    await waitFor(() => expect(result.current.count).toBe(0));

    storedCollections.mockResolvedValue([{ id: "posts", name: "Posts", pageSlugPattern: "/blog/{slug}" }]);
    await act(() => manager.refreshFromStorage());
    await waitFor(() => expect(result.current).toEqual({ count: 1, collectionId: "posts", byCollection: { posts: 1 } }));
  });

  it("re-fetches when an entry is published or unpublished", async () => {
    const { composer, manager } = await loaded([{ id: "blog", pageSlugPattern: "/blog/{slug}" }]);
    dynamicPagesQuery.mockResolvedValue([{ entryId: "1" }]);
    const { result } = renderHook(() => useDynamicPagesSummary(composer as never));
    await waitFor(() => expect(result.current.count).toBe(1));

    dynamicPagesQuery.mockResolvedValue([{ entryId: "1" }, { entryId: "2" }]);
    act(() => manager.emit(EVENTS.CMS_CONTENT_PUBLISHED, {}));
    await waitFor(() => expect(result.current.count).toBe(2));

    dynamicPagesQuery.mockResolvedValue([]);
    act(() => manager.emit(EVENTS.CMS_CONTENT_UNPUBLISHED, {}));
    await waitFor(() => expect(result.current.count).toBe(0));
  });

  it("stops listening on unmount", async () => {
    const { composer, manager } = await loaded([{ id: "blog", pageSlugPattern: "/blog/{slug}" }]);
    dynamicPagesQuery.mockResolvedValue([{ entryId: "1" }]);
    const { result, unmount } = renderHook(() => useDynamicPagesSummary(composer as never));
    await waitFor(() => expect(result.current.count).toBe(1));
    unmount();
    dynamicPagesQuery.mockClear();
    manager.emit(EVENTS.CMS_STORE_REFRESHED, []);
    expect(dynamicPagesQuery).not.toHaveBeenCalled();
  });
});

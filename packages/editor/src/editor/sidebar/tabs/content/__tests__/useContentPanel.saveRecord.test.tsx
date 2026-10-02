/**
 * One record save is one server write (C0.3 live run, 2026-10-02).
 *
 * `updateContentItem` emits CMS_CONTENT_UPDATED while it runs, and the
 * event-driven mirror (`useCmsSync`) POSTs unless the sheet's direct sync has
 * already marked the id. The mark used to be set after the engine write, so
 * the event never saw it: every save POSTed twice, a conflict raised two
 * toasts, and the leftover mark swallowed the next mirror for that record.
 *
 * @license BSD-3-Clause
 */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EVENTS } from "@/shared/constants";
import type { CMSContentItem } from "@/shared/types/cms";

const directPosts: string[] = [];
vi.mock("@/services/cmsSync", async (orig) => ({
  ...(await orig<typeof import("@/services/cmsSync")>()),
  syncEntryUpsert: vi.fn(async (item: CMSContentItem) => {
    directPosts.push(item.id);
    return true;
  }),
}));

import { consumeDirectSync } from "@/services/cmsSync";
import { CMSValidationError } from "@/engine/cms/CollectionManager";
import { useContentPanel } from "../useContentPanel";
import type { Composer } from "@/engine";

/** The engine's listeners plus a stand-in for useCmsSync's entry handler:
 *  skip when the id is marked, otherwise it is a second POST. */
function stubComposer(opts: { failUpdate?: boolean } = {}) {
  const listeners = new Map<string, Set<(x: unknown) => void>>();
  const eventPosts: string[] = [];
  const emit = (ev: string, x: unknown) => listeners.get(ev)?.forEach((cb) => cb(x));
  const on = (ev: string, cb: (x: unknown) => void) => {
    if (!listeners.has(ev)) listeners.set(ev, new Set());
    listeners.get(ev)!.add(cb);
  };
  const off = (ev: string, cb: (x: unknown) => void) => listeners.get(ev)?.delete(cb);
  on(EVENTS.CMS_CONTENT_UPDATED, (x) => {
    const it = x as CMSContentItem;
    if (consumeDirectSync("entry", it.id)) return;
    eventPosts.push(it.id);
  });
  const item = (id: string, data: Record<string, unknown>): CMSContentItem => ({
    id, collectionId: "c1", data, status: "published",
    createdAt: "2026-10-02T00:00:00.000Z", updatedAt: "2026-10-02T00:00:01.000Z",
  });
  const composer = {
    getProjectMetadata: () => ({ name: "p" }),
    getProjectSettings: () => ({ siteVariables: [] }),
    setProjectSettings: vi.fn(),
    elements: { getAllElements: () => [], getElement: () => null },
    data: {
      getSource: () => null, registerSource: vi.fn(), updateSourceData: vi.fn(),
      getAllSources: () => [], on: vi.fn(), off: vi.fn(),
    },
    cms: {
      collections: {
        on, off,
        initialize: () => Promise.resolve(),
        getAllCollections: () => [],
        getContentItems: () => Promise.resolve([]),
        updateContentItem: vi.fn(async (id: string, u: { data: Record<string, unknown> }) => {
          if (opts.failUpdate) throw new CMSValidationError({});
          const it = item(id, u.data);
          emit(EVENTS.CMS_CONTENT_UPDATED, it);
          return it;
        }),
      },
    },
  } as unknown as Composer;
  return { composer, eventPosts, emit, item };
}

describe("useContentPanel.saveRecord — one save, one server write", () => {
  it("the event-driven mirror skips the record the sheet syncs directly", async () => {
    directPosts.length = 0;
    const { composer, eventPosts } = stubComposer();
    const { result } = renderHook(() => useContentPanel(composer));
    let out: { reached: boolean } | undefined;
    await act(async () => {
      out = await result.current.saveRecord("c1", "r1", { name: "x" }, true);
    });
    expect(directPosts).toEqual(["r1"]);
    expect(eventPosts).toEqual([]);
    expect(out?.reached).toBe(true);
  });

  it("leaves no mark behind, so the next engine edit of that record still mirrors", async () => {
    directPosts.length = 0;
    const { composer, eventPosts, emit, item } = stubComposer();
    const { result } = renderHook(() => useContentPanel(composer));
    await act(async () => {
      await result.current.saveRecord("c1", "r1", { name: "x" }, true);
    });
    emit(EVENTS.CMS_CONTENT_UPDATED, item("r1", { name: "renamed key" }));
    expect(eventPosts).toEqual(["r1"]);
  });

  it("a save the engine refused leaves no mark behind either", async () => {
    directPosts.length = 0;
    const { composer, eventPosts, emit, item } = stubComposer({ failUpdate: true });
    const { result } = renderHook(() => useContentPanel(composer));
    await act(async () => {
      await expect(result.current.saveRecord("c1", "r1", { name: "" }, true)).rejects.toBeInstanceOf(CMSValidationError);
    });
    expect(directPosts).toEqual([]);
    emit(EVENTS.CMS_CONTENT_UPDATED, item("r1", { name: "later" }));
    expect(eventPosts).toEqual(["r1"]);
  });
});

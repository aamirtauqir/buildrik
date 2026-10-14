/**
 * L3-019: a collection the server refuses (CMS_INVALID — e.g. one past the
 * plan's collection cap) used to be dropped from the sync queue with no
 * subscriber, so nothing said it never reached the server. Entry refusals
 * surface in the record sheet (`takeCmsInvalid`); a collection refusal is
 * announced here, in the server's own words.
 *
 * @license BSD-3-Clause
 */
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

let invalidCb: ((i: { kind: "collection" | "entry"; id: string; message: string }) => void) | null = null;

vi.mock("@/services/cmsSync", () => ({
  bindCmsEngine: () => () => {},
  hydrateCmsFromServer: () => Promise.resolve(),
  flushCmsOutbox: () => Promise.resolve(),
  onCmsGone: () => () => {},
  onCmsSyncError: () => () => {},
  onCmsConflict: () => () => {},
  onCmsInvalid: (cb: typeof invalidCb) => {
    invalidCb = cb;
    return () => {
      invalidCb = null;
    };
  },
  retryCmsSync: vi.fn(),
  syncCollectionUpsert: vi.fn(),
  syncCollectionDelete: vi.fn(),
  syncEntryUpsert: vi.fn(),
  syncEntryDelete: vi.fn(),
  consumeDirectSync: () => false,
}));
vi.mock("@/editor/chrome-ui", () => ({ dismissToast: vi.fn() }));

import { useCmsSync } from "../useCmsSync";
import type { Composer } from "@/engine/Composer";

const composer = {
  cms: {
    collections: {
      on: vi.fn(),
      off: vi.fn(),
      refreshFromStorage: vi.fn(),
      getCollection: (id: string) => (id === "c1" ? { id: "c1", name: "Posts" } : undefined),
    },
  },
} as unknown as Composer;

describe("useCmsSync — a refused collection is announced (L3-019)", () => {
  it("names the collection and the server's reason", () => {
    const addToast = vi.fn(() => "t1");
    renderHook(() => useCmsSync(composer, addToast));
    invalidCb?.({ kind: "collection", id: "c1", message: "Your plan allows 100 collections." });
    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({
        tone: "error",
        title: "Posts wasn't saved to the server",
        description: "Your plan allows 100 collections. It stays on this device only.",
      }),
    );
  });

  it("leaves entry refusals to the record sheet", () => {
    const addToast = vi.fn(() => "t1");
    renderHook(() => useCmsSync(composer, addToast));
    invalidCb?.({ kind: "entry", id: "e1", message: "Title is required." });
    expect(addToast).not.toHaveBeenCalled();
  });
});

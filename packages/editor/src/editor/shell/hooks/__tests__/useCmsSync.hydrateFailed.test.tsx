/**
 * C-8: with collections on screen, the Content panel has no error state, so a
 * failed hydrate is told through a toast (with Try again) and retracted once
 * a later hydrate lands. With none, the panel's own load-error answers.
 *
 * @license BSD-3-Clause
 */
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

let hydrationCb: ((s: "loading" | "ready" | "error") => void) | null = null;
const retryHydration = vi.fn(() => Promise.resolve());

vi.mock("@/services/cmsSync", () => ({
  bindCmsEngine: () => () => {},
  onCmsHydrationChange: (cb: typeof hydrationCb) => {
    hydrationCb = cb;
    return () => {
      hydrationCb = null;
    };
  },
  retryCmsHydration: () => retryHydration(),
  hydrateCmsFromServer: () => Promise.resolve(),
  flushCmsOutbox: () => Promise.resolve(),
  onCmsInvalid: () => () => {},
  onCmsGone: () => () => {},
  onCmsSyncError: () => () => {},
  onCmsConflict: () => () => {},
  retryCmsSync: vi.fn(),
  consumeDirectSync: () => false,
  syncCollectionUpsert: vi.fn(),
  syncCollectionDelete: vi.fn(),
  syncEntryUpsert: vi.fn(),
  syncEntryDelete: vi.fn(),
}));

const dismissedKeys: string[] = [];
vi.mock("@/editor/chrome-ui", () => ({
  dismissToast: vi.fn(),
  dismissToastKey: (key: string) => dismissedKeys.push(key),
}));

import { useCmsSync } from "../useCmsSync";
import type { Composer } from "@/engine/Composer";
import type { ToastInput } from "@/editor/chrome-ui";

function stubComposer(collections: number) {
  return {
    cms: {
      collections: {
        on: vi.fn(),
        off: vi.fn(),
        refreshFromStorage: vi.fn(),
        getAllCollections: () => Array.from({ length: collections }, (_, i) => ({ id: `c${i}` })),
      },
    },
  } as unknown as Composer;
}

describe("useCmsSync — a failed hydrate is not silent (C-8)", () => {
  let addToast: ReturnType<typeof vi.fn<(input: ToastInput) => string>>;
  beforeEach(() => {
    hydrationCb = null;
    dismissedKeys.length = 0;
    retryHydration.mockClear();
    addToast = vi.fn((_input: ToastInput) => "t1");
  });

  it("toasts with Try again when collections are already on screen", () => {
    renderHook(() => useCmsSync(stubComposer(2), addToast));
    hydrationCb?.("error");
    expect(addToast).toHaveBeenCalledTimes(1);
    const toast = addToast.mock.calls[0][0] as { key: string; action: { onClick: () => void } };
    expect(toast.key).toBe("cms-hydrate-failed");
    toast.action.onClick();
    expect(retryHydration).toHaveBeenCalled();
    hydrationCb?.("ready");
    expect(dismissedKeys).toContain("cms-hydrate-failed");
  });

  it("leaves it to the panel's load-error state when there are no collections", () => {
    renderHook(() => useCmsSync(stubComposer(0), addToast));
    hydrationCb?.("error");
    expect(addToast).not.toHaveBeenCalled();
  });
});

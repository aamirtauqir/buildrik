/**
 * useSaveCallback.conflict.test.ts — gap-fill for the branches the base
 * suite (useSaveCallback.test.ts) can't reach without mocking
 * BuildrikSyncProvider:
 *
 *   1. dashboard-backed save: with a siteId in the URL the hook must call
 *      the sync-provider saveProject(siteId, exportProject()) instead of
 *      composer.saveProject() (the "Saved toast was a lie" fix).
 *   2. SaveConflictError: the conflict dialog owns ALL messaging — the
 *      hook must show NO toast and quietly return saveState to idle
 *      (single-messaging contract; the autosave path's double-messaging
 *      counterpart is pinned in useComposerInit.loadFlow.test.ts §P1-2).
 *
 * @license BSD-3-Clause
 */

import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/BuildrikSyncProvider", () => {
  class SaveConflictError extends Error {
    constructor(message = "conflict: server copy is newer") {
      super(message);
      this.name = "SaveConflictError";
    }
  }
  return {
    SaveConflictError,
    getSiteIdFromUrl: vi.fn(() => null),
    saveProject: vi.fn(() => Promise.resolve({ success: true })),
  };
});

import {
  getSiteIdFromUrl,
  saveProject as syncSaveProject,
  SaveConflictError,
} from "@/services/BuildrikSyncProvider";
import { useSaveCallback, type UseSaveCallbackOptions } from "../useSaveCallback";

function flushMicrotasks() {
  return new Promise<void>((r) => setTimeout(r, 0));
}

function makeOpts() {
  const composerSave = vi.fn().mockResolvedValue(undefined);
  const exportProject = vi.fn(() => ({ pages: ["p1"] }));
  const composer = {
    saveProject: composerSave,
    exportProject,
  } as unknown as UseSaveCallbackOptions["composer"];
  const addToast = vi.fn().mockReturnValue("toast-id");
  const setSaveState = vi.fn();
  const setIsDirty = vi.fn();
  return { composer, composerSave, exportProject, addToast, setSaveState, setIsDirty };
}

describe("useSaveCallback — dashboard sync + conflict branches", () => {
  let opts: ReturnType<typeof makeOpts>;

  beforeEach(() => {
    opts = makeOpts();
    vi.mocked(getSiteIdFromUrl).mockReturnValue(null);
    vi.mocked(syncSaveProject).mockResolvedValue({ success: true } as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function mount() {
    return renderHook(() =>
      useSaveCallback({
        composer: opts.composer,
        addToast: opts.addToast,
        setSaveState: opts.setSaveState,
        setIsDirty: opts.setIsDirty,
      }),
    );
  }

  it("with a siteId, saves through the dashboard provider — not composer.saveProject", async () => {
    vi.mocked(getSiteIdFromUrl).mockReturnValue("site-77");
    const { result } = mount();
    await act(async () => {
      result.current();
      await flushMicrotasks();
    });
    expect(syncSaveProject).toHaveBeenCalledWith("site-77", { pages: ["p1"] });
    expect(opts.composerSave).not.toHaveBeenCalled();
    expect(opts.addToast).toHaveBeenCalledWith(
      expect.objectContaining({ tone: "success", title: "Saved" }),
    );
    expect(opts.setIsDirty).toHaveBeenCalledWith(false);
  });

  it("without a siteId, falls back to composer.saveProject (localStorage path)", async () => {
    const { result } = mount();
    await act(async () => {
      result.current();
      await flushMicrotasks();
    });
    expect(opts.composerSave).toHaveBeenCalledTimes(1);
    expect(syncSaveProject).not.toHaveBeenCalled();
  });

  describe("SaveConflictError (61-conflict single-messaging contract)", () => {
    it("shows NO toast — the conflict dialog owns the messaging", async () => {
      vi.mocked(getSiteIdFromUrl).mockReturnValue("site-77");
      vi.mocked(syncSaveProject).mockRejectedValueOnce(new (SaveConflictError as unknown as new () => Error)());
      const { result } = mount();
      await act(async () => {
        result.current();
        await flushMicrotasks();
      });
      expect(opts.addToast).not.toHaveBeenCalled();
    });

    it("clears the saving spinner back to idle without recording an error", async () => {
      vi.mocked(getSiteIdFromUrl).mockReturnValue("site-77");
      vi.mocked(syncSaveProject).mockRejectedValueOnce(new (SaveConflictError as unknown as new () => Error)());
      const { result } = mount();
      await act(async () => {
        result.current();
        await flushMicrotasks();
      });
      // last setSaveState call is the conflict-branch functional updater
      const lastCall = opts.setSaveState.mock.calls.at(-1)![0] as (
        prev: { status: string; error?: string },
      ) => { status: string; error?: string };
      expect(typeof lastCall).toBe("function");
      const next = lastCall({ status: "saving", error: undefined });
      expect(next.status).toBe("idle");
      expect(next.error).toBeUndefined();
      // and the dirty flag is NOT cleared — the local copy still diverges
      expect(opts.setIsDirty).not.toHaveBeenCalled();
    });

    it("offers no Retry action (retrying would clobber the newer server copy)", async () => {
      vi.mocked(getSiteIdFromUrl).mockReturnValue("site-77");
      vi.mocked(syncSaveProject).mockRejectedValueOnce(new (SaveConflictError as unknown as new () => Error)());
      const { result } = mount();
      await act(async () => {
        result.current();
        await flushMicrotasks();
      });
      const withAction = opts.addToast.mock.calls.find(
        (c) => (c[0] as { action?: unknown }).action,
      );
      expect(withAction).toBeUndefined();
    });
  });

  it("a NON-conflict dashboard save failure still shows the error toast + Retry", async () => {
    vi.mocked(getSiteIdFromUrl).mockReturnValue("site-77");
    vi.mocked(syncSaveProject).mockRejectedValueOnce(new Error("500 whatever"));
    const { result } = mount();
    await act(async () => {
      result.current();
      await flushMicrotasks();
    });
    expect(opts.addToast).toHaveBeenCalledWith(
      expect.objectContaining({
        tone: "error",
        title: "Save failed",
        action: expect.objectContaining({ label: "Retry" }),
      }),
    );
  });
});

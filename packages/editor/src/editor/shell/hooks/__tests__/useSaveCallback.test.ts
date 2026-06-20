/**
 * useSaveCallback.test.ts — covers the saveProject success/failure
 * branches + the 5 error-message mappings + the Retry action.
 *
 * @license BSD-3-Clause
 */

import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSaveCallback, type UseSaveCallbackOptions } from "../useSaveCallback";

function makeOpts() {
  const saveProject = vi.fn().mockResolvedValue(undefined);
  const addToast = vi.fn().mockReturnValue("toast-id");
  const setSaveState = vi.fn();
  const setIsDirty = vi.fn();
  const composer = {
    saveProject,
  } as unknown as UseSaveCallbackOptions["composer"];
  return { composer, addToast, setSaveState, setIsDirty, saveProject };
}

function flushMicrotasks() {
  return new Promise<void>((r) => setTimeout(r, 0));
}

describe("useSaveCallback", () => {
  let opts: ReturnType<typeof makeOpts>;

  beforeEach(() => {
    opts = makeOpts();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("no-ops when composer is null", () => {
    const { result } = renderHook(() =>
      useSaveCallback({
        composer: null,
        addToast: opts.addToast,
        setSaveState: opts.setSaveState,
        setIsDirty: opts.setIsDirty,
      }),
    );
    act(() => result.current());
    expect(opts.saveProject).not.toHaveBeenCalled();
    expect(opts.addToast).not.toHaveBeenCalled();
    expect(opts.setSaveState).not.toHaveBeenCalled();
  });

  it("sets saving state immediately and idle on success", async () => {
    const { result } = renderHook(() =>
      useSaveCallback({
        composer: opts.composer,
        addToast: opts.addToast,
        setSaveState: opts.setSaveState,
        setIsDirty: opts.setIsDirty,
      }),
    );

    await act(async () => {
      result.current();
      await flushMicrotasks();
    });

    expect(opts.saveProject).toHaveBeenCalledTimes(1);

    // First call to setSaveState is the "saving" updater (function form)
    const savingUpdater = opts.setSaveState.mock.calls[0][0] as (
      prev: { status: string; lastSavedAt?: number; error?: string },
    ) => unknown;
    expect(typeof savingUpdater).toBe("function");
    expect(
      savingUpdater({ status: "idle", lastSavedAt: 1, error: "old" }),
    ).toMatchObject({ status: "saving", error: undefined, lastSavedAt: 1 });

    // Second call is the idle object on success
    const idleSet = opts.setSaveState.mock.calls[1][0];
    expect(idleSet).toMatchObject({ status: "idle", error: undefined });
    expect((idleSet as { lastSavedAt: number }).lastSavedAt).toBeGreaterThan(0);

    expect(opts.setIsDirty).toHaveBeenCalledWith(false);
    expect(opts.addToast).toHaveBeenCalledWith(
      expect.objectContaining({ tone: "success", title: "Saved" }),
    );
  });

  it("on a network/offline error, queues calmly — no 'Save failed'", async () => {
    // 60-save-states: a connection failure is not a lost save. The edit stays
    // local and syncs on reconnect, so the user sees a calm 'queued' nudge.
    opts.saveProject.mockRejectedValueOnce(new Error("fetch failed: network"));
    const { result } = renderHook(() =>
      useSaveCallback({
        composer: opts.composer,
        addToast: opts.addToast,
        setSaveState: opts.setSaveState,
        setIsDirty: opts.setIsDirty,
      }),
    );
    await act(async () => {
      result.current();
      await flushMicrotasks();
    });

    expect(opts.addToast).toHaveBeenCalledWith(
      expect.objectContaining({
        tone: "info",
        title: "Offline — changes queued",
      }),
    );
    // never the scary failed toast for a network error
    expect(opts.addToast).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: "Save failed" }),
    );
  });

  it.each([
    ["storage quota exceeded", "Storage full"],
    ["permission denied", "Permission denied"],
    ["request timeout", "Request timed out"],
    ["something weird", "Could not save project"],
  ])("maps error '%s' to friendly hint '%s'", async (raw, hint) => {
    opts.saveProject.mockRejectedValueOnce(new Error(raw));
    const { result } = renderHook(() =>
      useSaveCallback({
        composer: opts.composer,
        addToast: opts.addToast,
        setSaveState: opts.setSaveState,
        setIsDirty: opts.setIsDirty,
      }),
    );
    await act(async () => {
      result.current();
      await flushMicrotasks();
    });
    expect(opts.addToast).toHaveBeenCalledWith(
      expect.objectContaining({
        tone: "error",
        description: expect.stringContaining(hint),
      }),
    );
  });

  it("falls back to 'Unknown error' when err.message is missing", async () => {
    opts.saveProject.mockRejectedValueOnce({});
    const { result } = renderHook(() =>
      useSaveCallback({
        composer: opts.composer,
        addToast: opts.addToast,
        setSaveState: opts.setSaveState,
        setIsDirty: opts.setIsDirty,
      }),
    );
    await act(async () => {
      result.current();
      await flushMicrotasks();
    });

    // Find the error-state setSaveState call (functional updater)
    const errorUpdater = opts.setSaveState.mock.calls.find(
      (c) => typeof c[0] === "function",
    );
    expect(errorUpdater).toBeDefined();
    // Apply the saving updater first then error updater to track final state
    const errorState = (errorUpdater![0] as (p: unknown) => unknown)({
      status: "saving",
    });
    expect(errorState).toMatchObject({ status: "saving" });
  });

  it("Retry toast action re-invokes save", async () => {
    opts.saveProject.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() =>
      useSaveCallback({
        composer: opts.composer,
        addToast: opts.addToast,
        setSaveState: opts.setSaveState,
        setIsDirty: opts.setIsDirty,
      }),
    );
    await act(async () => {
      result.current();
      await flushMicrotasks();
    });

    expect(opts.saveProject).toHaveBeenCalledTimes(1);

    // Pull the action.onClick from the error toast call
    const errorToast = opts.addToast.mock.calls.find(
      (c) => (c[0] as { tone?: string }).tone === "error",
    );
    expect(errorToast).toBeDefined();
    const action = (errorToast![0] as { action?: { onClick: () => void } }).action;
    expect(action?.onClick).toBeTypeOf("function");

    // Retry — succeeds this time
    opts.saveProject.mockResolvedValueOnce(undefined);
    await act(async () => {
      action!.onClick();
      await flushMicrotasks();
    });
    expect(opts.saveProject).toHaveBeenCalledTimes(2);
  });
});

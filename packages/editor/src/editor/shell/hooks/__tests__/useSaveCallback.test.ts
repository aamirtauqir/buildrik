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

  it("no-ops when composer is null", async () => {
    const { result } = renderHook(() =>
      useSaveCallback({
        composer: null,
        addToast: opts.addToast,
        setSaveState: opts.setSaveState,
        setIsDirty: opts.setIsDirty,
      }),
    );
    // save() now returns a Promise (SaveOutcome) — await the act so React's
    // act-environment is flushed and later renderHooks aren't poisoned.
    await act(async () => {
      await expect(result.current()).resolves.toBe("error");
    });
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

/**
 * Board S1.5b · session-expired with work in the editor.
 *
 * The load path has told this case apart for a while — it offers "Sign in".
 * The save path did not: an expired session fell through to the generic
 * "Save failed · Could not save project." with a Retry that re-sent the same
 * unauthenticated request, so the one thing the user needed to know (you are
 * signed out) was the one thing the toast never said.
 */
describe("useSaveCallback — an expired session is not a retryable save failure", () => {
  const AUTH_ERRORS = ["UNAUTHORIZED", "401 Unauthorized", "Session expired", "FORBIDDEN"];

  it.each(AUTH_ERRORS)("%s raises Sign in, not Retry", async (raw) => {
    const opts = makeOpts();
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
      await result.current();
      await flushMicrotasks();
    });
    const toast = opts.addToast.mock.calls.at(-1)?.[0] as {
      title: string;
      tone: string;
      action?: { label: string };
    };
    expect(toast.title).toBe("Session expired");
    expect(toast.action?.label).toBe("Sign in");
    expect(toast.tone).toBe("warning");
  });

  it("does not promise the work is safe on this device", async () => {
    const opts = makeOpts();
    opts.saveProject.mockRejectedValueOnce(new Error("UNAUTHORIZED"));
    const { result } = renderHook(() =>
      useSaveCallback({
        composer: opts.composer,
        addToast: opts.addToast,
        setSaveState: opts.setSaveState,
        setIsDirty: opts.setIsDirty,
      }),
    );
    await act(async () => {
      await result.current();
      await flushMicrotasks();
    });
    const { description } = opts.addToast.mock.calls.at(-1)?.[0] as { description: string };
    // With a siteId the save goes straight to the server and never runs the
    // engine's localStorage write, so "saved on this device" would be a lie.
    expect(description).not.toMatch(/on this device|saved locally|will sync/i);
    expect(description).toMatch(/sign in/i);
  });

  it("a plain failure still gets Retry", async () => {
    const opts = makeOpts();
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
      await result.current();
      await flushMicrotasks();
    });
    const toast = opts.addToast.mock.calls.at(-1)?.[0] as {
      title: string;
      action?: { label: string };
    };
    expect(toast.title).toBe("Save failed");
    expect(toast.action?.label).toBe("Retry");
  });
});

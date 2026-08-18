/**
 * useSaveCallback.test.ts — covers the saveProject success/failure
 * branches + the 5 error-message mappings + the Retry action.
 *
 * @license BSD-3-Clause
 */

import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSaveCallback, type UseSaveCallbackOptions } from "../useSaveCallback";

/* The siteId branch calls the SERVICE's saveProject, not the composer's, so
   the two have to be controllable apart. getSiteIdFromUrl stays real — the
   tests drive it by setting window.location, which is what the hook reads. */
const svc = vi.hoisted(() => ({ saveProject: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/services/BuildrikSyncProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/BuildrikSyncProvider")>();
  return { ...actual, saveProject: svc.saveProject };
});

function makeOpts() {
  const saveProject = vi.fn().mockResolvedValue(undefined);
  const addToast = vi.fn().mockReturnValue("toast-id");
  const setSaveState = vi.fn();
  const setIsDirty = vi.fn();
  const composer = {
    saveProject,
    exportProject: vi.fn(() => ({ pages: [] })),
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
    svc.saveProject.mockResolvedValue(undefined);
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

  it("on a network error with NO siteId, says the edit is on this device", async () => {
    /* Only this branch runs `composer.saveProject()`, which is the one that
       writes localStorage — so only here may the copy promise the device. */
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
        title: "Offline — saved on this device",
      }),
    );
    // never the scary failed toast for a network error
    expect(opts.addToast).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: "Save failed" }),
    );
  });

  it("on a network error WITH a siteId, promises nothing about the device", async () => {
    /* The regression this locks: the copy used to say "saved on this device
       and will sync when you're back" for every project. With a siteId the
       save is a bare RPC — nothing local is written on this path and nothing
       replays it on reconnect (syncRetryQueue carries CMS, components,
       templates and versions, not the project). Checked live: edit made, save
       blocked at the network, tab reloaded, edit gone. */
    const url = new URL("http://localhost:3000/edit/site_abc");
    const original = window.location;
    Object.defineProperty(window, "location", { value: url, writable: true });
    try {
      svc.saveProject.mockRejectedValueOnce(new Error("fetch failed: network"));
      const { result } = renderHook(() =>
        useSaveCallback({
          composer: opts.composer,
          addToast: opts.addToast,
          setSaveState: opts.setSaveState,
          setIsDirty: opts.setIsDirty,
        }),
      );
      let outcome: string | undefined;
      await act(async () => {
        outcome = await result.current();
      });
      expect(outcome).toBe("error");
      expect(opts.addToast).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "warning", title: "Offline — not saved" }),
      );
      expect(opts.addToast).not.toHaveBeenCalledWith(
        expect.objectContaining({ title: expect.stringContaining("on this device") }),
      );
    } finally {
      Object.defineProperty(window, "location", { value: original, writable: true });
    }
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

/**
 * useSaveCallback.test.ts — covers the saveProject success/failure
 * branches + the 5 error-message mappings + the Retry action.
 *
 * @license BSD-3-Clause
 */

import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCClientError } from "@trpc/client";
import { useSaveCallback, type UseSaveCallbackOptions } from "../useSaveCallback";
import { BANNER_ID, clearGlobalBanner, useGlobalBanners } from "@/editor/shell/globalBanners";

/* F-12 / F-14: connection and role conditions go to the global banner slot. */
const banners = () => renderHook(() => useGlobalBanners()).result.current;
const banner = (id: string) => banners().find((b) => b.id === id);

/* The siteId branch calls the SERVICE's saveProject, not the composer's, so
   the two have to be controllable apart. getSiteIdFromUrl stays real — the
   tests drive it by setting window.location, which is what the hook reads. */
const svc = vi.hoisted(() => ({ saveProject: vi.fn().mockResolvedValue(undefined) }));
const invalidateMyRole = vi.hoisted(() => vi.fn());
vi.mock("@/services/RoleService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/RoleService")>()),
  invalidateMyRole,
}));

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
    Object.values(BANNER_ID).forEach(clearGlobalBanner);
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
       writes localStorage — so only here may the copy promise the device.
       jsdom reports `navigator.onLine === true`, so this is the ONLINE case:
       the transport died but the browser never left the network, and the
       title must name that cause rather than claiming "Offline". */
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
        title: "Couldn't reach the server — saved on this device",
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
      /* Online (jsdom's default) — the server was unreachable, not the user.
         F-12 / board 225:8126: that is the slot's "Can't reach" banner with
         Retry now, not a toast the next toast replaces. */
      expect(opts.addToast).not.toHaveBeenCalled();
      expect(banner(BANNER_ID.connection)).toMatchObject({
        tone: "warning",
        message: "Can’t reach Buildrick. Your edits are kept and will save when it responds.",
        actions: [expect.objectContaining({ label: "Retry now" })],
      });
      /* Retry now re-sends; a save that lands takes the banner down. */
      const retryNow = banner(BANNER_ID.connection)!.actions![0].onClick;
      await act(async () => {
        retryNow();
        await flushMicrotasks();
      });
      expect(svc.saveProject).toHaveBeenCalledTimes(2);
      expect(banner(BANNER_ID.connection)).toBeUndefined();
    } finally {
      Object.defineProperty(window, "location", { value: original, writable: true });
    }
  });

  it("says Offline only when the browser is actually offline", async () => {
    /* The bug this locks: `isNetwork` was true for ANY network-shaped error
       text, and that one boolean picked the copy. A server that refused while
       the browser was online produced "Failed to fetch", matched the regex,
       and the toast said "Offline — not saved" beside a pill reading "Save
       failed — retry" — one event, two causes named, and the named one false.
       Only `navigator.onLine` may decide this word. */
    const url = new URL("http://localhost:3000/edit/site_abc");
    const original = window.location;
    Object.defineProperty(window, "location", { value: url, writable: true });
    /* Shadow the prototype getter with an OWN property, and delete that own
       property in the finally — restoring the prototype descriptor instead
       leaves the instance shadow in place, and every later test in this file
       then runs "offline". */
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
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
      await act(async () => {
        await result.current();
      });
      /* F-12: offline is the slot's own banner (B7-G11, raised from the
         browser's online state) — the save adds no toast and no second one. */
      expect(opts.addToast).not.toHaveBeenCalled();
      expect(banner(BANNER_ID.connection)).toBeUndefined();
    } finally {
      delete (navigator as unknown as Record<string, unknown>).onLine;
      Object.defineProperty(window, "location", { value: original, writable: true });
    }
  });

  /* Owner 2026-10-26 (one error surface): a failed ⌘S is the save status —
     the slot's bar and the bottom bar's "Couldn't save — Retry" read it
     (copy per reason: saveFailedBanner.test.ts). No toast. */
  it("a failed save is the status error with the raw message, and raises no toast", async () => {
    opts.saveProject.mockRejectedValueOnce(new Error("request timeout"));
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
      await flushMicrotasks();
    });
    expect(outcome).toBe("error");
    const last = opts.setSaveState.mock.calls.at(-1)![0] as unknown;
    const next = typeof last === "function" ? (last as (s: object) => object)({}) : last;
    expect(next).toMatchObject({ status: "error", error: "request timeout" });
    expect(opts.addToast).not.toHaveBeenCalledWith(expect.objectContaining({ tone: "error" }));
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
  /* FORBIDDEN left this list on 2026-08-28: a role revocation is not a
     session problem, and "Sign in" cannot fix it. */
  const AUTH_ERRORS = ["UNAUTHORIZED", "401 Unauthorized", "Session expired"];

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

  it.each(AUTH_ERRORS)(
    "%s opens the recovery surface instead of any toast when onAuthExpired is wired",
    async (raw) => {
      const opts = makeOpts();
      const onAuthExpired = vi.fn();
      opts.saveProject.mockRejectedValueOnce(new Error(raw));
      const { result } = renderHook(() =>
        useSaveCallback({
          composer: opts.composer,
          addToast: opts.addToast,
          setSaveState: opts.setSaveState,
          setIsDirty: opts.setIsDirty,
          onAuthExpired,
        }),
      );
      await act(async () => {
        await result.current();
        await flushMicrotasks();
      });
      expect(onAuthExpired).toHaveBeenCalledTimes(1);
      const titles = opts.addToast.mock.calls.map((c) => (c[0] as { title?: string }).title);
      expect(titles).not.toContain("Session expired");
    },
  );

  /* THE ONE RECOVERABLE FAILURE THAT KEPT NOTHING. With a siteId the save is a
     bare RPC, so a refused save leaves the work in the tab and nowhere else —
     which is exactly why the network branch writes a recovery snapshot, and
     why `unsavedRecovery`'s header says a reload otherwise seeds "Saved just
     now" over discarded work. A 401 lands in the same state and can still be
     saved once the user signs in, and it was the only such branch that kept
     no copy. `missing` stays uncovered on purpose: nothing can ever be saved
     to a deleted site. (`forbidden` is covered since A15-9 — below.) */
  it.each(AUTH_ERRORS)("%s keeps the work for the reload, like a network failure does", async (raw) => {
    const url = new URL("http://localhost:3000/edit/site_auth");
    const original = window.location;
    Object.defineProperty(window, "location", { value: url, writable: true });
    localStorage.removeItem("bk-unsaved-v1-site_auth");
    try {
      const opts = makeOpts();
      svc.saveProject.mockRejectedValueOnce(new Error(raw));
      const { result } = renderHook(() =>
        useSaveCallback({
          composer: opts.composer,
          addToast: opts.addToast,
          setSaveState: opts.setSaveState,
          setIsDirty: opts.setIsDirty,
          onAuthExpired: vi.fn(),
        }),
      );
      await act(async () => {
        await result.current();
        await flushMicrotasks();
      });
      const kept = localStorage.getItem("bk-unsaved-v1-site_auth");
      expect(kept).not.toBeNull();
      expect(JSON.parse(kept!).project).toEqual({ pages: [] });
    } finally {
      localStorage.removeItem("bk-unsaved-v1-site_auth");
      Object.defineProperty(window, "location", { value: original, writable: true });
    }
  });

  /* A15-9: a mid-session demotion refused the edit. It existed only in this
     tab; it is kept for the reload (a role can come back), and the cached
     role that offered the edit is dropped so the next reader asks again. */
  it("FORBIDDEN keeps the refused work and forgets the cached role", async () => {
    const url = new URL("http://localhost:3000/edit/site_forbidden");
    const original = window.location;
    Object.defineProperty(window, "location", { value: url, writable: true });
    localStorage.removeItem("bk-unsaved-v1-site_forbidden");
    try {
      const opts = makeOpts();
      svc.saveProject.mockRejectedValueOnce(new Error("FORBIDDEN"));
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
      expect(localStorage.getItem("bk-unsaved-v1-site_forbidden")).not.toBeNull();
      expect(invalidateMyRole).toHaveBeenCalled();
      localStorage.removeItem("bk-unsaved-v1-site_forbidden");
    } finally {
      Object.defineProperty(window, "location", { value: original, writable: true });
    }
  });

  /* C-9 (live): a VIEWER-demoted save gets the server's TRPCError FORBIDDEN,
     whose MESSAGE is "Insufficient permissions" (permission.service
     checkSiteRole) — no "forbidden" or "403" in it. The string-matching
     helper let it fall through to the generic "Save failed", so keepUnsaved
     and the role invalidation never ran. The tests above invented messages;
     this one is the error object tRPC's client actually rejects with. */
  it("a real TRPCClientError FORBIDDEN (message 'Insufficient permissions') keeps the work", async () => {
    const url = new URL("http://localhost:3000/edit/site_trpc403");
    const original = window.location;
    Object.defineProperty(window, "location", { value: url, writable: true });
    localStorage.removeItem("bk-unsaved-v1-site_trpc403");
    try {
      const opts = makeOpts();
      svc.saveProject.mockRejectedValueOnce(
        TRPCClientError.from({
          error: {
            message: "Insufficient permissions",
            code: -32603,
            data: { code: "FORBIDDEN", httpStatus: 403, path: "sites.saveProject" },
          },
        }),
      );
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
      expect(localStorage.getItem("bk-unsaved-v1-site_trpc403")).not.toBeNull();
      expect(invalidateMyRole).toHaveBeenCalled();
      /* F-14 / board 227:7411: the role change is the slot's banner, with
         the board's two actions. */
      expect(opts.addToast).not.toHaveBeenCalled();
      expect(banner(BANNER_ID.roleChanged)).toMatchObject({
        message: "Your role changed to Viewer — editing is off. Changes that weren’t saved are kept in this browser.",
        actions: [expect.objectContaining({ label: "Download them" }), expect.objectContaining({ label: "Ask an admin" })],
      });
      localStorage.removeItem("bk-unsaved-v1-site_trpc403");
    } finally {
      Object.defineProperty(window, "location", { value: original, writable: true });
    }
  });

  it.each(["FORBIDDEN", "403 Forbidden"])(
    "%s tells the role truth — no Sign in, no recovery surface",
    async (raw) => {
      const opts = makeOpts();
      const onAuthExpired = vi.fn();
      opts.saveProject.mockRejectedValueOnce(new Error(raw));
      const { result } = renderHook(() =>
        useSaveCallback({
          composer: opts.composer,
          addToast: opts.addToast,
          setSaveState: opts.setSaveState,
          setIsDirty: opts.setIsDirty,
          onAuthExpired,
        }),
      );
      await act(async () => {
        await result.current();
        await flushMicrotasks();
      });
      expect(onAuthExpired).not.toHaveBeenCalled();
      expect(opts.addToast).not.toHaveBeenCalled();
      expect(banner(BANNER_ID.roleChanged)?.actions?.map((a) => a.label)).toEqual(["Download them", "Ask an admin"]);
    },
  );

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

  /* I-2: the server refuses a save carrying a page that belongs to another
     site with BAD_REQUEST (never FORBIDDEN — that reads as a revoked role
     and drops the tab into view mode). The editor says what happened. */
  it("a cross-site page refusal says so — no view-mode switch, no role copy", async () => {
    const opts = makeOpts();
    const roleInvalidationsBefore = invalidateMyRole.mock.calls.length;
    opts.saveProject.mockRejectedValueOnce(
      TRPCClientError.from({
        error: {
          message: "This save includes a page that belongs to another site, so it was not applied. Reload the site before editing.",
          code: -32600,
          data: { code: "BAD_REQUEST", httpStatus: 400, path: "sites.saveProject" },
        },
      }),
    );
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
    expect(invalidateMyRole.mock.calls.length).toBe(roleInvalidationsBefore);
    /* The words are the slot bar's (saveFailedBanner: "…another site… Reload
       the site…"), read from the status; no toast. */
    const last = opts.setSaveState.mock.calls.at(-1)![0] as unknown;
    const next = (typeof last === "function" ? (last as (s: object) => object)({}) : last) as { status: string; error: string };
    expect(next.status).toBe("error");
    expect(next.error).toMatch(/belongs to another site/);
    expect(opts.addToast).not.toHaveBeenCalled();
  });

  it("a plain failure is the error status (its Retry is the status's and the slot's), no toast", async () => {
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
    const last = opts.setSaveState.mock.calls.at(-1)![0] as unknown;
    const next = typeof last === "function" ? (last as (s: object) => object)({}) : last;
    expect(next).toMatchObject({ status: "error", error: "boom" });
    expect(opts.addToast).not.toHaveBeenCalled();
  });
});

/* I1 (manual ⌘S): the server refused the brand tokens in this save. Retry
   can only be refused again, so no "Save failed" toast with Retry: the work
   is kept for the reload and the persistent banner (status "error", copy
   from saveState.error) carries it — the same as autosave. */
describe("useSaveCallback — TOKENS_INVALID", () => {
  it("keeps the work, raises the banner state, and shows no toast", async () => {
    const REFUSAL = "TOKENS_INVALID: alias target missing: nowhere";
    const url = new URL("http://localhost:3000/edit/site_tokens");
    const original = window.location;
    Object.defineProperty(window, "location", { value: url, writable: true });
    localStorage.removeItem("bk-unsaved-v1-site_tokens");
    try {
      const opts = makeOpts();
      svc.saveProject.mockRejectedValueOnce(
        TRPCClientError.from({
          error: {
            message: REFUSAL,
            code: -32600,
            data: { code: "BAD_REQUEST", httpStatus: 400, path: "sites.saveProject" },
          },
        }),
      );
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
        await flushMicrotasks();
      });
      expect(outcome).toBe("error");
      expect(opts.addToast).not.toHaveBeenCalled();
      const last = opts.setSaveState.mock.calls.at(-1)?.[0];
      const state = typeof last === "function" ? last({ status: "saving" }) : last;
      expect(state).toMatchObject({ status: "error", error: REFUSAL });
      expect(opts.setIsDirty).toHaveBeenLastCalledWith(true);
      expect(localStorage.getItem("bk-unsaved-v1-site_tokens")).not.toBeNull();
    } finally {
      localStorage.removeItem("bk-unsaved-v1-site_tokens");
      Object.defineProperty(window, "location", { value: original, writable: true });
    }
  });

  /* L5-074: on a reload with work the server never got, the save-failed
     banner's Retry saved the SCREEN (the server's copy) and then deleted the
     kept edits as "on the server now". Retry re-sends the kept work. */
  it("Retry after a reload re-sends the kept edits, and keeps them until that save lands", async () => {
    const { keepUnsaved, markUnsavedOffScreen, readUnsaved, clearUnsaved } = await import("@/services/unsavedRecovery");
    const url = new URL("http://localhost:3000/edit/site_kept");
    const original = window.location;
    Object.defineProperty(window, "location", { value: url, writable: true });
    try {
      const kept = { pages: [{ id: "p", name: "mine" }] };
      keepUnsaved("site_kept", kept as never);
      markUnsavedOffScreen("site_kept");
      const importProject = vi.fn();
      const opts = makeOpts();
      const composer = { ...opts.composer, importProject, exportProject: vi.fn(() => kept) } as never;
      let resolveSave: () => void = () => {};
      svc.saveProject.mockImplementationOnce(() => new Promise<void>((r) => (resolveSave = r)));
      const { result } = renderHook(() =>
        useSaveCallback({ composer, addToast: opts.addToast, setSaveState: opts.setSaveState, setIsDirty: opts.setIsDirty }),
      );
      let done: Promise<unknown> = Promise.resolve();
      act(() => {
        done = result.current();
      });
      expect(importProject).toHaveBeenCalledWith(kept);
      expect(svc.saveProject).toHaveBeenCalledWith("site_kept", kept);
      expect(readUnsaved("site_kept")).not.toBeNull();
      await act(async () => {
        resolveSave();
        await done;
      });
      expect(readUnsaved("site_kept")).toBeNull();
      clearUnsaved("site_kept");
    } finally {
      Object.defineProperty(window, "location", { value: original, writable: true });
    }
  });
});

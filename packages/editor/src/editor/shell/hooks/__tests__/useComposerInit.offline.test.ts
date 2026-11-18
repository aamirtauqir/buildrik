/**
 * Offline is not a server error, and nothing is "saved locally".
 *
 * Read live with the browser offline: the visible save pill said "Offline —
 * saved locally" while the screen-reader announcement two elements away said
 * "changes not saved", and the autosave toast underneath shouted "Save failed
 * — Could not save to dashboard". For a dashboard-backed site the save is a
 * bare RPC: nothing is written to the device and nothing replays on reconnect
 * (the reconnect queue carries CMS, components, templates and versions, never
 * the project). `useSaveCallback` already drew that line for a manual save.
 *
 * @license BSD-3-Clause
 */
import { renderHook, act } from "@testing-library/react";
import { TRPCClientError } from "@trpc/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { THRESHOLDS } from "@/shared/constants/config";
import { useComposerInit, type UseComposerInitParams } from "../useComposerInit";
import { BANNER_ID, clearGlobalBanner, useGlobalBanners } from "@/editor/shell/globalBanners";
import { currentWork, hasUnsavedWork } from "@/editor/shell/workSnapshot";

/* F-12 / F-14: connection and role conditions go to the global banner slot. */
const banner = (id: string) => renderHook(() => useGlobalBanners()).result.current.find((b) => b.id === id);

type Handler = (...args: unknown[]) => void;
const handlers: Record<string, Handler[]> = {};

const composer = {
  on: vi.fn((e: string, h: Handler) => { (handlers[e] ??= []).push(h); }),
  off: vi.fn(),
  emit: vi.fn((e: string, ...a: unknown[]) => (handlers[e] ?? []).forEach((h) => h(...a))),
  saveProject: vi.fn(() => Promise.resolve()),
  markSaved: vi.fn(),
  loadProject: vi.fn(() => Promise.resolve(null)),
  importProject: vi.fn(),
  exportProject: vi.fn(() => ({})),
  isDirty: vi.fn(() => false),
  setProjectLoading: vi.fn(),
  isProjectLoading: vi.fn(() => false),
  elements: { getAllPages: vi.fn(() => [{ id: "p1" }]), createPage: vi.fn(), getElement: vi.fn() },
  history: { canUndo: vi.fn(() => false), canRedo: vi.fn(() => false) },
  cms: { collections: {} },
  cmsManager: {},
  migration: { run: vi.fn(({ project, currentVersion }) => ({ project, newVersion: currentVersion })) },
  aliasResolver: { validate: vi.fn(), resolve: vi.fn(), getChain: vi.fn() },
  designSystem: { readOnly: false, readOnlyReason: null, brandTokensV2: true },
  destroy: vi.fn(),
  /* Edit locks are inert here; useComposerInit.editLock.test.ts runs them
     with the engine's semantics. */
  editLocks: new Set<string>(),
  setEditLock: vi.fn(),
};

vi.mock("@/engine", () => ({ createComposer: vi.fn(() => composer), Composer: class {} }));
vi.mock("@/engine/cms", () => ({
  ProductCollectionService: class {
    hasProductsCollection() { return Promise.resolve(true); }
    createProductsCollection() { return Promise.resolve(); }
  },
}));
vi.mock("@/services/AssetUploadService", () => ({ createRemoteAssetSync: vi.fn(() => ({})) }));
vi.mock("@/services/BuildrikSyncProvider", () => ({
  /* Added with the attribution wiring: useComposerInit now reads the
     signed-in user so versions and history stop recording `userId: null`. */
  loadCurrentUserId: vi.fn(() => Promise.resolve(null)),
  getBaselineLastEditedAt: vi.fn(() => null),
  hasProjectLoaded: vi.fn(() => true),
  getSiteIdFromUrl: vi.fn(() => "site-1"),
  loadProject: vi.fn(() => Promise.resolve({})),
  loadServerMedia: vi.fn(() => Promise.resolve(null)),
  saveProject: vi.fn(() => Promise.reject(new Error("Failed to fetch"))),
  isSaveConflictPending: vi.fn(() => false),
  SAVE_CONFLICT_EVENT: "buildrik:save-conflict",
  SaveConflictError: class extends Error {},
}));

const invalidateMyRole = vi.hoisted(() => vi.fn());
const fetchMyRole = vi.hoisted(() => vi.fn(() => Promise.resolve("EDITOR")));
vi.mock("@/services/RoleService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/RoleService")>()),
  invalidateMyRole,
  fetchMyRole,
}));

import { saveProject as syncSaveProject } from "@/services/BuildrikSyncProvider";

function params(): UseComposerInitParams {
  return {
    containerRef: { current: document.createElement("div") },
    addToast: vi.fn().mockReturnValue("t"),
    setCanUndo: vi.fn(),
    setCanRedo: vi.fn(),
    setDevice: vi.fn(),
    setZoom: vi.fn(),
    setShowExporter: vi.fn(),
    setIsDirty: vi.fn(),
    setSaveState: vi.fn(),
  } as unknown as UseComposerInitParams;
}

beforeEach(() => {
  Object.keys(handlers).forEach((k) => delete handlers[k]);
  vi.clearAllMocks();
  composer.on.mockImplementation((e: string, h: Handler) => { (handlers[e] ??= []).push(h); });
  composer.emit.mockImplementation((e: string, ...a: unknown[]) => (handlers[e] ?? []).forEach((h) => h(...a)));
  vi.useFakeTimers();
  Object.values(BANNER_ID).forEach(clearGlobalBanner);
});
afterEach(() => vi.useRealTimers());

/* Only navigator can answer "am I offline". jsdom reports online by default,
   so a test that merely rejects with "Failed to fetch" is the ONLINE case —
   which is how this file came to assert the bug: it expected the offline copy
   from a browser that was online, and passed because the code ORed the two. */
const setOnline = (online: boolean) => {
  Object.defineProperty(window.navigator, "onLine", { value: online, configurable: true });
};
afterEach(() => setOnline(true));

const runAutosave = async (p: ReturnType<typeof params>) => {
  renderHook(() => useComposerInit(p));
  act(() => { composer.emit("project:changed"); });
  await act(async () => { await vi.advanceTimersByTimeAsync(THRESHOLDS.AUTOSAVE_DEBOUNCE + 1); });
  return vi.mocked(p.addToast!).mock.calls.map(([t]) => t as { title?: string; description?: string });
};

describe("autosave while offline", () => {
  /* F-12 / board 225:7600: offline is the slot's own banner, raised from the
     browser's online state — the save adds no toast and no second banner. */
  it("adds no toast and no connection banner, and keeps the work in the tab", async () => {
    setOnline(false);
    const p = params();
    const toasts = await runAutosave(p);

    expect(toasts).toEqual([]);
    expect(banner(BANNER_ID.connection)).toBeUndefined();
    // The edit is still dirty — it has not been persisted anywhere.
    expect(vi.mocked(p.setIsDirty!).mock.calls.some(([v]) => v === true)).toBe(true);
  });

  it("online, a transport failure is the 'Can't reach' banner with Retry now — not a toast", async () => {
    /* Measured live 2026-09-03 with navigator.onLine true at the moment of
       failure: the copy told the user to wait until they were back online,
       which never arrives. Online and unreachable is board 225:8126. */
    setOnline(true);
    const p = params();
    const toasts = await runAutosave(p);

    expect(toasts).toEqual([]);
    expect(banner(BANNER_ID.connection)).toMatchObject({
      tone: "warning",
      message: "Can’t reach Buildrick. Your edits are kept and will save when it responds.",
      actions: [expect.objectContaining({ label: "Retry now" })],
    });
    expect(vi.mocked(p.setIsDirty!).mock.calls.some(([v]) => v === true)).toBe(true);
  });

  it("a scheduled retry says Reconnecting…, and a save that lands takes the banner down", async () => {
    setOnline(true);
    await runAutosave(params());
    expect(banner(BANNER_ID.connection)?.message).toMatch(/^Can’t reach Buildrick/);
    /* The first retry fires after its backoff (5 s), then the save debounce. */
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(banner(BANNER_ID.connection)?.message).toBe("Reconnecting… saving your changes");
    vi.mocked(syncSaveProject).mockResolvedValueOnce(undefined as never);
    await act(async () => { await vi.advanceTimersByTimeAsync(THRESHOLDS.AUTOSAVE_DEBOUNCE + 1); });
    expect(banner(BANNER_ID.connection)).toBeUndefined();
  });
});

/* A15-9: a role revoked mid-session refuses the autosave. The edit existed
   only in this tab — it is kept for the reload like a network failure's, and
   the cached role that offered the edit is dropped. F-14 / board 227:7411:
   the refusal is the role-changed banner with the board's two actions. */
describe("autosave refused with FORBIDDEN", () => {
  it("keeps the refused work recoverable and forgets the cached role", async () => {
    localStorage.removeItem("bk-unsaved-v1-site-1");
    vi.mocked(syncSaveProject).mockRejectedValueOnce(new Error("FORBIDDEN"));
    const p = params();
    const toasts = await runAutosave(p);

    expect(toasts).toEqual([]);
    expect(banner(BANNER_ID.roleChanged)?.actions?.map((a) => a.label)).toEqual(["Download them", "Ask an admin"]);
    expect(localStorage.getItem("bk-unsaved-v1-site-1")).not.toBeNull();
    expect(invalidateMyRole).toHaveBeenCalledTimes(1);
    localStorage.removeItem("bk-unsaved-v1-site-1");
  });

  // C-9 (live): the server's FORBIDDEN arrives as a TRPCClientError whose
  // message is "Insufficient permissions" — the code, not the text, says 403.
  it("recognises the real TRPCClientError FORBIDDEN shape", async () => {
    localStorage.removeItem("bk-unsaved-v1-site-1");
    vi.mocked(syncSaveProject).mockRejectedValueOnce(
      TRPCClientError.from({
        error: {
          message: "Insufficient permissions",
          code: -32603,
          data: { code: "FORBIDDEN", httpStatus: 403, path: "sites.saveProject" },
        },
      }),
    );
    await runAutosave(params());

    expect(banner(BANNER_ID.roleChanged)).toBeDefined();
    expect(localStorage.getItem("bk-unsaved-v1-site-1")).not.toBeNull();
    localStorage.removeItem("bk-unsaved-v1-site-1");
  });
});

/* F-15: every "Download a copy" on page 07 reads the work snapshot the load
   path registers — the live project, and whether it holds unsaved changes. */
describe("the work snapshot", () => {
  it("is the live composer's while the hook is mounted, and gone after", () => {
    localStorage.removeItem("bk-unsaved-v1-site-1");
    composer.exportProject.mockReturnValue({ id: "live" } as never);
    const view = renderHook(() => useComposerInit(params()));
    expect(currentWork("site-1")).toEqual({ id: "live" });
    view.unmount();
    expect(currentWork("site-1")).toBeNull();
    expect(hasUnsavedWork("site-1")).toBe(false);
    composer.exportProject.mockReturnValue({} as never);
  });

  it("reports unsaved work from the composer's dirty state", () => {
    renderHook(() => useComposerInit(params()));
    expect(hasUnsavedWork("site-1")).toBe(false);
    composer.isDirty.mockReturnValueOnce(true);
    expect(hasUnsavedWork("site-1")).toBe(true);
  });
});

/* C-9 (verify pass 3): after a forbidden save the toast and the restore
   prompt worked, but the editor never went read-only — Add and Publish stayed
   live and the next autosave repainted the generic "Couldn't save … check
   your connection" banner. The refusal now re-asks the role; below EDITOR the
   editor opens the view mode a VIEWER is sent to (?view=readonly), and a
   read-only view never autosaves. */
describe("C-9 — a demoted member lands in view mode and autosave stops", () => {
  const original = window.location;
  const fakeLocation = (search: string) => {
    const replace = vi.fn();
    Object.defineProperty(window, "location", {
      value: { href: `http://localhost:3000/edit/site-1${search}`, search, replace },
      writable: true,
    });
    return replace;
  };
  afterEach(() => {
    Object.defineProperty(window, "location", { value: original, writable: true });
    localStorage.removeItem("bk-unsaved-v1-site-1");
  });

  it("re-asks the role and, now a VIEWER, opens ?view=readonly", async () => {
    const replace = fakeLocation("");
    fetchMyRole.mockResolvedValueOnce("VIEWER");
    vi.mocked(syncSaveProject).mockRejectedValueOnce(new Error("FORBIDDEN"));
    await runAutosave(params());

    expect(invalidateMyRole).toHaveBeenCalled();
    expect(fetchMyRole).toHaveBeenCalled();
    await act(async () => { await vi.runAllTimersAsync(); });
    expect(replace).toHaveBeenCalledTimes(1);
    expect(new URL(replace.mock.calls[0][0] as string).searchParams.get("view")).toBe("readonly");
  });

  /* Review #5: the switch navigated with the editor still dirty — the
     beforeunload guard prompts on that, and a Leave/Stay prompt over a
     refused save loses the explanation. The edits are already kept
     (keepUnsaved), so the editor is marked clean BEFORE it navigates; the
     view-mode load then shows the "kept in this browser" notice. */
  it("marks the editor clean before it navigates, with the edits already kept", async () => {
    const replace = fakeLocation("");
    fetchMyRole.mockResolvedValueOnce("VIEWER");
    vi.mocked(syncSaveProject).mockRejectedValueOnce(new Error("FORBIDDEN"));
    const p = params();
    const order: string[] = [];
    vi.mocked(p.setIsDirty!).mockImplementation(((v: boolean) => { if (v === false) order.push("clean"); }) as never);
    replace.mockImplementation(() => order.push("navigate"));
    await runAutosave(p);
    await act(async () => { await vi.runAllTimersAsync(); });
    expect(localStorage.getItem("bk-unsaved-v1-site-1")).not.toBeNull();
    expect(order).toEqual(["clean", "navigate"]);
  });

  it("stays put when the role still allows editing", async () => {
    const replace = fakeLocation("");
    fetchMyRole.mockResolvedValueOnce("EDITOR");
    vi.mocked(syncSaveProject).mockRejectedValueOnce(new Error("FORBIDDEN"));
    await runAutosave(params());
    expect(replace).not.toHaveBeenCalled();
  });

  it("a read-only view never sends an autosave", async () => {
    fakeLocation("?view=readonly");
    const p = params();
    await runAutosave(p);
    expect(syncSaveProject).not.toHaveBeenCalled();
    expect(vi.mocked(p.setIsDirty!).mock.calls.some(([v]) => v === true)).toBe(false);
  });
});

/* I1: the server refused the brand tokens in this save (TOKENS_INVALID). The
   same payload can only be refused again, so it is not re-sent; the work is
   kept for the reload, and the failure stays on screen as the persistent
   save-failed banner (status "error"), not a toast. */
describe("autosave refused with TOKENS_INVALID", () => {
  const REFUSAL = "TOKENS_INVALID: alias target missing: nowhere";

  it("keeps the work, raises the banner state without a toast, and does not resend the same payload", async () => {
    localStorage.removeItem("bk-unsaved-v1-site-1");
    /* The real exportProject stamps metadata.updatedAt on every call
       (Composer.exportProject), so no two snapshots are ever byte-equal. A
       constant mock hid that the whole-payload guard could never match. */
    let stamp = 0;
    composer.exportProject.mockImplementation(
      () => ({ settings: { designTokens: ["bad"] }, metadata: { updatedAt: `t${++stamp}` } }) as never,
    );
    vi.mocked(syncSaveProject).mockRejectedValueOnce(
      new TRPCClientError(REFUSAL, { result: { error: { message: REFUSAL, code: -32600, data: { code: "BAD_REQUEST", httpStatus: 400, path: "sites.saveProject" } } } as never }),
    );
    const p = params();
    const toasts = await runAutosave(p);

    expect(toasts).toEqual([]);
    const states = vi.mocked(p.setSaveState!).mock.calls.map(([s]) => (typeof s === "function" ? s({ status: "idle" }) : s));
    expect(states.at(-1)).toMatchObject({ status: "error", error: REFUSAL });
    expect(localStorage.getItem("bk-unsaved-v1-site-1")).not.toBeNull();
    expect(syncSaveProject).toHaveBeenCalledTimes(1);

    act(() => { composer.emit("project:changed"); });
    await act(async () => { await vi.advanceTimersByTimeAsync(THRESHOLDS.AUTOSAVE_DEBOUNCE + 1); });
    expect(syncSaveProject).toHaveBeenCalledTimes(1);

    vi.mocked(syncSaveProject).mockResolvedValueOnce(undefined as never);
    composer.exportProject.mockImplementation(
      () => ({ settings: { designTokens: [] }, metadata: { updatedAt: `t${++stamp}` } }) as never,
    );
    act(() => { composer.emit("project:changed"); });
    await act(async () => { await vi.advanceTimersByTimeAsync(THRESHOLDS.AUTOSAVE_DEBOUNCE + 1); });
    expect(syncSaveProject).toHaveBeenCalledTimes(2);
    composer.exportProject.mockImplementation(() => ({}));
    localStorage.removeItem("bk-unsaved-v1-site-1");
  });
});

/* REA #7: a save that failed on a server fault (5xx, generic) only scheduled
   a retry and toasted "Changes are unsaved" — no recovery copy. Close the tab
   while the server is failing and the edit existed nowhere. */
describe("autosave failing on a server error", () => {
  afterEach(() => localStorage.removeItem("bk-unsaved-v1-site-1"));

  it("keeps the local recovery copy", async () => {
    localStorage.removeItem("bk-unsaved-v1-site-1");
    vi.mocked(syncSaveProject).mockRejectedValueOnce(new Error("Internal server error"));
    await runAutosave(params());

    /* One error surface (owner 2026-10-26): the save-failed bar, no toast. */
    expect(localStorage.getItem("bk-unsaved-v1-site-1")).not.toBeNull();
  });

  it("does not keep the never-loaded fallback as a recovery copy", async () => {
    localStorage.removeItem("bk-unsaved-v1-site-1");
    vi.mocked(syncSaveProject).mockRejectedValueOnce(new Error("PROJECT_NOT_LOADED"));
    await runAutosave(params());

    expect(localStorage.getItem("bk-unsaved-v1-site-1")).toBeNull();
  });
});

/* REA #8: an edit made less than one debounce before the tab closed was lost
   — the save had not been sent, and nothing was kept. pagehide is the last
   moment the page can write; a pending, in-flight or failed save keeps the
   recovery copy there. Nothing pending writes nothing. */
describe("pagehide with work not yet on the server", () => {
  const KEY = "bk-unsaved-v1-site-1";
  afterEach(() => localStorage.removeItem(KEY));
  const hide = () => act(() => { window.dispatchEvent(new Event("pagehide")); });

  it("keeps the recovery copy for an edit still inside the debounce", () => {
    localStorage.removeItem(KEY);
    renderHook(() => useComposerInit(params()));
    act(() => { composer.emit("project:changed"); });
    hide();
    expect(localStorage.getItem(KEY)).not.toBeNull();
  });

  it("writes nothing when no edit is pending", async () => {
    localStorage.removeItem(KEY);
    vi.mocked(syncSaveProject).mockResolvedValueOnce(undefined as never);
    renderHook(() => useComposerInit(params()));
    hide();
    expect(localStorage.getItem(KEY)).toBeNull();
    act(() => { composer.emit("project:changed"); });
    await act(async () => { await vi.advanceTimersByTimeAsync(THRESHOLDS.AUTOSAVE_DEBOUNCE + 1); });
    hide();
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});

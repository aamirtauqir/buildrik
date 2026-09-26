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
import { THRESHOLDS } from "../../../../shared/constants/config";
import { useComposerInit, type UseComposerInitParams } from "../useComposerInit";

type Handler = (...args: unknown[]) => void;
const handlers: Record<string, Handler[]> = {};

const composer = {
  on: vi.fn((e: string, h: Handler) => { (handlers[e] ??= []).push(h); }),
  off: vi.fn(),
  emit: vi.fn((e: string, ...a: unknown[]) => (handlers[e] ?? []).forEach((h) => h(...a))),
  saveProject: vi.fn(() => Promise.resolve()),
  loadProject: vi.fn(() => Promise.resolve(null)),
  importProject: vi.fn(),
  exportProject: vi.fn(() => ({})),
  setProjectLoading: vi.fn(),
  isProjectLoading: vi.fn(() => false),
  elements: { getAllPages: vi.fn(() => [{ id: "p1" }]), createPage: vi.fn(), getElement: vi.fn() },
  history: { canUndo: vi.fn(() => false), canRedo: vi.fn(() => false) },
  cms: { collections: {} },
  cmsManager: {},
  migration: { run: vi.fn(({ project, currentVersion }) => ({ project, newVersion: currentVersion })) },
  aliasResolver: { validate: vi.fn(), resolve: vi.fn(), getChain: vi.fn() },
  destroy: vi.fn(),
};

vi.mock("../../../../engine", () => ({ createComposer: vi.fn(() => composer), Composer: class {} }));
vi.mock("../../../../engine/cms", () => ({
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
  it("says offline, not 'save failed', and keeps the work in the tab", async () => {
    setOnline(false);
    const p = params();
    const toasts = await runAutosave(p);

    expect(toasts.some((t) => t.title === "Offline — not saved")).toBe(true);
    expect(toasts.some((t) => t.title === "Save failed")).toBe(false);
    expect(toasts.find((t) => t.title === "Offline — not saved")?.description).toMatch(/back online/);
    // The edit is still dirty — it has not been persisted anywhere.
    expect(vi.mocked(p.setIsDirty!).mock.calls.some(([v]) => v === true)).toBe(true);
  });

  it("does not call a server refusal 'offline' when the browser is online", async () => {
    /* Measured live 2026-09-03 with navigator.onLine true at the moment of
       failure: the toast read "Offline — not saved" and told the user to wait
       until they were back online, which never arrives. The manual-save path
       already split these two facts and its comment describes this exact bug;
       autosave still ORed the regex with navigator. One rule, two copies, one
       fixed. Both paths now use the same words for the same event. */
    setOnline(true);
    const p = params();
    const toasts = await runAutosave(p);

    expect(toasts.some((t) => t.title === "Couldn't reach the server — not saved")).toBe(true);
    expect(toasts.some((t) => t.title === "Offline — not saved")).toBe(false);
    expect(
      toasts.find((t) => t.title === "Couldn't reach the server — not saved")?.description,
    ).toMatch(/try saving again/);
    expect(vi.mocked(p.setIsDirty!).mock.calls.some(([v]) => v === true)).toBe(true);
  });
});

/* A15-9: a role revoked mid-session refuses the autosave. The edit existed
   only in this tab — it is kept for the reload like a network failure's, and
   the cached role that offered the edit is dropped. */
describe("autosave refused with FORBIDDEN", () => {
  it("keeps the refused work recoverable and forgets the cached role", async () => {
    localStorage.removeItem("bk-unsaved-v1-site-1");
    vi.mocked(syncSaveProject).mockRejectedValueOnce(new Error("FORBIDDEN"));
    const p = params();
    const toasts = await runAutosave(p);

    expect(toasts.some((t) => t.title === "You don't have access to save this site")).toBe(true);
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
    const toasts = await runAutosave(params());

    expect(toasts.some((t) => t.title === "You don't have access to save this site")).toBe(true);
    expect(localStorage.getItem("bk-unsaved-v1-site-1")).not.toBeNull();
    localStorage.removeItem("bk-unsaved-v1-site-1");
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
    expect(replace).toHaveBeenCalledTimes(1);
    expect(new URL(replace.mock.calls[0][0] as string).searchParams.get("view")).toBe("readonly");
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

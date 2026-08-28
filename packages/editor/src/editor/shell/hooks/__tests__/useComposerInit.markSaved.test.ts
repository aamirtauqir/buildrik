/**
 * A dashboard autosave must tell the ENGINE it saved, not just this component.
 *
 * There are two autosave branches. Without a siteId the hook calls
 * `composer.saveProject()`, which writes through the engine's own storage and
 * announces PROJECT_SAVED. With a siteId — every real user — it hands the
 * snapshot to BuildrikSyncProvider, which persists to the dashboard and never
 * touches the composer. So `composer.isDirty()` stayed true forever and
 * `useDirtyPages`, which clears its per-page markers on PROJECT_SAVED, kept
 * every page's dirty ● lit over work that was already on the server.
 *
 * Measured live on a scratch site, 7s after an edit with no manual save: the
 * topbar read "Saved · just now", an independent second browser confirmed the
 * server had the edit, and the Pages tree still showed the page dirty. Three
 * readings of one question; the panel was the one that lied.
 *
 * @license BSD-3-Clause
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { THRESHOLDS } from "../../../../shared/constants/config";
import { useComposerInit, type UseComposerInitParams } from "../useComposerInit";

type Handler = (...args: unknown[]) => void;
const handlers: Record<string, Handler[]> = {};
const SNAPSHOT = { pages: [{ id: "p1" }] };
type SaveResult = { success: boolean; savedAt: Date };

const composer = {
  on: vi.fn((e: string, h: Handler) => { (handlers[e] ??= []).push(h); }),
  off: vi.fn(),
  emit: vi.fn((e: string, ...a: unknown[]) => (handlers[e] ?? []).forEach((h) => h(...a))),
  saveProject: vi.fn(() => Promise.resolve()),
  markSaved: vi.fn(),
  loadProject: vi.fn(() => Promise.resolve(null)),
  importProject: vi.fn(),
  exportProject: vi.fn(() => SNAPSHOT),
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

const syncSave = vi.fn(() => Promise.resolve({ success: true, savedAt: new Date() }));
vi.mock("@/services/BuildrikSyncProvider", () => ({
  /* Added with the attribution wiring: useComposerInit now reads the
     signed-in user so versions and history stop recording `userId: null`. */
  loadCurrentUserId: vi.fn(() => Promise.resolve(null)),
  getSiteIdFromUrl: vi.fn(() => "site-1"),
  loadProject: vi.fn(() => Promise.resolve({})),
  loadServerMedia: vi.fn(() => Promise.resolve(null)),
  saveProject: (...a: unknown[]) => syncSave(...(a as [])),
  SaveConflictError: class extends Error {},
}));

function params(): UseComposerInitParams {
  return {
    containerRef: { current: document.createElement("div") },
    addToast: vi.fn().mockReturnValue("t"),
    setCanUndo: vi.fn(), setCanRedo: vi.fn(), setDevice: vi.fn(), setZoom: vi.fn(),
    setShowExporter: vi.fn(), setShowComponentView: vi.fn(),
    setIsDirty: vi.fn(), setSaveState: vi.fn(),
  } as unknown as UseComposerInitParams;
}

beforeEach(() => {
  Object.keys(handlers).forEach((k) => delete handlers[k]);
  vi.clearAllMocks();
  syncSave.mockImplementation(() => Promise.resolve({ success: true, savedAt: new Date() }));
  composer.on.mockImplementation((e: string, h: Handler) => { (handlers[e] ??= []).push(h); });
  composer.emit.mockImplementation((e: string, ...a: unknown[]) => (handlers[e] ?? []).forEach((h) => h(...a)));
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

async function autosave() {
  act(() => { composer.emit("project:changed"); });
  await act(async () => { await vi.advanceTimersByTimeAsync(THRESHOLDS.AUTOSAVE_DEBOUNCE + 1); });
}

describe("dashboard autosave announces the save to the engine", () => {
  it("calls composer.markSaved once the sync save resolves", async () => {
    renderHook(() => useComposerInit(params()));
    await autosave();
    expect(syncSave).toHaveBeenCalledTimes(1);
    expect(composer.markSaved).toHaveBeenCalledTimes(1);
  });

  /* The same snapshot that was persisted, so `markSaved` does not pay for a
     second full `exportProject()` on every autosave tick — and so the event
     payload describes what actually reached the server. */
  it("hands markSaved the snapshot that was sent, not a fresh export", async () => {
    renderHook(() => useComposerInit(params()));
    await autosave();
    expect(composer.markSaved).toHaveBeenCalledWith(SNAPSHOT);
    expect(syncSave).toHaveBeenCalledWith("site-1", SNAPSHOT);
    expect(composer.exportProject).toHaveBeenCalledTimes(1);
  });

  /* A refused save is not a save. Announcing one would clear every dirty
     marker over work that never left the tab — the failure mode this whole
     fix exists to remove, only worse. */
  it("does NOT announce a save that the server refused", async () => {
    /* Built at call time, not here: a Promise.reject() created in the test body
       sits unhandled until the debounce fires, and vitest 4 reports that as an
       unhandled error even though the hook catches it. */
    syncSave.mockImplementation(() => Promise.reject(new Error("boom")));
    renderHook(() => useComposerInit(params()));
    await autosave();
    expect(composer.markSaved).not.toHaveBeenCalled();
  });

  /* Codex caught this in review. Autosave debounces at 1s but the request
     itself is a network round trip, so an edit made mid-flight is routine. If
     the older payload's resolution announces the save, every dirty marker
     clears over work that is still only in the tab — and closing the tab then
     loses it. The next debounce is already scheduled, so staying quiet costs
     nothing but one more second of an honest "saving". */
  it("does NOT announce when a newer edit landed while the save was in flight", async () => {
    let release: (v: SaveResult) => void = () => {};
    syncSave.mockImplementation(() => new Promise<SaveResult>((res) => { release = res; }));
    renderHook(() => useComposerInit(params()));

    act(() => { composer.emit("project:changed"); });
    await act(async () => { await vi.advanceTimersByTimeAsync(THRESHOLDS.AUTOSAVE_DEBOUNCE + 1); });
    expect(syncSave).toHaveBeenCalledTimes(1);

    // a second edit while the first save is still travelling
    act(() => { composer.emit("project:changed"); });
    await act(async () => { release({ success: true, savedAt: new Date() }); });

    expect(composer.markSaved).not.toHaveBeenCalled();
  });

  it("announces normally when nothing changed during the save", async () => {
    let release: (v: SaveResult) => void = () => {};
    syncSave.mockImplementation(() => new Promise<SaveResult>((res) => { release = res; }));
    renderHook(() => useComposerInit(params()));

    act(() => { composer.emit("project:changed"); });
    await act(async () => { await vi.advanceTimersByTimeAsync(THRESHOLDS.AUTOSAVE_DEBOUNCE + 1); });
    await act(async () => { release({ success: true, savedAt: new Date() }); });

    expect(composer.markSaved).toHaveBeenCalledTimes(1);
  });

  it("does not announce twice — the engine's own path already announces", async () => {
    renderHook(() => useComposerInit(params()));
    await autosave();
    expect(composer.saveProject).not.toHaveBeenCalled();
    expect(composer.markSaved).toHaveBeenCalledTimes(1);
  });
});

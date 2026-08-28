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
  SaveConflictError: class extends Error {},
}));

function params(): UseComposerInitParams {
  return {
    containerRef: { current: document.createElement("div") },
    addToast: vi.fn().mockReturnValue("t"),
    setCanUndo: vi.fn(),
    setCanRedo: vi.fn(),
    setDevice: vi.fn(),
    setZoom: vi.fn(),
    setShowExporter: vi.fn(),
    setShowComponentView: vi.fn(),
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

describe("autosave while offline", () => {
  it("says offline, not 'save failed', and keeps the work in the tab", async () => {
    const p = params();
    renderHook(() => useComposerInit(p));

    act(() => { composer.emit("project:changed"); });
    await act(async () => { await vi.advanceTimersByTimeAsync(THRESHOLDS.AUTOSAVE_DEBOUNCE + 1); });

    const toasts = vi.mocked(p.addToast!).mock.calls.map(([t]) => t as { title?: string; description?: string });
    expect(toasts.some((t) => t.title === "Offline — not saved")).toBe(true);
    expect(toasts.some((t) => t.title === "Save failed")).toBe(false);
    expect(toasts.find((t) => t.title === "Offline — not saved")?.description).toMatch(/still open in this tab/);
    // The edit is still dirty — it has not been persisted anywhere.
    expect(vi.mocked(p.setIsDirty!).mock.calls.some(([v]) => v === true)).toBe(true);
  });
});

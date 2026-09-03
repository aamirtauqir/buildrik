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

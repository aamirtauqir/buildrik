/**
 * The undo/redo BUTTONS read a React mirror of the engine's history state. That
 * mirror has to be refreshed by whatever changes the stack — and the events
 * that change it are not all named `history:*`.
 *
 * `importProject` rebuilds the tree on project load, on undo/redo internals and
 * on version restore, and emits only `project:loaded`. Without it in this list
 * the mirror keeps whatever the last history event left it as and is never
 * corrected.
 *
 * Walked live 2026-08-24 on a freshly loaded site: the command palette, which
 * calls `composer.history.canUndo()` at render time, said "nothing to undo",
 * while the canvas footer's Undo button — reading this mirror — was ENABLED and
 * did nothing when clicked. Two surfaces, one question, opposite answers. Same
 * shape as the dirty-dot bug in 768e9661.
 *
 * @license BSD-3-Clause
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EVENTS } from "@/shared/constants/events";
import { useComposerInit, type UseComposerInitParams } from "../useComposerInit";

type Handler = (...args: unknown[]) => void;
const handlers: Record<string, Handler[]> = {};
let canUndoValue = false;
let canRedoValue = false;

const composer = {
  on: vi.fn((e: string, h: Handler) => { (handlers[e] ??= []).push(h); }),
  off: vi.fn((e: string, h: Handler) => { handlers[e] = (handlers[e] ?? []).filter((x) => x !== h); }),
  emit: vi.fn((e: string, ...a: unknown[]) => (handlers[e] ?? []).forEach((h) => h(...a))),
  saveProject: vi.fn(() => Promise.resolve()),
  markSaved: vi.fn(),
  loadProject: vi.fn(() => Promise.resolve(null)),
  importProject: vi.fn(),
  exportProject: vi.fn(() => ({})),
  setProjectLoading: vi.fn(),
  isProjectLoading: vi.fn(() => false),
  elements: { getAllPages: vi.fn(() => [{ id: "p1" }]), createPage: vi.fn(), getElement: vi.fn() },
  history: { canUndo: vi.fn(() => canUndoValue), canRedo: vi.fn(() => canRedoValue) },
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
  getSiteIdFromUrl: vi.fn(() => null),
  loadProject: vi.fn(() => Promise.resolve({})),
  loadServerMedia: vi.fn(() => Promise.resolve(null)),
  saveProject: vi.fn(() => Promise.resolve({ success: true, savedAt: new Date() })),
  SaveConflictError: class extends Error {},
}));

function params(setCanUndo: ReturnType<typeof vi.fn>, setCanRedo: ReturnType<typeof vi.fn>): UseComposerInitParams {
  return {
    containerRef: { current: document.createElement("div") },
    addToast: vi.fn().mockReturnValue("t"),
    setCanUndo, setCanRedo,
    setDevice: vi.fn(), setZoom: vi.fn(), setShowExporter: vi.fn(),
    setShowComponentView: vi.fn(), setIsDirty: vi.fn(), setSaveState: vi.fn(),
  } as unknown as UseComposerInitParams;
}

beforeEach(() => {
  Object.keys(handlers).forEach((k) => delete handlers[k]);
  vi.clearAllMocks();
  canUndoValue = false; canRedoValue = false;
  composer.on.mockImplementation((e: string, h: Handler) => { (handlers[e] ??= []).push(h); });
  composer.off.mockImplementation((e: string, h: Handler) => { handlers[e] = (handlers[e] ?? []).filter((x) => x !== h); });
  composer.emit.mockImplementation((e: string, ...a: unknown[]) => (handlers[e] ?? []).forEach((h) => h(...a)));
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe("undo/redo mirror refreshes on every event that rebuilds the tree", () => {
  /* The bug: a project load leaves the mirror stale, so the footer offers an
     Undo the engine will refuse. */
  it("project:loaded refreshes canUndo", () => {
    const setCanUndo = vi.fn(), setCanRedo = vi.fn();
    canUndoValue = true;                       // engine says yes at mount
    renderHook(() => useComposerInit(params(setCanUndo, setCanRedo)));
    expect(setCanUndo).toHaveBeenLastCalledWith(true);

    canUndoValue = false;                      // ...then the load rebuilds the stack
    act(() => { composer.emit(EVENTS.PROJECT_LOADED, { importing: true }); });
    expect(setCanUndo).toHaveBeenLastCalledWith(false);
  });

  it("version:restored refreshes it too — restore goes through the same importProject", () => {
    const setCanUndo = vi.fn(), setCanRedo = vi.fn();
    canUndoValue = true;
    renderHook(() => useComposerInit(params(setCanUndo, setCanRedo)));
    canUndoValue = false;
    act(() => { composer.emit(EVENTS.VERSION_RESTORED, {}); });
    expect(setCanUndo).toHaveBeenLastCalledWith(false);
  });

  it.each(["history:undo", "history:redo", "history:recorded", "history:cleared"])(
    "%s still refreshes it",
    (event) => {
      const setCanUndo = vi.fn(), setCanRedo = vi.fn();
      renderHook(() => useComposerInit(params(setCanUndo, setCanRedo)));
      canUndoValue = true; canRedoValue = true;
      act(() => { composer.emit(event); });
      expect(setCanUndo).toHaveBeenLastCalledWith(true);
      expect(setCanRedo).toHaveBeenLastCalledWith(true);
    }
  );

  it("unsubscribes every one of them on unmount", () => {
    const { unmount } = renderHook(() => useComposerInit(params(vi.fn(), vi.fn())));
    unmount();
    for (const e of ["history:undo", "history:redo", "history:recorded", "history:cleared", EVENTS.PROJECT_LOADED, EVENTS.VERSION_RESTORED]) {
      expect(handlers[e] ?? []).toHaveLength(0);
    }
  });
});

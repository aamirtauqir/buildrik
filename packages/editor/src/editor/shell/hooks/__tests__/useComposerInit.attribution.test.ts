/**
 * Versions and history entries record WHO made them.
 *
 * They did not. `VersionTimelineManager.setCurrentUserId` and
 * `HistoryManager.setCurrentUserId` both existed with **zero callers**, so
 * `currentUserId` was permanently `null` and six write sites stamped that null
 * into stored rows (`VersionTimelineManager.ts:172,238`,
 * `HistoryManager.ts:203,213,302`). Board 162:2 attributes a row — `Ali · 8
 * changes` — and nothing could ever have satisfied it, because nothing was
 * being written.
 *
 * The lookup is deliberately fire-and-forget: attribution is additive, and an
 * editor that cannot reach the dashboard must still save versions.
 *
 * @license BSD-3-Clause
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useComposerInit, type UseComposerInitParams } from "../useComposerInit";

type EventHandler = (...args: unknown[]) => void;
const eventHandlers: Record<string, EventHandler[]> = {};

const setVersionUser = vi.fn();
const setHistoryUser = vi.fn();

const mockComposer = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  saveProject: vi.fn(() => Promise.resolve()),
  loadProject: vi.fn(() => Promise.resolve(null)),
  importProject: vi.fn(),
  setProjectLoading: vi.fn(),
  isProjectLoading: vi.fn(() => false),
  exportProject: vi.fn(() => ({ pages: [] })),
  elements: {
    getAllPages: vi.fn(() => [{ id: "page-1" }]),
    createPage: vi.fn(() => ({ root: { id: "new-root" } })),
    getElement: vi.fn(),
    importHTMLToActivePage: vi.fn(),
  },
  history: { canUndo: vi.fn(() => false), canRedo: vi.fn(() => false), setCurrentUserId: setHistoryUser },
  versions: { setProjectId: vi.fn(() => Promise.resolve()), setCurrentUserId: setVersionUser },
  components: { setProjectId: vi.fn(() => Promise.resolve()) },
  media: { importServerAssets: vi.fn(() => Promise.resolve()), setServerPage: vi.fn(), setProjectId: vi.fn() },
  cms: { collections: { setProjectId: vi.fn() } },
  migration: { run: vi.fn(({ project, currentVersion }) => ({ project, newVersion: currentVersion })) },
  destroy: vi.fn(),
};

vi.mock("../../../../engine", () => ({
  createComposer: vi.fn(() => mockComposer),
  Composer: class {},
}));
vi.mock("../../../../engine/cms", () => ({
  ProductCollectionService: function ProductCollectionServiceMock(this: unknown) {
    return {
      hasProductsCollection: vi.fn(() => Promise.resolve(false)),
      createProductsCollection: vi.fn(),
    };
  },
}));
vi.mock("@/services/AssetUploadService", () => ({ createRemoteAssetSync: vi.fn(() => ({})) }));
vi.mock("@/services/BuildrikSyncProvider", () => ({
  getSiteIdFromUrl: vi.fn(() => "site-1"),
  loadProject: vi.fn(() => Promise.resolve({})),
  loadServerMedia: vi.fn(() => Promise.resolve(null)),
  loadCurrentUserId: vi.fn(() => Promise.resolve("user-77")),
  saveProject: vi.fn(() => Promise.resolve({ success: true })),
  SaveConflictError: class extends Error {},
}));

import { loadCurrentUserId } from "@/services/BuildrikSyncProvider";

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
  };
}

const flush = (n = 5) => {
  let p: Promise<void> = Promise.resolve();
  for (let i = 0; i < n; i++) p = p.then(() => new Promise((r) => setTimeout(r, 0)));
  return p;
};

beforeEach(() => {
  Object.keys(eventHandlers).forEach((k) => delete eventHandlers[k]);
  vi.clearAllMocks();
  mockComposer.on.mockImplementation((e: string, h: EventHandler) => {
    (eventHandlers[e] ??= []).push(h);
  });
  mockComposer.emit.mockImplementation((e: string, ...a: unknown[]) =>
    (eventHandlers[e] ?? []).forEach((h) => h(...a))
  );
  vi.mocked(loadCurrentUserId).mockResolvedValue("user-77");
});

describe("editor attribution", () => {
  it("tells BOTH managers who is editing", async () => {
    renderHook(() => useComposerInit(params()));
    await act(async () => {
      mockComposer.emit("composer:ready");
      await flush();
    });
    expect(setVersionUser).toHaveBeenCalledWith("user-77");
    expect(setHistoryUser).toHaveBeenCalledWith("user-77");
  });

  /* A signed-out or offline editor still saves versions — it just cannot say
     whose they are. Stamping the string "null" would be worse than nothing. */
  it("stamps nobody when the lookup comes back empty", async () => {
    vi.mocked(loadCurrentUserId).mockResolvedValue(null);
    renderHook(() => useComposerInit(params()));
    await act(async () => {
      mockComposer.emit("composer:ready");
      await flush();
    });
    expect(setVersionUser).not.toHaveBeenCalled();
    expect(setHistoryUser).not.toHaveBeenCalled();
  });
});

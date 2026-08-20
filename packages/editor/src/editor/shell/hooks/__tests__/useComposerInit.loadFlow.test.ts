/**
 * useComposerInit.loadFlow.test.ts — gap-fill beside the base suite
 * (useComposerInit.test.ts covers debounce SSOT, DS migration, alias
 * validation, UNAUTHORIZED toast). This file covers:
 *
 *   1. siteId happy-path load: IndexedDB bucket scoping, importProject,
 *      saveState seeding (P1-3), server-media hydration, success toast.
 *   2. localStorage fallback ladder when no siteId / load fails:
 *      buildrick-project {project} → importProject,
 *      {content} → importHTMLToActivePage, empty → createPage("Page 1")
 *      + default pages from options.
 *   3. PIN §P1-2: autosave does NOT special-case SaveConflictError the
 *      way useSaveCallback does — a conflict rejection during autosave
 *      fires the generic "Save failed" toast ON TOP of the conflict
 *      dialog opened by BuildrikSyncProvider (double messaging).
 *   4. E-commerce CollectionSetupModal trigger — once per session.
 *
 * @license BSD-3-Clause
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { THRESHOLDS } from "../../../../shared/constants/config";
import { EVENTS } from "@/shared/constants/events";
import { useComposerInit, type UseComposerInitParams } from "../useComposerInit";

type EventHandler = (...args: unknown[]) => void;

const eventHandlers: Record<string, EventHandler[]> = {};

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
  history: {
    canUndo: vi.fn(() => false),
    canRedo: vi.fn(() => false),
  },
  versions: { setProjectId: vi.fn(() => Promise.resolve()) },
  components: { setProjectId: vi.fn(() => Promise.resolve()) },
  media: { importServerAssets: vi.fn(() => Promise.resolve()) },
  cms: { collections: {} },
  migration: {
    run: vi.fn(({ project, currentVersion }) => ({
      project,
      newVersion: currentVersion,
    })),
  },
  aliasResolver: { validate: vi.fn() },
  destroy: vi.fn(),
};

vi.mock("../../../../engine", () => ({
  createComposer: vi.fn(() => mockComposer),
  Composer: class {},
}));

const { hasProductsCollectionMock, createProductsCollectionMock } = vi.hoisted(() => ({
  hasProductsCollectionMock: vi.fn(),
  createProductsCollectionMock: vi.fn(),
}));

vi.mock("../../../../engine/cms", () => ({
  // Plain function (not vi.fn arrow) so `new ProductCollectionService()` is
  // constructable; returning an object overrides `this`.
  ProductCollectionService: function ProductCollectionServiceMock(this: unknown) {
    return {
      hasProductsCollection: hasProductsCollectionMock,
      createProductsCollection: createProductsCollectionMock,
    };
  },
}));

vi.mock("@/services/BuildrikSyncProvider", () => ({
  getSiteIdFromUrl: vi.fn(() => null),
  loadProject: vi.fn(() => Promise.resolve({})),
  loadServerMedia: vi.fn(() => Promise.resolve(null)),
  saveProject: vi.fn(() => Promise.resolve({ success: true })),
}));

vi.mock("@/services/AssetUploadService", () => ({
  createRemoteAssetSync: vi.fn(() => ({})),
}));

import {
  getSiteIdFromUrl,
  loadProject,
  loadServerMedia,
  saveProject as syncSaveProject,
} from "@/services/BuildrikSyncProvider";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeParams(overrides: Partial<UseComposerInitParams> = {}): UseComposerInitParams {
  return {
    containerRef: { current: document.createElement("div") },
    addToast: vi.fn().mockReturnValue("toast-id"),
    setCanUndo: vi.fn(),
    setCanRedo: vi.fn(),
    setDevice: vi.fn(),
    setZoom: vi.fn(),
    setShowExporter: vi.fn(),
    setShowComponentView: vi.fn(),
    setIsDirty: vi.fn(),
    setSaveState: vi.fn(),
    ...overrides,
  };
}

function flushMicrotasks(times = 4) {
  let p: Promise<void> = Promise.resolve();
  for (let i = 0; i < times; i++) p = p.then(() => new Promise((r) => setTimeout(r, 0)));
  return p;
}

function resetMockComposer() {
  Object.keys(eventHandlers).forEach((k) => delete eventHandlers[k]);
  vi.clearAllMocks();
  mockComposer.on.mockImplementation((event: string, handler: EventHandler) => {
    if (!eventHandlers[event]) eventHandlers[event] = [];
    eventHandlers[event].push(handler);
  });
  mockComposer.off.mockImplementation((event: string, handler: EventHandler) => {
    if (eventHandlers[event]) {
      eventHandlers[event] = eventHandlers[event].filter((h) => h !== handler);
    }
  });
  mockComposer.emit.mockImplementation((event: string, ...args: unknown[]) => {
    (eventHandlers[event] ?? []).forEach((h) => h(...args));
  });
  mockComposer.saveProject.mockReturnValue(Promise.resolve());
  mockComposer.loadProject.mockReturnValue(Promise.resolve(null));
  mockComposer.exportProject.mockReturnValue({ pages: [] });
  mockComposer.elements.getAllPages.mockReturnValue([{ id: "page-1" }]);
  mockComposer.elements.createPage.mockReturnValue({ root: { id: "new-root" } });
  mockComposer.versions.setProjectId.mockReturnValue(Promise.resolve());
  mockComposer.components.setProjectId.mockReturnValue(Promise.resolve());
  mockComposer.media.importServerAssets.mockReturnValue(Promise.resolve());
  mockComposer.migration.run.mockImplementation(({ project, currentVersion }) => ({
    project,
    newVersion: currentVersion,
  }));
  mockComposer.history.canUndo.mockReturnValue(false);
  mockComposer.history.canRedo.mockReturnValue(false);
  vi.mocked(getSiteIdFromUrl).mockReturnValue(null);
  vi.mocked(loadProject).mockResolvedValue({} as never);
  vi.mocked(loadServerMedia).mockResolvedValue(null as never);
  vi.mocked(syncSaveProject).mockResolvedValue({ success: true } as never);
  hasProductsCollectionMock.mockResolvedValue(false);
  createProductsCollectionMock.mockResolvedValue(undefined);
}

// ---------------------------------------------------------------------------
// 1. siteId happy-path load flow
// ---------------------------------------------------------------------------

describe("useComposerInit — siteId load flow (happy path)", () => {
  beforeEach(() => {
    localStorage.clear();
    resetMockComposer();
  });

  it("scopes IndexedDB buckets, imports, seeds saveState, hydrates media, toasts", async () => {
    const projectData = { pages: [{ id: "p" }], dsSchemaVersion: 0, styles: [] };
    vi.mocked(getSiteIdFromUrl).mockReturnValue("site-9");
    vi.mocked(loadProject).mockResolvedValue(projectData as never);
    vi.mocked(loadServerMedia).mockResolvedValue({
      assets: [{ id: "a1" }],
      folders: [{ id: "f1" }],
    } as never);

    const params = makeParams();
    renderHook(() => useComposerInit(params));

    await act(async () => {
      mockComposer.emit("composer:ready");
      await flushMicrotasks();
    });

    // per-site bucket scoping — prevents cross-site version/component bleed
    expect(mockComposer.versions.setProjectId).toHaveBeenCalledWith("site-9");
    expect(mockComposer.components.setProjectId).toHaveBeenCalledWith("site-9");

    expect(mockComposer.importProject).toHaveBeenCalledWith(projectData);

    // P1-3: saveState is seeded so the topbar shows "Saved · just now"
    expect(params.setSaveState).toHaveBeenCalledWith(
      expect.objectContaining({ status: "idle", lastSavedAt: expect.any(Number) }),
    );
    expect(params.setIsDirty).toHaveBeenCalledWith(false);

    expect(loadServerMedia).toHaveBeenCalledWith("site-9");
    expect(mockComposer.media.importServerAssets).toHaveBeenCalledWith(
      [{ id: "a1" }],
      [{ id: "f1" }],
    );

    expect(params.addToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Project loaded", tone: "success" }),
    );
    // the localStorage fallback must NOT also run
    expect(mockComposer.loadProject).not.toHaveBeenCalled();
  });

  it("skips media hydration when the server returns null (offline/unconfigured)", async () => {
    vi.mocked(getSiteIdFromUrl).mockReturnValue("site-9");
    vi.mocked(loadProject).mockResolvedValue({ pages: [] } as never);
    vi.mocked(loadServerMedia).mockResolvedValue(null as never);

    renderHook(() => useComposerInit(makeParams()));
    await act(async () => {
      mockComposer.emit("composer:ready");
      await flushMicrotasks();
    });

    expect(mockComposer.media.importServerAssets).not.toHaveBeenCalled();
    expect(mockComposer.importProject).toHaveBeenCalled();
  });

  it("falls back to localStorage after a (non-auth) dashboard load failure", async () => {
    vi.mocked(getSiteIdFromUrl).mockReturnValue("site-9");
    vi.mocked(loadProject).mockRejectedValue(new Error("boom 500"));
    localStorage.setItem(
      "buildrick-project",
      JSON.stringify({ project: { pages: ["local"] } }),
    );

    const params = makeParams();
    renderHook(() => useComposerInit(params));
    await act(async () => {
      mockComposer.emit("composer:ready");
      await flushMicrotasks();
    });

    expect(params.addToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Load failed", tone: "warning" }),
    );
    expect(mockComposer.importProject).toHaveBeenCalledWith({ pages: ["local"] });
  });

  /* Board 65:412. The flag is what the canvas and footer read; a load that
     fails must clear it, or the editor sits behind placeholders forever. */
  it("raises the load flag for the fetch window and clears it — even when the fetch fails", async () => {
    vi.mocked(getSiteIdFromUrl).mockReturnValue("site-9");
    vi.mocked(loadProject).mockRejectedValue(new Error("boom 500"));

    renderHook(() => useComposerInit(makeParams()));
    await act(async () => {
      mockComposer.emit("composer:ready");
      await flushMicrotasks();
    });

    expect(mockComposer.setProjectLoading.mock.calls.map(([v]) => v)).toEqual([true, false]);
  });

  it("never raises the load flag without a siteId — there is no fetch to wait for", async () => {
    vi.mocked(getSiteIdFromUrl).mockReturnValue(null);

    renderHook(() => useComposerInit(makeParams()));
    await act(async () => {
      mockComposer.emit("composer:ready");
      await flushMicrotasks();
    });

    expect(mockComposer.setProjectLoading).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 2. localStorage fallback ladder (no siteId)
// ---------------------------------------------------------------------------

describe("useComposerInit — localStorage fallback ladder", () => {
  beforeEach(() => {
    localStorage.clear();
    resetMockComposer();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("imports saved.project from buildrick-project", async () => {
    localStorage.setItem(
      "buildrick-project",
      JSON.stringify({ project: { pages: ["saved"] } }),
    );
    renderHook(() => useComposerInit(makeParams()));
    await act(async () => {
      mockComposer.emit("composer:ready");
      await flushMicrotasks();
    });
    expect(mockComposer.importProject).toHaveBeenCalledWith({ pages: ["saved"] });
    expect(mockComposer.elements.importHTMLToActivePage).not.toHaveBeenCalled();
  });

  it("imports saved.content as HTML when there is no saved.project", async () => {
    localStorage.setItem(
      "buildrick-project",
      JSON.stringify({ content: "<div>legacy html</div>" }),
    );
    renderHook(() => useComposerInit(makeParams()));
    await act(async () => {
      mockComposer.emit("composer:ready");
      await flushMicrotasks();
    });
    expect(mockComposer.elements.importHTMLToActivePage).toHaveBeenCalledWith(
      "<div>legacy html</div>",
    );
    expect(mockComposer.importProject).not.toHaveBeenCalled();
  });

  it("creates 'Page 1' when nothing is saved and the engine has no pages", async () => {
    mockComposer.elements.getAllPages.mockReturnValue([] as never);
    renderHook(() => useComposerInit(makeParams()));
    await act(async () => {
      mockComposer.emit("composer:ready");
      await flushMicrotasks();
    });
    expect(mockComposer.elements.createPage).toHaveBeenCalledWith("Page 1");
  });

  it("creates default pages from options.project.default and seeds their content", async () => {
    mockComposer.elements.getAllPages.mockReturnValue([] as never);
    const root = { setContent: vi.fn() };
    mockComposer.elements.getElement.mockReturnValue(root as never);
    renderHook(() =>
      useComposerInit(
        makeParams({
          options: {
            project: {
              default: { pages: [{ name: "About", component: "<p>about</p>" }] },
            },
          },
        }),
      ),
    );
    await act(async () => {
      mockComposer.emit("composer:ready");
      await flushMicrotasks();
    });
    expect(mockComposer.elements.createPage).toHaveBeenCalledWith("About");
    expect(root.setContent).toHaveBeenCalledWith("<p>about</p>");
  });

  it("engine loadProject success short-circuits the buildrick-project raw read", async () => {
    mockComposer.loadProject.mockReturnValue(Promise.resolve({ some: "data" }) as never);
    localStorage.setItem(
      "buildrick-project",
      JSON.stringify({ project: { pages: ["should-not-import"] } }),
    );
    renderHook(() => useComposerInit(makeParams()));
    await act(async () => {
      mockComposer.emit("composer:ready");
      await flushMicrotasks();
    });
    expect(mockComposer.importProject).not.toHaveBeenCalled();
  });

  it("ignores malformed buildrick-project JSON and still boots a page", async () => {
    mockComposer.elements.getAllPages.mockReturnValue([] as never);
    localStorage.setItem("buildrick-project", "{corrupt!!");
    renderHook(() => useComposerInit(makeParams()));
    await act(async () => {
      mockComposer.emit("composer:ready");
      await flushMicrotasks();
    });
    expect(mockComposer.elements.createPage).toHaveBeenCalledWith("Page 1");
  });
});

// ---------------------------------------------------------------------------
// 3. PIN §P1-2 — autosave conflict double-messaging
// ---------------------------------------------------------------------------

describe("useComposerInit — autosave conflict handling", () => {
  beforeEach(() => {
    localStorage.clear();
    resetMockComposer();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("PIN §P1-2: a conflict rejection during autosave STILL fires the generic 'Save failed' toast (double messaging with the conflict dialog)", async () => {
    // useSaveCallback suppresses the toast for SaveConflictError because the
    // conflict dialog (registered in BuildrikSyncProvider) already opened.
    // The autosave path in useComposerInit has NO such special case — the
    // user gets the conflict dialog AND this red toast for the same event.
    // Pinned until the autosave path learns the same instanceof check.
    const conflictErr = new Error("SaveConflictError: server copy is newer");
    conflictErr.name = "SaveConflictError";
    vi.mocked(getSiteIdFromUrl).mockReturnValue("site-9");
    vi.mocked(syncSaveProject).mockRejectedValue(conflictErr);

    const params = makeParams();
    renderHook(() => useComposerInit(params));

    act(() => {
      mockComposer.emit("project:changed");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(THRESHOLDS.AUTOSAVE_DEBOUNCE + 1);
    });

    expect(syncSaveProject).toHaveBeenCalled();
    // PIN: the generic failure toast fires even for a conflict.
    expect(params.addToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Save failed", tone: "error" }),
    );
  });

  it("autosave failure without a siteId (localStorage path) stays silent — no toast", async () => {
    mockComposer.saveProject.mockRejectedValue(new Error("quota"));
    const params = makeParams();
    renderHook(() => useComposerInit(params));

    act(() => {
      mockComposer.emit("project:changed");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(THRESHOLDS.AUTOSAVE_DEBOUNCE + 1);
    });

    expect(params.addToast).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: "Save failed" }),
    );
    // but the save state still records the error
    const errorUpdater = (params.setSaveState as Mock).mock.calls.find(
      (c: unknown[]) => typeof c[0] === "function",
    );
    expect(errorUpdater).toBeDefined();
  });

  it("autosave also triggers on history:undo / history:redo / version:restored", async () => {
    vi.mocked(getSiteIdFromUrl).mockReturnValue("site-9");
    const params = makeParams();
    renderHook(() => useComposerInit(params));

    for (const event of ["history:undo", "history:redo", "version:restored"]) {
      vi.mocked(syncSaveProject).mockClear();
      act(() => {
        mockComposer.emit(event);
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(THRESHOLDS.AUTOSAVE_DEBOUNCE + 1);
      });
      expect(syncSaveProject, `expected autosave after ${event}`).toHaveBeenCalledTimes(1);
    }
  });
});

// ---------------------------------------------------------------------------
// 4. E-commerce collection-setup trigger (once per session)
// ---------------------------------------------------------------------------

describe("useComposerInit — ecommerce CollectionSetupModal trigger", () => {
  /* These emitted `element:created` with an element typed "product-card".
     Neither half was ever true in the app: all three product blocks are
     HTML-content blocks, so they insert through `insertHTMLToElement`, which
     emits nothing and types each element from its TAG — a Product Card insert
     produced a `container`. ELEMENT_INSERTED carries the block id, which is
     the identity the prompt actually wants. */
  beforeEach(() => {
    localStorage.clear();
    resetMockComposer();
  });

  const insert = (blockId: string) =>
    mockComposer.emit(EVENTS.ELEMENT_INSERTED, { elementId: "el-1", blockId });

  it("opens collection setup when a product block is inserted and no Products collection exists", async () => {
    const openCollectionSetup = vi.fn();
    renderHook(() => useComposerInit(makeParams({ openCollectionSetup })));

    await act(async () => {
      insert("product-card");
      await flushMicrotasks();
    });

    expect(hasProductsCollectionMock).toHaveBeenCalled();
    expect(openCollectionSetup).toHaveBeenCalledTimes(1);
  });

  it("prompts only ONCE per session even for repeated product blocks", async () => {
    const openCollectionSetup = vi.fn();
    renderHook(() => useComposerInit(makeParams({ openCollectionSetup })));

    await act(async () => {
      insert("product-card");
      await flushMicrotasks();
      insert("product-grid");
      await flushMicrotasks();
      insert("product-detail");
      await flushMicrotasks();
    });

    expect(openCollectionSetup).toHaveBeenCalledTimes(1);
  });

  it("ignores every other block entirely", async () => {
    const openCollectionSetup = vi.fn();
    renderHook(() => useComposerInit(makeParams({ openCollectionSetup })));

    await act(async () => {
      insert("text");
      insert("hero");
      await flushMicrotasks();
    });

    expect(hasProductsCollectionMock).not.toHaveBeenCalled();
    expect(openCollectionSetup).not.toHaveBeenCalled();
  });

  it("does not prompt when a Products collection already exists", async () => {
    hasProductsCollectionMock.mockResolvedValue(true);
    const openCollectionSetup = vi.fn();
    renderHook(() => useComposerInit(makeParams({ openCollectionSetup })));

    await act(async () => {
      insert("product-card");
      await flushMicrotasks();
    });

    expect(openCollectionSetup).not.toHaveBeenCalled();
  });

  it("ignores an insert that carries no block id", async () => {
    const openCollectionSetup = vi.fn();
    renderHook(() => useComposerInit(makeParams({ openCollectionSetup })));

    await act(async () => {
      mockComposer.emit(EVENTS.ELEMENT_INSERTED, { elementId: "el-1" });
      await flushMicrotasks();
    });

    expect(openCollectionSetup).not.toHaveBeenCalled();
  });

  it("the confirm callback creates the Products collection and toasts", async () => {
    const openCollectionSetup = vi.fn();
    const params = makeParams({ openCollectionSetup });
    renderHook(() => useComposerInit(params));

    await act(async () => {
      insert("product-card");
      await flushMicrotasks();
    });

    const onConfirm = openCollectionSetup.mock.calls[0][0] as (
      includeSampleData: boolean,
    ) => Promise<void>;
    await act(async () => {
      await onConfirm(true);
    });

    expect(createProductsCollectionMock).toHaveBeenCalledWith(true);
    expect(params.addToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Collection Created",
        description: "Products collection created with sample data",
        tone: "success",
      }),
    );
  });

  it("never registers the listener when openCollectionSetup is not provided", async () => {
    renderHook(() => useComposerInit(makeParams()));
    await act(async () => {
      insert("product-card");
      await flushMicrotasks();
    });
    expect(hasProductsCollectionMock).not.toHaveBeenCalled();
  });
});

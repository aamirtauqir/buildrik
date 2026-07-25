import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { THRESHOLDS } from "../../../../shared/constants/config";
import { useComposerInit } from "../useComposerInit";

// ---------------------------------------------------------------------------
// Mock the engine module so createComposer returns a controlled stub.
// vi.mock() calls are hoisted by Vitest, so ordering relative to imports is safe.
// ---------------------------------------------------------------------------

type EventHandler = (...args: unknown[]) => void;

const eventHandlers: Record<string, EventHandler[]> = {};

const mockComposer = {
  on: vi.fn((event: string, handler: EventHandler) => {
    if (!eventHandlers[event]) eventHandlers[event] = [];
    eventHandlers[event].push(handler);
  }),
  off: vi.fn((event: string, handler: EventHandler) => {
    if (eventHandlers[event]) {
      eventHandlers[event] = eventHandlers[event].filter((h) => h !== handler);
    }
  }),
  emit: vi.fn((event: string, ...args: unknown[]) => {
    (eventHandlers[event] ?? []).forEach((h) => h(...args));
  }),
  saveProject: vi.fn(() => Promise.resolve()),
  loadProject: vi.fn(() => Promise.resolve(null)),
  importProject: vi.fn(),
  exportProject: vi.fn(() => ({})),
  elements: {
    getAllPages: vi.fn(() => [{ id: "page-1" }]),
    createPage: vi.fn(),
    getElement: vi.fn(),
    importHTMLToActivePage: vi.fn(),
  },
  history: {
    canUndo: vi.fn(() => false),
    canRedo: vi.fn(() => false),
  },
  cmsManager: {},
  migration: {
    run: vi.fn(({ project, currentVersion }) => ({
      project,
      newVersion: currentVersion,
    })),
  },
  aliasResolver: {
    validate: vi.fn(),
    resolve: vi.fn(),
    getChain: vi.fn(),
  },
  destroy: vi.fn(),
};

vi.mock("../../../../engine", () => ({
  createComposer: vi.fn(() => mockComposer),
  Composer: class {},
}));

vi.mock("../../../../engine/cms", () => ({
  ProductCollectionService: vi.fn(() => ({
    hasProductsCollection: vi.fn(() => Promise.resolve(false)),
  })),
}));

// Default mocks; migration tests below override per-case.
vi.mock("@/services/BuildrikSyncProvider", () => ({
  getSiteIdFromUrl: vi.fn(() => null),
  loadProject: vi.fn(() => Promise.resolve({})),
  loadServerMedia: vi.fn(() => Promise.resolve(null)),
  saveProject: vi.fn(() => Promise.resolve({ success: true, savedAt: new Date() })),
}));

vi.mock("@/services/AssetUploadService", () => ({
  createRemoteAssetSync: vi.fn(() => ({})),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContainerRef(): React.RefObject<HTMLDivElement | null> {
  const div = document.createElement("div");
  return { current: div } as React.RefObject<HTMLDivElement | null>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useComposerInit — autosave debounce SSOT", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset event handler registry and mocks between tests
    Object.keys(eventHandlers).forEach((k) => {
      delete eventHandlers[k];
    });
    vi.clearAllMocks();

    // Re-attach on/off to use the shared eventHandlers map after clearAllMocks
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
    mockComposer.elements.getAllPages.mockReturnValue([{ id: "page-1" }]);
    mockComposer.history.canUndo.mockReturnValue(false);
    mockComposer.history.canRedo.mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("saves after exactly THRESHOLDS.AUTOSAVE_DEBOUNCE ms — not after 1499 ms", () => {
    const setIsDirty = vi.fn();
    const setSaveState = vi.fn((updater) => {
      if (typeof updater === "function") updater({ status: "idle" });
    });

    renderHook(() =>
      useComposerInit({
        containerRef: makeContainerRef(),
        addToast: vi.fn(),
        setCanUndo: vi.fn(),
        setCanRedo: vi.fn(),
        setDevice: vi.fn(),
        setZoom: vi.fn(),
        setShowExporter: vi.fn(),
        setShowComponentView: vi.fn(),
        setIsDirty,
        setSaveState,
      })
    );

    // Trigger a project:changed event to kick off the debounce timer
    act(() => {
      mockComposer.emit("project:changed");
    });

    // Advance to just before the debounce fires
    act(() => {
      vi.advanceTimersByTime(THRESHOLDS.AUTOSAVE_DEBOUNCE - 1);
    });

    expect(mockComposer.saveProject).not.toHaveBeenCalled();

    // Advance the final millisecond — debounce fires now
    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(mockComposer.saveProject).toHaveBeenCalledTimes(1);
  });

  it("debounce delay equals THRESHOLDS.AUTOSAVE_DEBOUNCE (1000 ms), not the old hardcoded 1500 ms", () => {
    // Documents and enforces the SSOT: the value from config must be used.
    expect(THRESHOLDS.AUTOSAVE_DEBOUNCE).toBe(1000);

    const setIsDirty = vi.fn();
    const setSaveState = vi.fn((updater) => {
      if (typeof updater === "function") updater({ status: "idle" });
    });

    renderHook(() =>
      useComposerInit({
        containerRef: makeContainerRef(),
        addToast: vi.fn(),
        setCanUndo: vi.fn(),
        setCanRedo: vi.fn(),
        setDevice: vi.fn(),
        setZoom: vi.fn(),
        setShowExporter: vi.fn(),
        setShowComponentView: vi.fn(),
        setIsDirty,
        setSaveState,
      })
    );

    act(() => {
      mockComposer.emit("project:changed");
    });

    // Would NOT fire if debounce were still the old 1500 ms
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockComposer.saveProject).toHaveBeenCalledTimes(1);
  });

  it("debounces rapid project:changed events — saveProject called only once", () => {
    const setIsDirty = vi.fn();
    const setSaveState = vi.fn((updater) => {
      if (typeof updater === "function") updater({ status: "idle" });
    });

    renderHook(() =>
      useComposerInit({
        containerRef: makeContainerRef(),
        addToast: vi.fn(),
        setCanUndo: vi.fn(),
        setCanRedo: vi.fn(),
        setDevice: vi.fn(),
        setZoom: vi.fn(),
        setShowExporter: vi.fn(),
        setShowComponentView: vi.fn(),
        setIsDirty,
        setSaveState,
      })
    );

    // Fire 5 rapid change events, each 100 ms apart
    for (let i = 0; i < 5; i++) {
      act(() => {
        mockComposer.emit("project:changed");
        vi.advanceTimersByTime(100);
      });
    }

    // Still within debounce window after all rapid events; nothing saved yet
    expect(mockComposer.saveProject).not.toHaveBeenCalled();

    // Advance past the full debounce window from the last event
    act(() => {
      vi.advanceTimersByTime(THRESHOLDS.AUTOSAVE_DEBOUNCE);
    });

    // Despite 5 events, saveProject should have been called exactly once
    expect(mockComposer.saveProject).toHaveBeenCalledTimes(1);
  });
});

describe("useComposerInit — DS migration runs at project load (A.1)", () => {
  beforeEach(() => {
    vi.useRealTimers();
    Object.keys(eventHandlers).forEach((k) => {
      delete eventHandlers[k];
    });
    vi.clearAllMocks();
    mockComposer.on.mockImplementation((event: string, handler: EventHandler) => {
      if (!eventHandlers[event]) eventHandlers[event] = [];
      eventHandlers[event].push(handler);
    });
    mockComposer.emit.mockImplementation((event: string, ...args: unknown[]) => {
      (eventHandlers[event] ?? []).forEach((h) => h(...args));
    });
    mockComposer.elements.getAllPages.mockReturnValue([{ id: "page-1" }]);
    mockComposer.history.canUndo.mockReturnValue(false);
    mockComposer.history.canRedo.mockReturnValue(false);
    mockComposer.migration.run.mockReset();
  });

  async function flushMicrotasks() {
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
  }

  it("runs migration with loaded dsSchemaVersion + styles before importProject", async () => {
    const { getSiteIdFromUrl, loadProject } = await import("@/services/BuildrikSyncProvider");
    (getSiteIdFromUrl as ReturnType<typeof vi.fn>).mockReturnValue("site-A");
    (loadProject as ReturnType<typeof vi.fn>).mockResolvedValue({
      version: "1.0",
      pages: [],
      styles: [],
      assets: [],
      dsSchemaVersion: 0,
    });
    mockComposer.migration.run.mockReturnValue({
      project: { tokens: [{ id: "radius-sm", kind: "radius" }] },
      newVersion: 1,
    });

    renderHook(() =>
      useComposerInit({
        containerRef: makeContainerRef(),
        addToast: vi.fn(),
        setCanUndo: vi.fn(),
        setCanRedo: vi.fn(),
        setDevice: vi.fn(),
        setZoom: vi.fn(),
        setShowExporter: vi.fn(),
        setShowComponentView: vi.fn(),
        setIsDirty: vi.fn(),
        setSaveState: vi.fn(),
      })
    );

    act(() => {
      mockComposer.emit("composer:ready");
    });
    await flushMicrotasks();

    expect(mockComposer.migration.run).toHaveBeenCalledTimes(1);
    expect(mockComposer.migration.run).toHaveBeenCalledWith({
      project: { tokens: [] },
      currentVersion: 0,
      siteId: "site-A",
    });

    // importProject called once with bumped dsSchemaVersion + migrated tokens.
    expect(mockComposer.importProject).toHaveBeenCalledTimes(1);
    const imported = mockComposer.importProject.mock.calls[0][0] as {
      dsSchemaVersion: number;
      styles: unknown[];
    };
    expect(imported.dsSchemaVersion).toBe(1);
    expect(imported.styles).toEqual([{ id: "radius-sm", kind: "radius" }]);

    // Migration must run BEFORE importProject (load order invariant).
    const runOrder = mockComposer.migration.run.mock.invocationCallOrder[0];
    const importOrder = mockComposer.importProject.mock.invocationCallOrder[0];
    expect(runOrder).toBeLessThan(importOrder);
  });

  it("v=1 already-current project: no version bump, importProject gets unchanged data", async () => {
    const { getSiteIdFromUrl, loadProject } = await import("@/services/BuildrikSyncProvider");
    (getSiteIdFromUrl as ReturnType<typeof vi.fn>).mockReturnValue("site-B");
    (loadProject as ReturnType<typeof vi.fn>).mockResolvedValue({
      version: "1.0",
      pages: [],
      styles: [{ id: "radius-sm", kind: "radius" }],
      assets: [],
      dsSchemaVersion: 1,
    });
    mockComposer.migration.run.mockReturnValue({
      project: { tokens: [{ id: "radius-sm", kind: "radius" }] },
      newVersion: 1,
    });

    renderHook(() =>
      useComposerInit({
        containerRef: makeContainerRef(),
        addToast: vi.fn(),
        setCanUndo: vi.fn(),
        setCanRedo: vi.fn(),
        setDevice: vi.fn(),
        setZoom: vi.fn(),
        setShowExporter: vi.fn(),
        setShowComponentView: vi.fn(),
        setIsDirty: vi.fn(),
        setSaveState: vi.fn(),
      })
    );

    act(() => {
      mockComposer.emit("composer:ready");
    });
    await flushMicrotasks();

    expect(mockComposer.migration.run).toHaveBeenCalledTimes(1);
    const imported = mockComposer.importProject.mock.calls[0][0] as {
      dsSchemaVersion: number;
    };
    // No-op: dsSchemaVersion stays at 1 (not re-bumped, not stripped).
    expect(imported.dsSchemaVersion).toBe(1);
  });

  it("migration throw → warning toast + still imports unmigrated data", async () => {
    const { getSiteIdFromUrl, loadProject } = await import("@/services/BuildrikSyncProvider");
    (getSiteIdFromUrl as ReturnType<typeof vi.fn>).mockReturnValue("site-C");
    (loadProject as ReturnType<typeof vi.fn>).mockResolvedValue({
      version: "1.0",
      pages: [],
      styles: [],
      assets: [],
      dsSchemaVersion: 0,
    });
    mockComposer.migration.run.mockImplementation(() => {
      throw new Error("boom");
    });
    const addToast = vi.fn();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderHook(() =>
      useComposerInit({
        containerRef: makeContainerRef(),
        addToast,
        setCanUndo: vi.fn(),
        setCanRedo: vi.fn(),
        setDevice: vi.fn(),
        setZoom: vi.fn(),
        setShowExporter: vi.fn(),
        setShowComponentView: vi.fn(),
        setIsDirty: vi.fn(),
        setSaveState: vi.fn(),
      })
    );

    act(() => {
      mockComposer.emit("composer:ready");
    });
    await flushMicrotasks();

    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({ tone: "warning", title: "Project update failed" })
    );
    expect(mockComposer.importProject).toHaveBeenCalledTimes(1);
    // Imported the un-migrated data (dsSchemaVersion still 0).
    const imported = mockComposer.importProject.mock.calls[0][0] as {
      dsSchemaVersion: number;
    };
    expect(imported.dsSchemaVersion).toBe(0);
    consoleSpy.mockRestore();
  });

  it("shows a Sign in toast (not generic) when load fails with UNAUTHORIZED", async () => {
    const { getSiteIdFromUrl, loadProject } = await import(
      "@/services/BuildrikSyncProvider"
    );
    (getSiteIdFromUrl as ReturnType<typeof vi.fn>).mockReturnValue("site-auth");
    (loadProject as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error(
        "BuildrikSyncProvider.loadProject failed for site site-auth: UNAUTHORIZED"
      )
    );
    const addToast = vi.fn();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderHook(() =>
      useComposerInit({
        containerRef: makeContainerRef(),
        addToast,
        setCanUndo: vi.fn(),
        setCanRedo: vi.fn(),
        setDevice: vi.fn(),
        setZoom: vi.fn(),
        setShowExporter: vi.fn(),
        setShowComponentView: vi.fn(),
        setIsDirty: vi.fn(),
        setSaveState: vi.fn(),
      })
    );

    act(() => {
      mockComposer.emit("composer:ready");
    });
    await flushMicrotasks();

    const call = addToast.mock.calls.find(
      (c) => (c[0] as { title?: string }).title === "Session expired"
    );
    expect(call).toBeDefined();
    const toast = call![0] as { action?: { label?: string } };
    expect(toast.action?.label).toBe("Sign in");
    consoleSpy.mockRestore();
  });
});

describe("useComposerInit — alias validation runs at load (A.2)", () => {
  beforeEach(() => {
    vi.useRealTimers();
    Object.keys(eventHandlers).forEach((k) => {
      delete eventHandlers[k];
    });
    vi.clearAllMocks();
    mockComposer.on.mockImplementation((event: string, handler: EventHandler) => {
      if (!eventHandlers[event]) eventHandlers[event] = [];
      eventHandlers[event].push(handler);
    });
    mockComposer.emit.mockImplementation((event: string, ...args: unknown[]) => {
      (eventHandlers[event] ?? []).forEach((h) => h(...args));
    });
    mockComposer.elements.getAllPages.mockReturnValue([{ id: "page-1" }]);
    mockComposer.history.canUndo.mockReturnValue(false);
    mockComposer.history.canRedo.mockReturnValue(false);
    mockComposer.migration.run.mockReset();
    mockComposer.aliasResolver.validate.mockReset();
  });

  async function flushMicrotasks() {
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
  }

  it("calls aliasResolver.validate on migrated tokens AFTER migration.run", async () => {
    const { getSiteIdFromUrl, loadProject } = await import("@/services/BuildrikSyncProvider");
    (getSiteIdFromUrl as ReturnType<typeof vi.fn>).mockReturnValue("site-A2");
    (loadProject as ReturnType<typeof vi.fn>).mockResolvedValue({
      version: "1.0",
      pages: [],
      styles: [],
      assets: [],
      dsSchemaVersion: 0,
    });
    mockComposer.migration.run.mockReturnValue({
      project: { tokens: [{ id: "color-primary", aliasOf: "color-blue-500" }, { id: "color-blue-500" }] },
      newVersion: 1,
    });

    renderHook(() =>
      useComposerInit({
        containerRef: makeContainerRef(),
        addToast: vi.fn(),
        setCanUndo: vi.fn(),
        setCanRedo: vi.fn(),
        setDevice: vi.fn(),
        setZoom: vi.fn(),
        setShowExporter: vi.fn(),
        setShowComponentView: vi.fn(),
        setIsDirty: vi.fn(),
        setSaveState: vi.fn(),
      })
    );

    act(() => {
      mockComposer.emit("composer:ready");
    });
    await flushMicrotasks();

    expect(mockComposer.aliasResolver.validate).toHaveBeenCalledTimes(1);
    const validateArgs = mockComposer.aliasResolver.validate.mock.calls[0][0];
    expect(validateArgs).toEqual([
      { id: "color-primary", aliasOf: "color-blue-500" },
      { id: "color-blue-500" },
    ]);

    const migOrder = mockComposer.migration.run.mock.invocationCallOrder[0];
    const valOrder = mockComposer.aliasResolver.validate.mock.invocationCallOrder[0];
    const impOrder = mockComposer.importProject.mock.invocationCallOrder[0];
    expect(migOrder).toBeLessThan(valOrder);
    expect(valOrder).toBeLessThan(impOrder);
  });

  it("alias cycle throw → warning toast + still imports unmigrated data", async () => {
    const { getSiteIdFromUrl, loadProject } = await import("@/services/BuildrikSyncProvider");
    (getSiteIdFromUrl as ReturnType<typeof vi.fn>).mockReturnValue("site-A2-cycle");
    (loadProject as ReturnType<typeof vi.fn>).mockResolvedValue({
      version: "1.0",
      pages: [],
      styles: [{ id: "a", aliasOf: "b" }, { id: "b", aliasOf: "a" }],
      assets: [],
      dsSchemaVersion: 1,
    });
    mockComposer.migration.run.mockReturnValue({
      project: { tokens: [{ id: "a", aliasOf: "b" }, { id: "b", aliasOf: "a" }] },
      newVersion: 1,
    });
    mockComposer.aliasResolver.validate.mockImplementation(() => {
      const err = new Error("[alias-resolver] cycle detected: a → b → a");
      err.name = "AliasCycleError";
      throw err;
    });
    const addToast = vi.fn();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderHook(() =>
      useComposerInit({
        containerRef: makeContainerRef(),
        addToast,
        setCanUndo: vi.fn(),
        setCanRedo: vi.fn(),
        setDevice: vi.fn(),
        setZoom: vi.fn(),
        setShowExporter: vi.fn(),
        setShowComponentView: vi.fn(),
        setIsDirty: vi.fn(),
        setSaveState: vi.fn(),
      })
    );

    act(() => {
      mockComposer.emit("composer:ready");
    });
    await flushMicrotasks();

    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({ tone: "warning", title: "Project update failed" })
    );
    expect(mockComposer.importProject).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();
  });

  it("validate success → no toast, importProject runs as normal", async () => {
    const { getSiteIdFromUrl, loadProject } = await import("@/services/BuildrikSyncProvider");
    (getSiteIdFromUrl as ReturnType<typeof vi.fn>).mockReturnValue("site-A2-ok");
    (loadProject as ReturnType<typeof vi.fn>).mockResolvedValue({
      version: "1.0",
      pages: [],
      styles: [{ id: "a" }],
      assets: [],
      dsSchemaVersion: 1,
    });
    mockComposer.migration.run.mockReturnValue({
      project: { tokens: [{ id: "a" }] },
      newVersion: 1,
    });
    mockComposer.aliasResolver.validate.mockImplementation(() => { /* no throw */ });
    const addToast = vi.fn();

    renderHook(() =>
      useComposerInit({
        containerRef: makeContainerRef(),
        addToast,
        setCanUndo: vi.fn(),
        setCanRedo: vi.fn(),
        setDevice: vi.fn(),
        setZoom: vi.fn(),
        setShowExporter: vi.fn(),
        setShowComponentView: vi.fn(),
        setIsDirty: vi.fn(),
        setSaveState: vi.fn(),
      })
    );

    act(() => {
      mockComposer.emit("composer:ready");
    });
    await flushMicrotasks();

    expect(mockComposer.aliasResolver.validate).toHaveBeenCalledTimes(1);
    expect(addToast).not.toHaveBeenCalledWith(
      expect.objectContaining({ tone: "warning", title: "Project update failed" })
    );
    expect(mockComposer.importProject).toHaveBeenCalledTimes(1);
  });
});

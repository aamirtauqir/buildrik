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
        setShowTemplates: vi.fn(),
        setShowExporter: vi.fn(),
        setShowAI: vi.fn(),
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
        setShowTemplates: vi.fn(),
        setShowExporter: vi.fn(),
        setShowAI: vi.fn(),
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
        setShowTemplates: vi.fn(),
        setShowExporter: vi.fn(),
        setShowAI: vi.fn(),
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

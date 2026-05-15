/**
 * useEditorEventListeners.test.ts — covers the 4 composer-driven
 * side-effects + composer-null guards + cleanup-on-unmount + the
 * delayed SHOW_IN_LAYERS scroll dispatch.
 *
 * @license BSD-3-Clause
 */

import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  useEditorEventListeners,
  type UseEditorEventListenersOptions,
} from "../useEditorEventListeners";
import { EVENTS } from "../../../../shared/constants/events";

// Lightweight composer mock with on/off/emit + canvas facade. Post-D3,
// indicators live under composer.canvas.indicators.
type MockComposer = {
  elements: { getAllElements: ReturnType<typeof vi.fn> };
  canvas: { indicators: { getOverlay: ReturnType<typeof vi.fn> } | undefined } | undefined;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  emit: ReturnType<typeof vi.fn>;
  _fire: (evt: string, payload?: unknown) => void;
};

function makeComposer(elements: { id: string }[] = []): MockComposer {
  const handlers = new Map<string, Set<(payload?: unknown) => void>>();
  const composer: MockComposer = {
    elements: {
      getAllElements: vi.fn(() => elements),
    },
    canvas: {
      indicators: {
        getOverlay: vi.fn(() => ({
          showSpacing: true,
          showBadges: true,
          showGuides: true,
          showGrid: true,
        })),
      },
    },
    on: vi.fn((evt: string, h: (payload?: unknown) => void) => {
      let bag = handlers.get(evt);
      if (!bag) {
        bag = new Set();
        handlers.set(evt, bag);
      }
      bag.add(h);
    }),
    off: vi.fn((evt: string, h: (payload?: unknown) => void) => {
      handlers.get(evt)?.delete(h);
    }),
    emit: vi.fn((evt: string, payload?: unknown) => {
      handlers.get(evt)?.forEach((h) => h(payload));
    }),
    _fire: (evt: string, payload?: unknown) => {
      handlers.get(evt)?.forEach((h) => h(payload));
    },
  };
  return composer;
}

interface MockOpts {
  composer: MockComposer;
  modals: {
    openCreateComponent: ReturnType<typeof vi.fn>;
    openSaveAsComponent: ReturnType<typeof vi.fn>;
  };
  state: {
    setLeftPanelTab: ReturnType<typeof vi.fn>;
    setIsLeftPanelOpen: ReturnType<typeof vi.fn>;
    setShowSpacingIndicators: ReturnType<typeof vi.fn>;
    setShowBadges: ReturnType<typeof vi.fn>;
    setShowGuides: ReturnType<typeof vi.fn>;
    setShowGrid: ReturnType<typeof vi.fn>;
  };
  setShowWizard: ReturnType<typeof vi.fn>;
  hasManuallyToggledSpacingRef: { current: boolean };
}

function makeOpts(overrides: Partial<MockOpts> = {}): MockOpts {
  return {
    composer: overrides.composer ?? makeComposer(),
    modals:
      overrides.modals ?? {
        openCreateComponent: vi.fn(),
        openSaveAsComponent: vi.fn(),
      },
    state: overrides.state ?? {
      setLeftPanelTab: vi.fn(),
      setIsLeftPanelOpen: vi.fn(),
      setShowSpacingIndicators: vi.fn(),
      setShowBadges: vi.fn(),
      setShowGuides: vi.fn(),
      setShowGrid: vi.fn(),
    },
    setShowWizard: overrides.setShowWizard ?? vi.fn(),
    hasManuallyToggledSpacingRef:
      overrides.hasManuallyToggledSpacingRef ?? { current: false },
  };
}

function mount(opts: MockOpts) {
  return renderHook(() =>
    useEditorEventListeners(
      ({
        composer: opts.composer,
        modals: opts.modals,
        state: opts.state,
        setShowWizard: opts.setShowWizard,
        hasManuallyToggledSpacingRef: opts.hasManuallyToggledSpacingRef,
      } as unknown) as UseEditorEventListenersOptions,
    ),
  );
}

describe("useEditorEventListeners", () => {
  let opts: ReturnType<typeof makeOpts>;

  beforeEach(() => {
    opts = makeOpts();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  // 1) WIZARD HIDE ------------------------------------------------------------
  describe("PROJECT_LOADED → setShowWizard(false)", () => {
    it("does not call setShowWizard if elements are empty", () => {
      mount(opts);
      expect(opts.setShowWizard).not.toHaveBeenCalled();
    });

    it("immediately hides wizard if elements already exist (returning user)", () => {
      const composer = makeComposer([{ id: "e1" }]);
      const o = makeOpts({ composer });
      mount(o);
      expect(o.setShowWizard).toHaveBeenCalledWith(false);
    });

    it("hides wizard after PROJECT_LOADED event when elements present", () => {
      mount(opts);
      // Now mutate the elements list; emit PROJECT_LOADED triggers re-check.
      opts.composer.elements.getAllElements.mockReturnValueOnce([{ id: "added" }]);
      act(() => {
        opts.composer._fire(EVENTS.PROJECT_LOADED);
      });
      expect(opts.setShowWizard).toHaveBeenCalledWith(false);
    });

    it("registers + cleans up the PROJECT_LOADED listener", () => {
      const { unmount } = mount(opts);
      expect(opts.composer.on).toHaveBeenCalledWith(
        EVENTS.PROJECT_LOADED,
        expect.any(Function),
      );
      unmount();
      expect(opts.composer.off).toHaveBeenCalledWith(
        EVENTS.PROJECT_LOADED,
        expect.any(Function),
      );
    });
  });

  // 2) COMPONENT_CREATE_REQUESTED ---------------------------------------------
  describe("COMPONENT_CREATE_REQUESTED → modals.openCreateComponent", () => {
    it("opens create-component modal with payload elementId", () => {
      mount(opts);
      act(() => {
        opts.composer._fire(EVENTS.COMPONENT_CREATE_REQUESTED, { elementId: "el-7" });
      });
      expect(opts.modals.openCreateComponent).toHaveBeenCalledWith("el-7");
    });

    it("registers + cleans up the listener", () => {
      const { unmount } = mount(opts);
      expect(opts.composer.on).toHaveBeenCalledWith(
        EVENTS.COMPONENT_CREATE_REQUESTED,
        expect.any(Function),
      );
      unmount();
      expect(opts.composer.off).toHaveBeenCalledWith(
        EVENTS.COMPONENT_CREATE_REQUESTED,
        expect.any(Function),
      );
    });
  });

  // 3) SHOW_IN_LAYERS ----------------------------------------------------------
  describe("SHOW_IN_LAYERS → switch tab + open drawer + delayed scroll", () => {
    it("switches to layers tab and opens drawer immediately", () => {
      mount(opts);
      act(() => {
        opts.composer._fire(EVENTS.SHOW_IN_LAYERS);
      });
      expect(opts.state.setLeftPanelTab).toHaveBeenCalledWith("layers");
      expect(opts.state.setIsLeftPanelOpen).toHaveBeenCalledWith(true);
    });

    it("emits LAYERS_SCROLL_TO_SELECTION after 100ms delay", () => {
      vi.useFakeTimers();
      mount(opts);
      act(() => {
        opts.composer._fire(EVENTS.SHOW_IN_LAYERS);
      });
      // Pre-tick: scroll has not fired
      expect(opts.composer.emit).not.toHaveBeenCalledWith(
        EVENTS.LAYERS_SCROLL_TO_SELECTION,
        expect.anything(),
      );
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(opts.composer.emit).toHaveBeenCalledWith(
        EVENTS.LAYERS_SCROLL_TO_SELECTION,
        {},
      );
    });

    it("registers + cleans up the listener", () => {
      const { unmount } = mount(opts);
      expect(opts.composer.on).toHaveBeenCalledWith(
        EVENTS.SHOW_IN_LAYERS,
        expect.any(Function),
      );
      unmount();
      expect(opts.composer.off).toHaveBeenCalledWith(
        EVENTS.SHOW_IN_LAYERS,
        expect.any(Function),
      );
    });
  });

  // 4) OVERLAY DEFAULTS --------------------------------------------------------
  describe("Overlay defaults init", () => {
    it("seeds all four overlay setters from composer.canvas.indicators.getOverlay()", () => {
      mount(opts);
      expect(opts.state.setShowSpacingIndicators).toHaveBeenCalledWith(true);
      expect(opts.state.setShowBadges).toHaveBeenCalledWith(true);
      expect(opts.state.setShowGuides).toHaveBeenCalledWith(true);
      expect(opts.state.setShowGrid).toHaveBeenCalledWith(true);
    });

    it("applies defaults (false/true) when overlay fields are undefined", () => {
      const composer = makeComposer();
      composer.canvas!.indicators!.getOverlay.mockReturnValueOnce({} as Record<string, never>);
      const o = makeOpts({ composer });
      mount(o);
      // hasManuallyToggledSpacingRef.current is false → spacing default = true
      expect(o.state.setShowSpacingIndicators).toHaveBeenCalledWith(true);
      expect(o.state.setShowBadges).toHaveBeenCalledWith(false);
      expect(o.state.setShowGuides).toHaveBeenCalledWith(true);
      expect(o.state.setShowGrid).toHaveBeenCalledWith(false);
    });

    it("respects manual-toggle ref when overlay.showSpacing is undefined", () => {
      const composer = makeComposer();
      composer.canvas!.indicators!.getOverlay.mockReturnValueOnce({} as Record<string, never>);
      const o = makeOpts({
        composer,
        hasManuallyToggledSpacingRef: { current: true },
      });
      mount(o);
      // hasManuallyToggledSpacingRef.current === true → !true === false
      expect(o.state.setShowSpacingIndicators).toHaveBeenCalledWith(false);
    });

    it("does not touch overlay setters when canvas.indicators is missing", () => {
      const composer = makeComposer();
      composer.canvas!.indicators = undefined;
      const o = makeOpts({ composer });
      mount(o);
      expect(o.state.setShowSpacingIndicators).not.toHaveBeenCalled();
      expect(o.state.setShowBadges).not.toHaveBeenCalled();
    });
  });

  // COMPOSER NULL --------------------------------------------------------------
  describe("composer null guards", () => {
    it("registers no listeners when composer is null", () => {
      renderHook(() =>
        useEditorEventListeners(
          ({
            composer: null,
            modals: opts.modals,
            state: opts.state,
            setShowWizard: opts.setShowWizard,
            hasManuallyToggledSpacingRef: opts.hasManuallyToggledSpacingRef,
          } as unknown) as UseEditorEventListenersOptions,
        ),
      );
      // Cannot register anything — composer.on doesn't exist.
      expect(opts.modals.openCreateComponent).not.toHaveBeenCalled();
      expect(opts.state.setLeftPanelTab).not.toHaveBeenCalled();
      expect(opts.setShowWizard).not.toHaveBeenCalled();
      expect(opts.state.setShowSpacingIndicators).not.toHaveBeenCalled();
    });
  });
});

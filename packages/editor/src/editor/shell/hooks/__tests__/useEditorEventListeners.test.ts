/**
 * useEditorEventListeners.test.ts — covers the 4 composer-driven
 * side-effects + composer-null guards + cleanup-on-unmount.
 *
 * @license BSD-3-Clause
 */

import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  useEditorEventListeners,
  type UseEditorEventListenersOptions,
} from "../useEditorEventListeners";
import { EVENTS } from "@/shared/constants/events";

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
    setShowSpacingIndicators: ReturnType<typeof vi.fn>;
    setShowBadges: ReturnType<typeof vi.fn>;
    setShowGuides: ReturnType<typeof vi.fn>;
    setShowGrid: ReturnType<typeof vi.fn>;
  };
  addToast: ReturnType<typeof vi.fn>;
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
      setShowSpacingIndicators: vi.fn(),
      setShowBadges: vi.fn(),
      setShowGuides: vi.fn(),
      setShowGrid: vi.fn(),
    },
    addToast: overrides.addToast ?? vi.fn(() => "toast-id"),
  };
}

function mount(opts: MockOpts) {
  return renderHook(() =>
    useEditorEventListeners(
      ({
        composer: opts.composer,
        modals: opts.modals,
        state: opts.state,
        addToast: opts.addToast,
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

  /* ⌘⇧V (board 7063:78846): the chord's event opens Add on its Paste HTML
     dialog, whether or not Add is the open tab. */
  it("UI_PASTE_HTML_REQUESTED switches to Add and asks for the Paste HTML dialog", () => {
    mount(opts);
    act(() => opts.composer._fire(EVENTS.UI_PASTE_HTML_REQUESTED));
    expect(opts.composer.emit).toHaveBeenCalledWith(EVENTS.UI_SWITCH_TAB, { tab: "add" });
    expect(opts.composer.emit).toHaveBeenCalledWith(EVENTS.UI_INSERT_OPEN_PASTE_HTML, {});
  });

  // 1) COMPONENT_CREATE_REQUESTED ---------------------------------------------
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

  // ENGINE FAILURES ------------------------------------------------------------
  /* DQ-005: ERROR, STORAGE_ERROR and COMMAND_ERROR were emitted with no
     listener anywhere, so a refused command or a failed local save said
     nothing at all. */
  describe("engine failure events → one toast each", () => {
    it("a read-only refusal says the editor is view-only", () => {
      mount(opts);
      act(() =>
        opts.composer._fire(EVENTS.COMMAND_ERROR, {
          id: "delete",
          error: new Error("read-only: this command changes the document"),
        }),
      );
      expect(opts.addToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "View only", key: "engine-command-readonly" }),
      );
    });

    it("a command that throws reports it", () => {
      mount(opts);
      act(() => opts.composer._fire(EVENTS.COMMAND_ERROR, { id: "paste", error: new Error("boom") }));
      expect(opts.addToast).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "error", title: "Couldn't complete that action", description: "boom" }),
      );
    });

    it("a failed local autosave reports it", () => {
      mount(opts);
      act(() => opts.composer._fire(EVENTS.STORAGE_ERROR, { error: new Error("quota"), operation: "auto-save" }));
      expect(opts.addToast).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "error", title: "Couldn't save a local copy", description: "quota" }),
      );
    });

    it.each([
      ["save", "Couldn't save"],
      ["load", "Couldn't load the project"],
      ["init", "The editor didn't start properly"],
    ])("ERROR on %s reports it", (operation, title) => {
      mount(opts);
      act(() => opts.composer._fire(EVENTS.ERROR, { error: new Error("disk"), operation }));
      expect(opts.addToast).toHaveBeenCalledWith(expect.objectContaining({ tone: "error", title, description: "disk" }));
    });

    it("the page-root delete refusal reads as a sentence", () => {
      mount(opts);
      act(() =>
        opts.composer._fire(EVENTS.ERROR, { type: "invalid_operation", message: "Cannot delete page root element" }),
      );
      expect(opts.addToast).toHaveBeenCalledWith(
        expect.objectContaining({ description: "The page itself can't be deleted — select an element inside it." }),
      );
    });

    it("unsubscribes on unmount", () => {
      const { unmount } = mount(opts);
      unmount();
      act(() => opts.composer._fire(EVENTS.STORAGE_ERROR, { error: new Error("quota") }));
      expect(opts.addToast).not.toHaveBeenCalled();
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
      // Spacing defaults OFF (board 5936:44788 draws no padding overlay).
      expect(o.state.setShowSpacingIndicators).toHaveBeenCalledWith(false);
      expect(o.state.setShowBadges).toHaveBeenCalledWith(false);
      expect(o.state.setShowGuides).toHaveBeenCalledWith(true);
      expect(o.state.setShowGrid).toHaveBeenCalledWith(false);
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
          } as unknown) as UseEditorEventListenersOptions,
        ),
      );
      // Cannot register anything — composer.on doesn't exist.
      expect(opts.modals.openCreateComponent).not.toHaveBeenCalled();
      expect(opts.state.setShowSpacingIndicators).not.toHaveBeenCalled();
    });
  });
});

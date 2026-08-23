/**
 * useCanvasCommandPalette — open/close state, Cmd/Ctrl+Shift+P shortcut,
 * and command list construction/execution against a mocked composer.
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import type { Composer } from "../../../../engine/Composer";
import { EVENTS } from "../../../../shared/constants/events";
import { useCanvasCommandPalette } from "../useCanvasCommandPalette";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeComposer() {
  return {
    history: { undo: vi.fn(), redo: vi.fn() },
    elements: {
      duplicateElement: vi.fn(),
      removeElement: vi.fn(),
      getElement: vi.fn(() => ({ getType: () => "image" })),
    },
    selection: { selectAll: vi.fn() },
    /* Edit rows go through the registry now, not straight at elements/history. */
    commands: { run: vi.fn() },
    collab: { manager: { startSession: vi.fn().mockResolvedValue(undefined) } },
    emit: vi.fn(),
  };
}
type MockComposer = ReturnType<typeof makeComposer>;

function renderPalette(
  composer: MockComposer | null,
  { selectedId = null as string | null, clear = vi.fn() } = {}
) {
  return renderHook(() =>
    useCanvasCommandPalette({
      composer: composer as unknown as Composer,
      selectedId,
      clear,
    })
  );
}

function key(init: KeyboardEventInit): KeyboardEvent {
  return new KeyboardEvent("keydown", { bubbles: true, ...init });
}

function findCommand(result: { current: { commands: Array<{ id: string }> } }, id: string) {
  const cmd = result.current.commands.find((c) => c.id === id);
  if (!cmd) throw new Error(`command "${id}" not found`);
  return cmd as { id: string; handler: () => void; requiresSelection?: boolean };
}

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Open/close state + keyboard shortcut
// ---------------------------------------------------------------------------

describe("useCanvasCommandPalette — open/close state", () => {
  it("starts closed; openPalette/closePalette flip the flag", () => {
    const { result } = renderPalette(makeComposer());
    expect(result.current.isPaletteOpen).toBe(false);

    act(() => result.current.openPalette());
    expect(result.current.isPaletteOpen).toBe(true);

    act(() => result.current.closePalette());
    expect(result.current.isPaletteOpen).toBe(false);
  });

  it("Cmd+Shift+P toggles the palette open and closed", () => {
    const { result } = renderPalette(makeComposer());

    act(() => {
      window.dispatchEvent(key({ key: "P", metaKey: true, shiftKey: true }));
    });
    expect(result.current.isPaletteOpen).toBe(true);

    act(() => {
      window.dispatchEvent(key({ key: "P", metaKey: true, shiftKey: true }));
    });
    expect(result.current.isPaletteOpen).toBe(false);
  });

  it("Ctrl+Shift+P works as the non-mac binding", () => {
    const { result } = renderPalette(makeComposer());

    act(() => {
      window.dispatchEvent(key({ key: "P", ctrlKey: true, shiftKey: true }));
    });
    expect(result.current.isPaletteOpen).toBe(true);
  });

  it("Escape closes an open palette but is inert when closed", () => {
    const { result } = renderPalette(makeComposer());

    // closed — Escape does nothing (no crash, stays closed)
    act(() => {
      window.dispatchEvent(key({ key: "Escape" }));
    });
    expect(result.current.isPaletteOpen).toBe(false);

    act(() => result.current.openPalette());
    act(() => {
      window.dispatchEvent(key({ key: "Escape" }));
    });
    expect(result.current.isPaletteOpen).toBe(false);
  });

  it("ignores the shortcut while typing in an input/textarea", () => {
    const { result } = renderPalette(makeComposer());
    const input = document.createElement("input");
    document.body.appendChild(input);

    act(() => {
      input.dispatchEvent(key({ key: "P", metaKey: true, shiftKey: true }));
    });
    expect(result.current.isPaletteOpen).toBe(false);

    input.remove();
  });
});

// ---------------------------------------------------------------------------
// Command list + execution
// ---------------------------------------------------------------------------

describe("useCanvasCommandPalette — commands", () => {
  it("returns no commands without a composer", () => {
    const { result } = renderPalette(null);
    expect(result.current.commands).toEqual([]);
  });

  /* Rewritten 2026-08-23. These asserted that this palette reimplements the
     engine — history.undo() directly, removeElement(selectedId) directly — and
     that reimplementation is the bug: it acted on ONE element out of a
     multi-selection and wrapped nothing in a transaction, the same defect the
     ⌘K palette carried in two other rows. Edit rows run the registry now, which
     owns the multi-selection handling and the transaction. (An earlier version
     of this comment also claimed the registry owned the read-only gate — it did
     not: CommandCenter.run() had no such guard until the same day, only the
     keyboard path did. It does now.) */
  it("undo/redo run the registry commands", () => {
    const composer = makeComposer();
    const { result } = renderPalette(composer);

    findCommand(result, "undo").handler();
    findCommand(result, "redo").handler();
    expect(composer.commands.run).toHaveBeenCalledWith("undo");
    expect(composer.commands.run).toHaveBeenCalledWith("redo");
    expect(composer.history.undo).not.toHaveBeenCalled();
  });

  it("duplicate/delete run the registry commands, which take the whole selection", () => {
    const composer = makeComposer();
    const { result } = renderPalette(composer, { selectedId: "el-1" });

    const duplicate = findCommand(result, "duplicate");
    const del = findCommand(result, "delete");
    expect(duplicate.requiresSelection).toBe(true);
    expect(del.requiresSelection).toBe(true);

    duplicate.handler();
    del.handler();
    expect(composer.commands.run).toHaveBeenCalledWith("duplicate");
    expect(composer.commands.run).toHaveBeenCalledWith("delete");
    expect(composer.elements.removeElement).not.toHaveBeenCalled();
    expect(composer.elements.duplicateElement).not.toHaveBeenCalled();
  });

  /* `requiresSelection` is what greys the row; the registry commands are also
     no-ops without a selection, so the guard lives in both places on purpose. */
  it("duplicate/delete are still marked as needing a selection", () => {
    const composer = makeComposer();
    const { result } = renderPalette(composer, { selectedId: null });

    expect(findCommand(result, "duplicate").requiresSelection).toBe(true);
    expect(findCommand(result, "delete").requiresSelection).toBe(true);
  });

  it("select-all runs the registry command; deselect calls the clear prop", () => {
    const composer = makeComposer();
    const clear = vi.fn();
    const { result } = renderPalette(composer, { clear });

    /* The registry's select-all now IS selection.selectAll() — it used to select
       the page root, one container, while this row took every element. Same
       command, one meaning. */
    findCommand(result, "select-all").handler();
    expect(composer.commands.run).toHaveBeenCalledWith("select-all");

    findCommand(result, "deselect").handler();
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it("zoom commands emit the ZOOM_* events", () => {
    const composer = makeComposer();
    const { result } = renderPalette(composer);

    findCommand(result, "zoom-in").handler();
    findCommand(result, "zoom-out").handler();
    findCommand(result, "zoom-fit").handler();
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.ZOOM_IN, {});
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.ZOOM_OUT, {});
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.ZOOM_FIT, {});
  });

  it("quick-add commands emit ELEMENT_QUICK_ADD with the element type", () => {
    const composer = makeComposer();
    const { result } = renderPalette(composer);

    for (const [id, type] of [
      ["add-text", "text"],
      ["add-image", "image"],
      ["add-button", "button"],
      ["add-container", "container"],
    ] as const) {
      findCommand(result, id).handler();
      expect(composer.emit).toHaveBeenCalledWith(EVENTS.ELEMENT_QUICK_ADD, { type });
    }
  });

  it("navigation commands emit panel-open payloads", () => {
    const composer = makeComposer();
    const { result } = renderPalette(composer);

    findCommand(result, "open-analytics").handler();
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_PANEL_OPEN, {
      panel: "settings",
      screen: "analytics",
    });

    // open-seo deliberately targets the Pages tab (drawer deep-link is a follow-up)
    findCommand(result, "open-seo").handler();
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_PANEL_OPEN, { panel: "pages" });

    findCommand(result, "toggle-layers").handler();
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_TOGGLE_LAYERS, {});

    findCommand(result, "toggle-preview").handler();
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_TOGGLE_PREVIEW, {});

    findCommand(result, "browse-templates").handler();
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_BROWSE_TEMPLATES, {});
  });

  it("open-media / search-stock switch to the assets tab", () => {
    const composer = makeComposer();
    const { result } = renderPalette(composer);

    findCommand(result, "open-media").handler();
    findCommand(result, "search-stock").handler();
    const switchCalls = composer.emit.mock.calls.filter(([evt]) => evt === "ui:switch-tab");
    expect(switchCalls).toEqual([
      ["ui:switch-tab", { tab: "assets" }],
      ["ui:switch-tab", { tab: "assets" }],
    ]);
  });

  it("replace-media labels the request from the selected element's type", () => {
    const composer = makeComposer();
    composer.elements.getElement.mockReturnValue({ getType: () => "image" });
    const { result } = renderPalette(composer, { selectedId: "img-1" });

    findCommand(result, "replace-media").handler();
    expect(composer.emit).toHaveBeenCalledWith("ui:media-selection-request", {
      elementId: "img-1",
      label: "Image",
    });
  });

  it("replace-media falls back to the generic label for non-image elements and no-ops unselected", () => {
    const composer = makeComposer();
    composer.elements.getElement.mockReturnValue({ getType: () => "container" } as never);
    const { result, rerender } = renderHook(
      ({ selectedId }: { selectedId: string | null }) =>
        useCanvasCommandPalette({
          composer: composer as unknown as Composer,
          selectedId,
          clear: vi.fn(),
        }),
      { initialProps: { selectedId: "box-1" as string | null } }
    );

    findCommand(result, "replace-media").handler();
    expect(composer.emit).toHaveBeenCalledWith("ui:media-selection-request", {
      elementId: "box-1",
      label: "Element",
    });

    composer.emit.mockClear();
    rerender({ selectedId: null });
    findCommand(result, "replace-media").handler();
    expect(composer.emit).not.toHaveBeenCalled();
  });

  it("start-collab starts a session with the siteId from the URL", () => {
    const composer = makeComposer();
    const { result } = renderPalette(composer);

    window.history.pushState({}, "", "/?siteId=site-42");
    try {
      findCommand(result, "start-collab").handler();
      expect(composer.collab.manager.startSession).toHaveBeenCalledWith("site-42", "Editor");
    } finally {
      window.history.pushState({}, "", "/");
    }
  });

  it("start-collab no-ops when the URL carries no siteId", () => {
    const composer = makeComposer();
    const { result } = renderPalette(composer);

    findCommand(result, "start-collab").handler();
    expect(composer.collab.manager.startSession).not.toHaveBeenCalled();
  });

  /* Board 1177:4804 groups the palette into exactly four sections. Nine
     categories had accumulated (Add, CMS, Collaborate, Media, Navigate,
     Selection, Templates …), one of them holding a single command. */
  it("files every command under one of the board's four groups", () => {
    const { result } = renderPalette(makeComposer());
    const groups = new Set(result.current.commands.map((c) => c.category));
    expect([...groups].sort()).toEqual(["Edit", "Insert", "Tools", "View"]);
  });
});

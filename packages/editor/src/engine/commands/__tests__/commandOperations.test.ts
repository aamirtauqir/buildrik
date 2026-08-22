/**
 * engine/commands/commandOperations — nudgeSelected + reorderElement bodies
 * (the default commands' guard paths are covered in defaultCommands.test.ts;
 * this exercises the full mutation logic).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { nudgeSelected, reorderElement } from "../commandOperations";
import { EVENTS } from "@/shared/constants/events";
import type { Composer } from "../../Composer";

interface Sel {
  getId: () => string;
  setStyle: ReturnType<typeof vi.fn>;
  getParent?: () => unknown;
  insertAfter?: ReturnType<typeof vi.fn>;
  insertBefore?: ReturnType<typeof vi.fn>;
}

function makeComposer(selected: unknown, state = { snapToGrid: false, gridSize: 8 }) {
  return {
    selection: { getSelected: vi.fn(() => selected) },
    getState: vi.fn(() => state),
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    emit: vi.fn(),
  };
}

describe("nudgeSelected", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  function mountEl(id: string, style: Partial<CSSStyleDeclaration> = {}): void {
    const el = document.createElement("div");
    el.setAttribute("data-buildrick-id", id);
    Object.assign(el.style, style);
    document.body.appendChild(el);
  }

  it("is a no-op without a selection", () => {
    const composer = makeComposer(null);
    nudgeSelected(composer as unknown as Composer, 0, -1);
    expect(composer.beginTransaction).not.toHaveBeenCalled();
  });

  it("is a no-op when the selection has no DOM node", () => {
    const selected: Sel = { getId: () => "missing", setStyle: vi.fn() };
    const composer = makeComposer(selected);
    nudgeSelected(composer as unknown as Composer, 5, 0);
    expect(composer.beginTransaction).not.toHaveBeenCalled();
  });

  it("sets relative positioning for static elements and applies the delta", () => {
    mountEl("el", { position: "static" }); // explicit static (jsdom computes "" otherwise)
    const selected: Sel = { getId: () => "el", setStyle: vi.fn() };
    const composer = makeComposer(selected);

    nudgeSelected(composer as unknown as Composer, 5, -3);

    expect(selected.setStyle).toHaveBeenCalledWith("position", "relative");
    expect(selected.setStyle).toHaveBeenCalledWith("left", "5px");
    expect(selected.setStyle).toHaveBeenCalledWith("top", "-3px");
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.ELEMENT_NUDGED, {
      elementId: "el",
      deltaX: 5,
      deltaY: -3,
    });
  });

  it("does not force relative positioning when already positioned", () => {
    mountEl("el", { position: "relative", left: "20px", top: "0px" });
    const selected: Sel = { getId: () => "el", setStyle: vi.fn() };
    const composer = makeComposer(selected);

    nudgeSelected(composer as unknown as Composer, 5, 0);

    const positionCalls = selected.setStyle.mock.calls.filter(([p]) => p === "position");
    expect(positionCalls).toHaveLength(0);
    expect(selected.setStyle).toHaveBeenCalledWith("left", "25px"); // 20 + 5
  });

  it("snaps the new position to the grid when enabled", () => {
    mountEl("el");
    const selected: Sel = { getId: () => "el", setStyle: vi.fn() };
    const composer = makeComposer(selected, { snapToGrid: true, gridSize: 10 });

    nudgeSelected(composer as unknown as Composer, 13, 0); // 13 → snaps to 10

    expect(selected.setStyle).toHaveBeenCalledWith("left", "10px");
  });
});

describe("reorderElement", () => {
  interface Node {
    getId: () => string;
    insertAfter?: ReturnType<typeof vi.fn>;
    insertBefore?: ReturnType<typeof vi.fn>;
  }
  /* Siblings carry the spies now: `x.insertAfter(y)` puts Y after X, so the
     call lands on the sibling, not on the selection. */
  const node = (id: string): Node => ({
    getId: () => id,
    insertAfter: vi.fn(),
    insertBefore: vi.fn(),
  });

  function setup(selectedId: string, siblingIds: string[]) {
    const siblings = siblingIds.map(node);
    const selected = {
      getId: () => selectedId,
      getParent: () => ({ getChildren: () => siblings }),
    };
    const composer = makeComposer(selected);
    return { composer, selected, siblings };
  }

  it("is a no-op without a selection", () => {
    const composer = makeComposer(null);
    reorderElement(composer as unknown as Composer, "forward");
    expect(composer.beginTransaction).not.toHaveBeenCalled();
  });

  it("is a no-op when the element has no parent", () => {
    const selected = { getId: () => "x", getParent: () => null };
    const composer = makeComposer(selected);
    reorderElement(composer as unknown as Composer, "forward");
    expect(composer.beginTransaction).not.toHaveBeenCalled();
  });

  it("at the last position does not move but still emits", () => {
    const { composer, siblings } = setup("b", ["a", "b"]);
    reorderElement(composer as unknown as Composer, "forward");
    expect(siblings.every((sib) => !sib.insertAfter?.mock.calls.length)).toBe(true);
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.ELEMENT_REORDERED, {
      elementId: "b",
      direction: "forward",
    });
  });

  /* The four "forward calls insertAfter with sibling c" cases that used to sit
     here are gone. They mocked the very method whose behaviour was in
     question, so they passed for months over a Bring Forward that moved
     nothing and a Bring to Front that stopped one short of the end — the calls
     were being made, with the receiver and the argument the wrong way round.
     What each direction does to the ORDER is checked against a real element
     tree in `reorderElement.order.test.ts`. */
});

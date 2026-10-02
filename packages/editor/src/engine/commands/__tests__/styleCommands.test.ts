/**
 * The Inspector v4 element commands (board 30): copy / paste / reset style,
 * lock / unlock, and ⌘\ for the Inspector (board 36) — the handlers the ⋯,
 * the canvas menu and the keyboard share.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import type { Composer } from "@/engine/Composer";
import type { Element } from "@/engine/elements/Element";
import { EVENTS } from "@/shared/constants/events";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

let c: Composer;
let a: Element;
let b: Element;

beforeEach(() => {
  c = createTestComposer();
  const root = c.elements.createPage("Home").root.id;
  a = c.elements.createElement("heading", { content: "A" });
  b = c.elements.createElement("heading", { content: "B" });
  c.elements.addElement(a, root);
  c.elements.addElement(b, root);
  a = c.elements.getElement(a.getId())!;
  b = c.elements.getElement(b.getId())!;
});

const chord = (id: string) => c.commands.getAll().find((cmd) => cmd.id === id)?.shortcut;

describe("copy-style / paste-style", () => {
  it("bind ⌥⌘C / ⌥⌘V", () => {
    expect(chord("copy-style")).toBe("ctrl+alt+c");
    expect(chord("paste-style")).toBe("ctrl+alt+v");
  });

  it("copy snapshots the selected element's styles and says how many", () => {
    const copied = vi.fn();
    c.on(EVENTS.STYLES_COPIED, copied);
    a.setStyle("color", "rgb(1, 2, 3)");
    c.selection.select(a);
    c.commands.run("copy-style");
    a.setStyle("color", "rgb(9, 9, 9)");
    expect(c.styleClipboard).toEqual({ color: "rgb(1, 2, 3)" });
    expect(copied).toHaveBeenCalledWith({ count: 1 });
  });

  it("paste merges onto the selected element in one undo step", () => {
    b.setStyle("margin", "4px");
    c.styleClipboard = { color: "rgb(1, 2, 3)" };
    c.selection.select(b);
    c.history.flushPending();
    c.commands.run("paste-style");
    expect(c.elements.getElement(b.getId())!.getStyles()).toMatchObject({ color: "rgb(1, 2, 3)", margin: "4px" });
    c.history.flushPending();
    c.history.undo();
    expect(c.elements.getElement(b.getId())!.getStyles().color).toBeUndefined();
  });
});

describe("reset-style", () => {
  it("clears every style in one undo step; refused on a locked element", () => {
    a.setStyle("color", "rgb(1, 2, 3)");
    c.selection.select(a);
    c.history.flushPending();
    expect(c.commands.run("reset-style")).toBe(true);
    expect(c.elements.getElement(a.getId())!.getStyles()).toEqual({});
    c.history.flushPending();
    c.history.undo();
    const back = c.elements.getElement(a.getId())!;
    expect(back.getStyles().color).toBe("rgb(1, 2, 3)");
    back.setLocked(true);
    c.selection.select(back);
    expect(c.commands.run("reset-style")).toBe(false);
    expect(back.getStyles().color).toBe("rgb(1, 2, 3)");
  });
});

describe("lock-element / unlock-element", () => {
  it("lock the selection, or the element named in options", () => {
    c.selection.select(a);
    c.commands.run("lock-element");
    expect(c.elements.getElement(a.getId())!.isLocked()).toBe(true);
    c.commands.run("lock-element", { elementId: b.getId() });
    expect(c.elements.getElement(b.getId())!.isLocked()).toBe(true);
    c.commands.run("unlock-element", { elementId: a.getId() });
    expect(c.elements.getElement(a.getId())!.isLocked()).toBe(false);
  });
});

describe("toggle-inspector", () => {
  it("binds ⌘\\ and emits the one event the shell acts on", () => {
    expect(chord("toggle-inspector")).toBe("ctrl+\\");
    const toggled = vi.fn();
    c.on(EVENTS.UI_TOGGLE_INSPECTOR, toggled);
    c.commands.run("toggle-inspector");
    expect(toggled).toHaveBeenCalled();
  });
});

/* QA 2026-10-02: ⌘D on a locked heading made a locked copy — a new element
   the user could not edit until they unlocked it too. A lock guards THAT
   element's writes (commandOperations' lock gate); duplicating writes nothing
   to it, and the registry's Duplicate carries no lock rule. The copy is a
   fresh, editable element; the original stays locked. */
describe("duplicate of a locked element", () => {
  it("makes an editable copy, keeps the original locked, one Undo removes it", () => {
    c.selection.select(a);
    c.commands.run("lock-element");
    c.history.flushPending();
    expect(a.isLocked()).toBe(true);
    const before = c.elements.getActivePage()!.root.children?.length ?? 0;

    c.commands.run("duplicate");
    c.history.flushPending();
    const copy = c.selection.getSelected()!;
    expect(copy.getId()).not.toBe(a.getId());
    expect(copy.isLocked()).toBe(false);
    expect(c.elements.getElement(a.getId())!.isLocked()).toBe(true);

    c.history.undo();
    expect(c.elements.getElement(copy.getId())).toBeFalsy();
    expect(c.elements.getActivePage()!.root.children?.length ?? 0).toBe(before);
  });
});

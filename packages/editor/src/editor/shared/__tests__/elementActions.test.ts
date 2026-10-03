// @vitest-environment jsdom
/**
 * The one element-action registry (R-DD-8): the Inspector ⋯ is exactly
 * board 30, and the canvas menu's rows run the same handlers.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import type { Composer } from "@/engine/Composer";
import type { Element } from "@/engine/elements/Element";
import { EVENTS } from "@/shared/constants/events";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { actionLabel, ELEMENT_ACTIONS, INSPECTOR_MENU, type ElementActionContext } from "../elementActions";
import { getContextMenuActions } from "@/editor/canvas/menus/contextMenuRegistry";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

let c: Composer;
let root: string;
let h3: Element;
const add = (type: string, tag?: string): Element => {
  const el = c.elements.createElement(type as never, {} as never);
  c.elements.addElement(el, root);
  const live = c.elements.getElement(el.getId())!;
  if (tag) live.setTagName(tag);
  return live;
};
const ctxFor = (element: Element): ElementActionContext => ({ composer: c, element, isRoot: false });

beforeEach(() => {
  c = createTestComposer();
  root = c.elements.createPage("Home").root.id;
  h3 = add("heading", "h3");
  add("heading", "h3");
  add("heading", "h3");
  add("heading", "h2");
  c.selection.select(h3);
});

const visibleRows = (ctx: ElementActionContext) =>
  INSPECTOR_MENU.filter((id) => id === "---" || !ELEMENT_ACTIONS[id].isVisible || ELEMENT_ACTIONS[id].isVisible!(ctx));

describe("INSPECTOR_MENU — board 30, nothing else", () => {
  it("nine rows and two rules, in the board's order", () => {
    const ctx = ctxFor(h3);
    expect(visibleRows(ctx).map((id) => (id === "---" ? id : actionLabel(ELEMENT_ACTIONS[id], ctx)))).toEqual([
      "Duplicate",
      "Copy style",
      "Paste style",
      "Apply style to all H3 headings",
      "Reset style",
      "---",
      "Save as component…",
      "Lock",
      "---",
      "Delete",
    ]);
  });

  it("Apply style to all … carries its count as the board's muted sub-line", () => {
    expect(ELEMENT_ACTIONS["apply-style-to-page"].detail!(ctxFor(h3))).toBe("on this page (2)");
  });

  it("carries the board's keys and a danger Delete", () => {
    expect(ELEMENT_ACTIONS.duplicate.shortcut).toBe("Cmd+D");
    expect(ELEMENT_ACTIONS["copy-style"].shortcut).toBe("Cmd+Alt+C");
    expect(ELEMENT_ACTIONS["paste-style"].shortcut).toBe("Cmd+Alt+V");
    expect(ELEMENT_ACTIONS.delete.danger).toBe(true);
  });

  it("never offers the rows the redesign removed", () => {
    for (const gone of ["improve-with-ai", "bind-to-cms", "add-interaction", "replace-with-block"]) {
      expect(INSPECTOR_MENU).not.toContain(gone);
    }
  });

  it("a locked element offers Unlock in Lock's place", () => {
    h3.setLocked(true);
    const rows = visibleRows(ctxFor(h3));
    expect(rows).toContain("unlock");
    expect(rows).not.toContain("lock");
  });

  it("Apply style is disabled, with its reason, when nothing is like it (DD-6b)", () => {
    const lone = add("button");
    expect(ELEMENT_ACTIONS["apply-style-to-page"].isEnabled!(ctxFor(lone))).toBe("No other buttons on this page");
  });

  it("Apply style asks the Inspector for its confirm", () => {
    const asked = vi.fn();
    c.on(EVENTS.UI_APPLY_STYLE_REQUESTED, asked);
    ELEMENT_ACTIONS["apply-style-to-page"].run(ctxFor(h3));
    expect(asked).toHaveBeenCalledWith({ elementId: h3.getId() });
  });
});

describe("the canvas menu runs the same handlers", () => {
  const flat = (el: Element) =>
    getContextMenuActions(ctxFor(el)).flatMap((a) => [a, ...(a.submenu ?? [])]);

  it.each([
    ["duplicate", "duplicate"],
    ["delete", "delete"],
    ["copy-styles", "copy-style"],
    ["paste-styles", "paste-style"],
    ["save-as-component", "save-as-component"],
    ["lock-element", "lock"],
  ] as const)("canvas row %s is the registry's %s", (rowId, actionId) => {
    const row = flat(h3).find((a) => a.id === rowId);
    expect(row, rowId).toBeDefined();
    expect(row!.handler).toBe(ELEMENT_ACTIONS[actionId].run);
  });

  it("⌥⌘C from the canvas row and the ⋯ row fill the same clipboard", () => {
    h3.setStyle("color", "rgb(1, 2, 3)");
    flat(h3).find((a) => a.id === "copy-styles")!.handler!(ctxFor(h3));
    expect(c.styleClipboard).toEqual({ color: "rgb(1, 2, 3)" });
  });
});

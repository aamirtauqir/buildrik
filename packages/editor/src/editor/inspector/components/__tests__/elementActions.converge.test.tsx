// @vitest-environment jsdom
/**
 * P-10 — element actions behave the same from every door.
 *
 * (a) Paste style: the Inspector ⋯ and the canvas Style › Paste replaced the
 *     target's whole style map (`setStyles`), so a property the source did not
 *     carry was wiped; ⌥⌘V merged key by key. All three now run one merge.
 * (b) Duplicate: the Inspector ⋯ and the canvas menu each had their own
 *     duplicate; they now run the shared `duplicate` command (subtree pruning,
 *     whole multi-selection, clones selected).
 *
 * Driven against a real Composer.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { Composer } from "@/engine/Composer";
import type { Element } from "@/engine/elements/Element";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "@/engine/__tests__/test-utils/realComposer";
import { ToastProvider } from "@/editor/chrome-ui";
import { InspectorElementMenu } from "../InspectorElementMenu";
import { quickStyleSubmenu } from "@/editor/canvas/menus/actions/styleActions";
import { editSubmenu } from "@/editor/canvas/menus/actions/editActions";
import type { ActionContext, ContextAction } from "@/editor/canvas/menus/contextMenuRegistry";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

let composer: Composer;
let a: Element;
let b: Element;
let rootId: string;

beforeEach(() => {
  cleanup();
  composer = createTestComposer();
  const page = composer.elements.createPage("Home");
  rootId = page.root.id;
  a = composer.elements.createElement("heading", { content: "A" });
  b = composer.elements.createElement("heading", { content: "B" });
  composer.elements.addElement(a, rootId);
  composer.elements.addElement(b, rootId);
});

const openMenu = (elementId: string) => {
  render(<InspectorElementMenu composer={composer} selectedElementId={elementId} />, {
    wrapper: ToastProvider,
  });
  fireEvent.click(screen.getByRole("button", { name: /element actions/i }));
};

const action = (list: ContextAction[], id: string) => list.find((x) => x.id === id)!;
const ctx = (element: Element): ActionContext => ({ composer, element, isRoot: false });
const headingsUnderRoot = () =>
  composer.elements.getElement(rootId)!.getChildren().filter((el) => el.getType() === "heading").length;

describe("P-10a — Paste style merges from every door", () => {
  beforeEach(() => {
    b.setStyle("font-size", "40px");
    b.setStyle("color", "rgb(0, 0, 0)");
    composer.styleClipboard = { color: "rgb(255, 0, 0)" };
  });

  it("Inspector ⋯ Paste style keeps the target's own properties", () => {
    composer.selection.select(b);
    openMenu(b.getId());
    fireEvent.click(screen.getByText("Paste style"));
    expect(b.getStyles()).toMatchObject({ color: "rgb(255, 0, 0)", "font-size": "40px" });
  });

  it("canvas Style › Paste styles keeps the target's own properties", () => {
    composer.selection.select(b);
    action(quickStyleSubmenu, "paste-styles").handler!(ctx(b));
    expect(b.getStyles()).toMatchObject({ color: "rgb(255, 0, 0)", "font-size": "40px" });
  });

  it("a paste is one undo step", () => {
    composer.selection.select(b);
    composer.history.flushPending();
    action(quickStyleSubmenu, "paste-styles").handler!(ctx(b));
    composer.history.flushPending();
    composer.history.undo();
    expect(composer.elements.getElement(b.getId())!.getStyles().color).toBe("rgb(0, 0, 0)");
  });

  it("does not paste onto a locked element", () => {
    b.setLocked(true);
    composer.selection.select(b);
    action(quickStyleSubmenu, "paste-styles").handler!(ctx(b));
    expect(b.getStyles().color).toBe("rgb(0, 0, 0)");
  });
});

describe("P-10b — Duplicate runs the shared command", () => {
  it("Inspector ⋯ Duplicate runs the duplicate command", () => {
    composer.selection.select(a);
    const run = vi.spyOn(composer.commands, "run");
    openMenu(a.getId());
    fireEvent.click(screen.getByText("Duplicate"));
    expect(run).toHaveBeenCalledWith("duplicate");
    expect(headingsUnderRoot()).toBe(3);
  });

  it("canvas menu Duplicate on a multi-selection duplicates all of it, like ⌘D", () => {
    composer.selection.selectMultiple([a, b]);
    action(editSubmenu, "duplicate").handler!(ctx(a));
    expect(headingsUnderRoot()).toBe(4);
  });
});


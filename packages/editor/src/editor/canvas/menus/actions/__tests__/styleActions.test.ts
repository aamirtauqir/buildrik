// @vitest-environment jsdom
/**
 * Canvas Style › Copy styles / Paste styles — rows from the element-action
 * registry, running the copy-style / paste-style commands, so the canvas
 * menu, ⌥⌘C / ⌥⌘V and the Inspector ⋯ share one clipboard
 * (`composer.styleClipboard`) and one merge (P-10). Real Composer.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { Composer } from "@/engine/Composer";
import type { Element } from "@/engine/elements/Element";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { KeybindingManager } from "@/engine/commands";
import { quickStyleSubmenu } from "../styleActions";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

let c: Composer;
let src: Element;
let dst: Element;
const row = (id: string) => quickStyleSubmenu.find((a) => a.id === id)!;
const ctx = (element: Element) => ({ composer: c, element, isRoot: false });

beforeEach(() => {
  c = createTestComposer();
  const root = c.elements.createPage("Home").root.id;
  const a = c.elements.createElement("heading", { content: "A" });
  const b = c.elements.createElement("paragraph", { content: "B" });
  c.elements.addElement(a, root);
  c.elements.addElement(b, root);
  src = c.elements.getElement(a.getId())!;
  dst = c.elements.getElement(b.getId())!;
  src.setStyle("color", "rgb(1, 2, 3)");
});

describe("canvas Style › Copy / Paste styles", () => {
  it("Copy styles writes composer.styleClipboard", () => {
    c.selection.select(src);
    row("copy-styles").handler!(ctx(src));
    expect(c.styleClipboard).toEqual({ color: "rgb(1, 2, 3)" });
  });

  it("Paste styles is disabled until something was copied", () => {
    expect(row("paste-styles").isEnabled!(ctx(dst))).toBe(false);
    c.styleClipboard = { color: "rgb(1, 2, 3)" };
    expect(row("paste-styles").isEnabled!(ctx(dst))).toBe(true);
  });

  it("Paste styles merges onto the element", () => {
    dst.setStyle("margin", "4px");
    c.styleClipboard = { color: "rgb(1, 2, 3)" };
    c.selection.select(dst);
    row("paste-styles").handler!(ctx(dst));
    expect(c.elements.getElement(dst.getId())!.getStyles()).toMatchObject({ color: "rgb(1, 2, 3)", margin: "4px" });
  });

  it("the chords the rows print are the commands the rows run", () => {
    const keys = new KeybindingManager();
    c.commands.getAll().forEach((cmd) => keys.indexCommand(cmd));
    expect(keys.findCommandId(keys.normalizeShortcut("ctrl+alt+c"))).toBe("copy-style");
    expect(keys.findCommandId(keys.normalizeShortcut("ctrl+alt+v"))).toBe("paste-style");
    expect(row("copy-styles").shortcut).toBe("Cmd+Alt+C");
  });
});

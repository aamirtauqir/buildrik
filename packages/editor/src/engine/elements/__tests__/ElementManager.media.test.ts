/**
 * ElementManager media insertion — insertMedia / insertMediaAt.
 *
 * Covers the failure reasons (no page, no text selected), the font path,
 * target-element src replacement, coordinate placement, and the smart-insert
 * parent resolution (empty container > sibling-after > root).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { EVENTS } from "../../../shared/constants/events";
import { makeEngine, emitsOf } from "./harness";

function withPage() {
  const { composer, manager } = makeEngine();
  const page = manager.createPage("Home");
  const root = manager.getElement(page.root.id)!;
  return { composer, manager, page, root };
}

describe("insertMediaAt — failure reasons", () => {
  it("fails with no-active-page when no page exists", () => {
    const { manager } = makeEngine();
    expect(manager.insertMediaAt("https://x/a.png", "image")).toEqual({
      kind: "failed",
      reason: "no-active-page",
    });
    expect(manager.insertMedia("https://x/a.png", "image")).toBeNull();
  });

  it("font: fails with no-text-selected when nothing is selected", () => {
    const { manager } = withPage();
    expect(manager.insertMediaAt("Inter", "font")).toEqual({
      kind: "failed",
      reason: "no-text-selected",
    });
  });

  it("font: fails when only non-text elements are selected", () => {
    const { composer, manager, root } = withPage();
    const box = manager.createElement("container");
    manager.addElement(box, root.getId());
    composer.selection.getSelectedIds.mockReturnValue([box.getId()]);

    expect(manager.insertMediaAt("Inter", "font")).toEqual({
      kind: "failed",
      reason: "no-text-selected",
    });
    expect(box.getStyle("font-family")).toBeUndefined();
  });
});

describe("insertMediaAt — font application", () => {
  it("applies font-family to every selected text-bearing element", () => {
    const { composer, manager, root } = withPage();
    const title = manager.createElement("heading");
    const body = manager.createElement("paragraph");
    const box = manager.createElement("container");
    manager.addElement(title, root.getId());
    manager.addElement(body, root.getId());
    manager.addElement(box, root.getId());
    composer.selection.getSelectedIds.mockReturnValue([
      title.getId(),
      body.getId(),
      box.getId(), // ignored — not text-bearing
    ]);
    composer.emit.mockClear();

    const result = manager.insertMediaAt("Inter", "font");

    expect(result).toEqual({
      kind: "font-applied",
      elementIds: [title.getId(), body.getId()],
    });
    expect(title.getStyle("font-family")).toBe("Inter");
    expect(body.getStyle("font-family")).toBe("Inter");
    expect(box.getStyle("font-family")).toBeUndefined();

    const styleEvents = emitsOf(composer, EVENTS.ELEMENT_STYLE_UPDATED);
    expect(styleEvents).toHaveLength(1);
    expect(styleEvents[0][1]).toEqual({
      elementIds: [title.getId(), body.getId()],
      property: "font-family",
      value: "Inter",
    });
  });
});

describe("insertMediaAt — element creation", () => {
  it("creates an image under the root with src + sizing styles and emits ELEMENT_INSERTED", () => {
    const { composer, manager, root } = withPage();
    composer.emit.mockClear();

    const result = manager.insertMediaAt("https://x/a.png", "image");
    expect(result?.kind).toBe("element");
    const id = (result as { kind: "element"; elementId: string }).elementId;
    const el = manager.getElement(id)!;

    expect(el.getParent()?.getId()).toBe(root.getId());
    expect(el.getType()).toBe("image");
    expect(el.getAttribute("src")).toBe("https://x/a.png");
    expect(el.getStyle("width")).toBe("auto");
    expect(el.getStyle("max-width")).toBe("100%");

    const inserted = emitsOf(composer, EVENTS.ELEMENT_INSERTED);
    expect(inserted).toHaveLength(1);
    expect(inserted[0][1]).toEqual({ elementId: id, type: "image", src: "https://x/a.png" });
  });

  it("audio gets no image sizing styles", () => {
    const { manager } = withPage();
    const result = manager.insertMediaAt("https://x/a.mp3", "audio");
    const el = manager.getElement((result as { elementId: string }).elementId)!;
    expect(el.getType()).toBe("audio");
    expect(el.getStyle("width")).toBeUndefined();
    expect(el.getStyle("max-width")).toBeUndefined();
  });

  it("insertMedia (thin alias) returns the new element id", () => {
    const { manager } = withPage();
    const id = manager.insertMedia("https://x/a.png", "image");
    expect(id).toBeTruthy();
    expect(manager.getElement(id!)).toBeDefined();
  });
});

describe("insertMediaAt — targetElementId", () => {
  it("replaces the src attribute of the target instead of creating a new element", () => {
    const { manager, root } = withPage();
    const img = manager.createElement("image", { attributes: { src: "https://x/old.png" } });
    manager.addElement(img, root.getId());
    const countBefore = manager.getAllElements().length;

    const result = manager.insertMediaAt("https://x/new.png", "image", {
      targetElementId: img.getId(),
    });

    expect(result).toEqual({ kind: "element", elementId: img.getId() });
    expect(img.getAttribute("src")).toBe("https://x/new.png");
    expect(manager.getAllElements().length).toBe(countBefore);
  });

  it("replaces background-image when the target uses one", () => {
    const { manager, root } = withPage();
    const hero = manager.createElement("container", {
      styles: { "background-image": 'url("https://x/old.png")' },
    });
    manager.addElement(hero, root.getId());

    manager.insertMediaAt("https://x/new.png", "image", { targetElementId: hero.getId() });

    expect(hero.getStyle("background-image")).toBe("url(https://x/new.png)");
    expect(hero.getAttribute("src")).toBeUndefined();
  });

  it("falls through to creating a new element when the target does not exist", () => {
    const { manager, root } = withPage();
    const result = manager.insertMediaAt("https://x/a.png", "image", {
      targetElementId: "ghost",
    });
    expect(result?.kind).toBe("element");
    const el = manager.getElement((result as { elementId: string }).elementId)!;
    expect(el.getParent()?.getId()).toBe(root.getId());
  });
});

describe("insertMediaAt — coordinate placement", () => {
  it("x/y position the element absolutely on the page root", () => {
    const { composer, manager, root } = withPage();
    // Even with a selection, coords force root placement.
    const box = manager.createElement("container");
    manager.addElement(box, root.getId());
    composer.selection.getSelectedIds.mockReturnValue([box.getId()]);

    const result = manager.insertMediaAt("https://x/a.png", "image", { x: 40, y: 60 });
    const el = manager.getElement((result as { elementId: string }).elementId)!;

    expect(el.getParent()?.getId()).toBe(root.getId());
    expect(el.getStyle("position")).toBe("absolute");
    expect(el.getStyle("left")).toBe("40px");
    expect(el.getStyle("top")).toBe("60px");
  });

  it("coords are ignored for non-visual types (audio keeps default layout)", () => {
    const { manager } = withPage();
    const result = manager.insertMediaAt("https://x/a.mp3", "audio", { x: 40, y: 60 });
    const el = manager.getElement((result as { elementId: string }).elementId)!;
    expect(el.getStyle("position")).toBeUndefined();
    expect(el.getStyle("left")).toBeUndefined();
  });
});

describe("insertMediaAt — smart insert", () => {
  it("inserts INTO a selected empty container", () => {
    const { composer, manager, root } = withPage();
    const empty = manager.createElement("container");
    manager.addElement(empty, root.getId());
    composer.selection.getSelectedIds.mockReturnValue([empty.getId()]);

    const result = manager.insertMediaAt("https://x/a.png", "image");
    const el = manager.getElement((result as { elementId: string }).elementId)!;
    expect(el.getParent()?.getId()).toBe(empty.getId());
  });

  it("inserts AFTER a selected element that already has content", () => {
    const { composer, manager, root } = withPage();
    const first = manager.createElement("image", { attributes: { src: "https://x/1.png" } });
    const last = manager.createElement("container");
    manager.addElement(first, root.getId());
    manager.addElement(last, root.getId());
    composer.selection.getSelectedIds.mockReturnValue([first.getId()]);

    const result = manager.insertMediaAt("https://x/2.png", "image");
    const newId = (result as { elementId: string }).elementId;

    expect(root.getChildren().map((e) => e.getId())).toEqual([
      first.getId(),
      newId,
      last.getId(),
    ]);
  });

  it("defaults to the page root when nothing is selected", () => {
    const { manager, root } = withPage();
    const result = manager.insertMediaAt("https://x/a.png", "image");
    const el = manager.getElement((result as { elementId: string }).elementId)!;
    expect(el.getParent()?.getId()).toBe(root.getId());
  });
});

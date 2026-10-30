/**
 * A lock covers everything inside it (owner 2026-10-31; boards 147:77668 /
 * 147:78110 / 147:78484): a Text inside a locked Hero refuses every edit path
 * the Hero's own lock refuses, and unlocking the Hero frees it again.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { EVENTS } from "@/shared/constants/events";
import {
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
  createTestComposer,
} from "@/engine/__tests__/test-utils/realComposer";
import { canWrite, lockOwner, nudgeSelected, pasteStyles, writableElements, writeElement } from "../commandOperations";

beforeAll(() => installEngineBrowserStubs());
afterAll(() => removeEngineBrowserStubs());

function setup() {
  const c = createTestComposer();
  const page = c.elements.getActivePage() ?? c.elements.createPage("Home");
  const hero = c.elements.createElement("section", {});
  c.elements.addElement(hero, page.root.id);
  const inner = c.elements.createElement("container", {});
  c.elements.addElement(inner, hero.getId());
  const text = c.elements.createElement("text", { content: "Text" });
  c.elements.addElement(text, inner.getId());
  const other = c.elements.createElement("text", { content: "Free" });
  c.elements.addElement(other, page.root.id);
  c.elements.getElement(hero.getId())!.setLocked(true);
  const skipped = vi.fn();
  c.on(EVENTS.LOCKED_ELEMENTS_SKIPPED, skipped);
  const get = (id: string) => c.elements.getElement(id)!;
  return { c, hero: get(hero.getId()), inner: get(inner.getId()), text: get(text.getId()), other: get(other.getId()), skipped };
}

describe("lockOwner — the element whose lock covers this one", () => {
  it("is the element itself, its nearest locked ancestor, or null", () => {
    const { hero, inner, text, other } = setup();
    expect(lockOwner(hero)).toBe(hero);
    expect(lockOwner(text)).toBe(hero);
    inner.setLocked(true);
    expect(lockOwner(text)).toBe(inner);
    expect(lockOwner(other)).toBeNull();
    expect(lockOwner(null)).toBeNull();
  });

  it("unlocking the ancestor frees its descendants (147:78484)", () => {
    const { c, hero, text } = setup();
    c.commands.run("unlock-element", { elementId: hero.getId() });
    expect(lockOwner(text)).toBeNull();
    expect(canWrite(c, text.getId())).toBe(true);
  });
});

describe("every edit path refuses a descendant of a locked layer", () => {
  it("Inspector writes (writeElement / writableElements)", () => {
    const { c, text, other, skipped } = setup();
    const write = vi.fn();
    expect(writeElement(c, text, "t", write)).toBe(false);
    expect(write).not.toHaveBeenCalled();
    expect(writableElements(c, [text, other])).toEqual([other]);
    expect(skipped).toHaveBeenCalled();
  });

  it("inline text edit and drag (canWrite, the gate useCanvasInlineEdit / useCanvasElementDrag ask)", () => {
    const { c, text, other } = setup();
    expect(canWrite(c, text.getId())).toBe(false);
    expect(canWrite(c, other.getId())).toBe(true);
  });

  it("keyboard nudge", () => {
    const { c, text, skipped } = setup();
    c.selection.select(text);
    nudgeSelected(c, 1, 0);
    expect(skipped).toHaveBeenCalled();
    expect(text.getStyles().left).toBeUndefined();
  });

  it("delete (and Delete on a child picked on its own)", () => {
    const { c, text, skipped } = setup();
    c.selection.select(text);
    c.commands.run("delete");
    expect(c.elements.getElement(text.getId())).toBeTruthy();
    expect(skipped).toHaveBeenCalled();
  });

  it("cut", () => {
    const { c, text, skipped } = setup();
    c.selection.select(text);
    c.commands.run("cut");
    expect(c.elements.getElement(text.getId())).toBeTruthy();
    expect(skipped).toHaveBeenCalled();
  });

  it("duplicate — the copy would land inside the lock", () => {
    const { c, inner, text, skipped } = setup();
    c.selection.select(text);
    c.commands.run("duplicate");
    expect(c.elements.getElement(inner.getId())!.getChildren()).toHaveLength(1);
    expect(skipped).toHaveBeenCalled();
  });

  it("duplicate of the locked layer itself still works (the copy lands outside it)", () => {
    const { c, hero } = setup();
    const before = hero.getParent()!.getChildren().length;
    c.selection.select(hero);
    c.commands.run("duplicate");
    expect(hero.getParent()!.getChildren().length).toBe(before + 1);
  });

  it("paste — nothing lands inside the lock", () => {
    const { c, inner, text, other, skipped } = setup();
    c.selection.select(other);
    c.commands.run("copy");
    c.selection.select(inner);
    c.commands.run("paste");
    expect(c.elements.getElement(inner.getId())!.getChildren().map((e) => e.getId())).toEqual([text.getId()]);
    expect(skipped).toHaveBeenCalled();
  });

  it("paste style", () => {
    const { c, text } = setup();
    c.styleClipboard = { color: "red" };
    expect(pasteStyles(c, text)).toBe(0);
    c.selection.select(text);
    expect(c.commands.run("paste-style")).toBe(0);
    expect(text.getStyles().color).toBeUndefined();
  });

  it("reset style and reorder", () => {
    const { c, text, skipped } = setup();
    text.setStyle("color", "blue");
    c.selection.select(text);
    c.commands.run("reset-style");
    expect(text.getStyles().color).toBe("blue");
    c.commands.run("bring-forward");
    expect(skipped).toHaveBeenCalled();
  });

  it("CMS binding writes (setCondition)", () => {
    const { c, text, skipped } = setup();
    expect(c.cms.bindings.setCondition(text.getId(), null)).toBe(false);
    expect(skipped).toHaveBeenCalled();
  });
});

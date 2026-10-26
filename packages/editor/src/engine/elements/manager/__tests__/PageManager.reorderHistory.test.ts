/**
 * design-2l9 A-13 — a page reorder is one composer history step.
 *
 * The Pages receipts end in "Undo" (boards 137:53911, 137:59625, 127:38819,
 * 131:41086), and there is one undo (topbar / ⌘Z). So the reorder is
 * committed as its own entry the moment it happens: an edit made just before
 * it is not coalesced into it, and an Undo pressed right after it undoes the
 * reorder, not the edit before.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Composer } from "@/engine/Composer";
import {
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
  createTestComposer,
} from "@/engine/__tests__/test-utils/realComposer";

beforeEach(() => installEngineBrowserStubs());
afterEach(() => removeEngineBrowserStubs());

function setup(): { composer: Composer; a: string; b: string; c: string } {
  const composer = createTestComposer();
  const a = composer.elements.createPage("A").id;
  const b = composer.elements.createPage("B").id;
  const c = composer.elements.createPage("C").id;
  composer.history.flushPending();
  return { composer, a, b, c };
}

const order = (composer: Composer) => composer.elements.getAllPages().map((p) => p.name).join(",");

describe("PageManager.reorderPage › history (A-13)", () => {
  it("records the reorder as one undo step at once, and ⌘Z / redo walk it", () => {
    const { composer, c } = setup();
    const before = composer.history.getUndoCount();

    expect(composer.elements.reorderPage(c, null)).toBe(true);

    // Committed synchronously — no coalesce window to wait out.
    expect(composer.history.getUndoCount()).toBe(before + 1);
    expect(composer.history.canUndo()).toBe(true);
    expect(order(composer)).toBe("C,A,B");

    expect(composer.history.undo()).toBe(true);
    expect(order(composer)).toBe("A,B,C");
    expect(composer.history.redo()).toBe(true);
    expect(order(composer)).toBe("C,A,B");
  });

  it("is labelled for the History panel", () => {
    const { composer, a, b } = setup();
    composer.elements.reorderPage(a, b);
    // Newest first.
    expect(composer.history.getHistoryStack()[0].label).toBe("Reorder pages");
  });

  it("an edit made just before is its own step: one Undo reverts only the reorder", () => {
    const { composer, a, c } = setup();
    composer.elements.updatePage(a, { name: "Alpha" });
    // No flush: the rename is still inside the coalesce window.
    composer.elements.reorderPage(c, null);

    composer.history.undo();
    expect(order(composer)).toBe("Alpha,B,C");
    composer.history.undo();
    expect(order(composer)).toBe("A,B,C");
  });

  it("refused under an edit lock: no move, no history entry", () => {
    const { composer, c } = setup();
    const before = composer.history.getUndoCount();
    composer.setEditLock("view", true);
    expect(composer.elements.reorderPage(c, null)).toBe(false);
    composer.setEditLock("view", false);
    composer.history.flushPending();
    expect(composer.history.getUndoCount()).toBe(before);
    expect(order(composer)).toBe("A,B,C");
  });

  it("a reorder that does not change the order records nothing", () => {
    const { composer, a } = setup();
    const before = composer.history.getUndoCount();
    expect(composer.elements.reorderPage(a, null)).toBe(true);
    composer.history.flushPending();
    expect(composer.history.getUndoCount()).toBe(before);
  });
});

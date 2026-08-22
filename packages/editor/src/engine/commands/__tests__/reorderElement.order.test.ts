// @vitest-environment jsdom
/**
 * Z-order commands against a real element tree.
 *
 * `commandOperations.test.ts` mocks `insertAfter`/`insertBefore` and asserts
 * which sibling they were called with. That proves the arithmetic in
 * `reorderElement` and nothing about whether the element moved — the same
 * shape as the move-element bug where the index argument looked right and the
 * resulting order never changed. This asserts the ORDER after the command,
 * which is the thing the user sees.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { Composer } from "../../Composer";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "../../__tests__/test-utils/realComposer";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

let composer: Composer;
let rootId: string;
let ids: string[];

beforeEach(() => {
  composer = createTestComposer();
  const page = composer.elements.createPage("Home");
  rootId = page.root.id;
  ids = ["a", "b", "c", "d"].map(() => {
    const el = composer.elements.createElement("paragraph");
    composer.elements.addElement(el, rootId);
    return el.getId();
  });
});

/* Undo restores a whole project snapshot, so the element the old root id
   points at is a detached leftover — re-resolve the root from the ACTIVE PAGE
   every time or the tree reads as empty after any undo. */
const order = () =>
  (composer.elements.getElement(composer.elements.getActivePage()?.root?.id ?? rootId)
    ?.getChildren() ?? []).map((c) => c.getId());
const at = (i: number) => ids[i];

const runOn = (index: number, command: string) => {
  composer.selection.select(composer.elements.getElement(at(index)) ?? null);
  composer.commands.run(command);
};

describe("z-order commands move the element", () => {
  it("bring-forward swaps with the next sibling", () => {
    runOn(1, "bring-forward");
    expect(order()).toEqual([ids[0], ids[2], ids[1], ids[3]]);
  });

  it("send-backward swaps with the previous sibling", () => {
    runOn(2, "send-backward");
    expect(order()).toEqual([ids[0], ids[2], ids[1], ids[3]]);
  });

  it("bring-to-front moves to last", () => {
    runOn(0, "bring-to-front");
    expect(order()).toEqual([ids[1], ids[2], ids[3], ids[0]]);
  });

  it("send-to-back moves to first", () => {
    runOn(3, "send-to-back");
    expect(order()).toEqual([ids[3], ids[0], ids[1], ids[2]]);
  });

  it("leaves the order alone at the edges", () => {
    runOn(3, "bring-forward");
    expect(order()).toEqual(ids);
    runOn(0, "send-backward");
    expect(order()).toEqual(ids);
  });

  it("undoes as one step", () => {
    /* Flush the setup first: history coalesces on a 500ms window, so without
       this the four addElement calls and the reorder land in ONE entry and the
       undo empties the page — which reads exactly like a data-loss bug. */
    composer.history?.flushPending?.();
    runOn(1, "bring-forward");
    composer.history?.flushPending?.();
    expect(order()).toEqual([ids[0], ids[2], ids[1], ids[3]]);
    composer.history.undo();
    expect(order()).toEqual(ids);
  });
});

// @vitest-environment jsdom
/**
 * The AI `move-element` command against a REAL Composer.
 *
 * `applySetStyle.test.ts` drives the handler with a fake `moveElement`, so it
 * proves the caller's arithmetic and nothing about the engine. Reaching the
 * command the way a user does needs a model response, which this suite cannot
 * buy — but `applyAiEdit` takes a plain object, so the whole AI apply path
 * (transaction, command dispatch, history flush) can run for free against a
 * real element tree. Written 2026-08-22 after the "down" case shipped as a
 * silent no-op: idx + 1 came straight back as idx.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
/* `@/` alias — `../../` and deeper is banned (CLAUDE.md §Imports). */
import type { Composer } from "@/engine/Composer";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "@/engine/__tests__/test-utils/realComposer";
import { applyAiEdit } from "../applySetStyle";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);


function setup() {
  const composer = createTestComposer();
  const page = composer.elements.createPage("Home");
  const rootId = page.root.id;
  const ids: string[] = [];
  for (const type of ["heading", "paragraph", "paragraph", "heading"]) {
    const el = composer.elements.createElement(type as never);
    composer.elements.addElement(el, rootId);
    ids.push(el.getId());
  }
  /* History records are debounced. Without flushing here the setup mutations
     are not their own record, so the AI edit's baseline is the EMPTY project
     and one undo returns an empty page — which reads like undo wiped the site.
     Flush so the pre-move tree is a real point to come back to. */
  composer.history?.flushPending?.();
  return { composer, rootId, ids };
}

function order(composer: Composer, rootId: string): string[] {
  const root = composer.elements.getElement(rootId);
  return (root?.getChildren() ?? []).map((c) => c.getId());
}

const edit = (commandId: string, args: Record<string, unknown>) => ({
  applyOps: { commit: { commands: [{ commandId, args }] } },
});

describe("AI move-element against a real Composer", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("moves an element DOWN exactly one slot", async () => {
    const { composer, rootId, ids } = setup();
    const [a, b, c, d] = ids;
    const res = await applyAiEdit(composer, edit("move-element", { elementId: b, direction: "down" }));
    expect(res.applied).toBe(1);
    expect(order(composer, rootId)).toEqual([a, c, b, d]);
  });

  it("moves an element UP exactly one slot", async () => {
    const { composer, rootId, ids } = setup();
    const [a, b, c, d] = ids;
    const res = await applyAiEdit(composer, edit("move-element", { elementId: c, direction: "up" }));
    expect(res.applied).toBe(1);
    expect(order(composer, rootId)).toEqual([a, c, b, d]);
  });

  it("moving the LAST element down changes nothing", async () => {
    const { composer, rootId, ids } = setup();
    const before = order(composer, rootId);
    await applyAiEdit(composer, edit("move-element", { elementId: ids[3], direction: "down" }));
    expect(order(composer, rootId)).toEqual(before);
  });

  it("moving the FIRST element up changes nothing", async () => {
    const { composer, rootId, ids } = setup();
    const before = order(composer, rootId);
    await applyAiEdit(composer, edit("move-element", { elementId: ids[0], direction: "up" }));
    expect(order(composer, rootId)).toEqual(before);
  });

  /* Undo restores a project snapshot, so the element ids on the far side are
     not the ones we started with and the ORIGINAL rootId no longer resolves —
     asserting on either reports an empty tree and looks like undo wiped the
     page. Re-resolve the root from the active page and compare the shape. */
  it("a down move is ONE undo step, not two", async () => {
    const { composer, ids } = setup();
    const liveTypes = () => {
      const rid = composer.elements.getActivePage()?.root?.id;
      const root = rid ? composer.elements.getElement(rid) : null;
      return (root?.getChildren() ?? []).map((c) => c.getType());
    };
    const before = liveTypes();
    expect(before).toEqual(["heading", "paragraph", "paragraph", "heading"]);
    await applyAiEdit(composer, edit("move-element", { elementId: ids[0], direction: "down" }));
    expect(liveTypes()).toEqual(["paragraph", "heading", "paragraph", "heading"]);
    composer.history.undo();
    expect(liveTypes()).toEqual(before);
  });
});

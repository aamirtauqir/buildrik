// @vitest-environment jsdom
/**
 * applyAiEdit's integrity guarantees, against a REAL Composer + HistoryManager
 * (the mocked begin/endTransaction suites stay green while live undo breaks —
 * engine/AGENTS.md):
 *
 * - an AI write honours the element lock (the one gate in
 *   engine/commands/commandOperations.ts), and says why it refused;
 * - a batch is all-or-nothing: a command that fails rolls back every command
 *   before it, and nothing reaches history;
 * - the result carries an undo handle bound to the entry the edit recorded,
 *   or null when the edit recorded nothing.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { Composer } from "@/engine/Composer";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "@/engine/__tests__/test-utils/realComposer";
import { EVENTS } from "@/shared/constants/events";
import { applyAiEdit } from "../applySetStyle";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

function setup() {
  const composer = createTestComposer();
  const page = composer.elements.createPage("Home");
  const rootId = page.root.id;
  const ids: string[] = [];
  for (const type of ["heading", "paragraph"]) {
    const el = composer.elements.createElement(type as never, { content: `${type} copy` });
    composer.elements.addElement(el, rootId);
    ids.push(el.getId());
  }
  composer.history?.flushPending?.();
  return { composer, rootId, ids };
}

const batch = (...commands: Array<[string, Record<string, unknown>]>) => ({
  applyOps: { commit: { commands: commands.map(([commandId, args]) => ({ commandId, args })) } },
});

/** The live tree as [type, color, content] rows — ids can change across a restore. */
function liveRows(composer: Composer): string[] {
  const rid = composer.elements.getActivePage()?.root?.id;
  const root = rid ? composer.elements.getElement(rid) : null;
  return (root?.getChildren() ?? []).map(
    (c) => `${c.getType()}|${c.getStyle("color") ?? ""}|${c.getContent()}`,
  );
}

function firstChildId(composer: Composer): string {
  const rid = composer.elements.getActivePage()?.root?.id;
  return (rid ? composer.elements.getElement(rid)?.getChildren()[0]?.getId() : undefined) ?? "";
}

describe("applyAiEdit integrity (real Composer)", () => {
  beforeEach(() => localStorage.clear());

  it("refuses to write a locked element, says so, and records nothing", async () => {
    const { composer, ids } = setup();
    composer.elements.getElement(ids[0])!.setLocked(true);
    composer.history.flushPending();
    const undoBefore = composer.history.getUndoCount();
    const before = liveRows(composer);
    let skipped = 0;
    composer.on(EVENTS.LOCKED_ELEMENTS_SKIPPED, () => skipped++);

    await expect(
      applyAiEdit(composer, batch(["set-style", { elementId: ids[0], property: "color", value: "red" }])),
    ).rejects.toThrow(/locked/i);

    expect(liveRows(composer)).toEqual(before);
    expect(composer.history.getUndoCount()).toBe(undoBefore);
    expect(skipped).toBe(1);
  });

  it.each([
    ["set-text", { text: "New words" }],
    ["delete-element", {}],
    ["move-element", { direction: "down" }],
    ["set-attribute", { attribute: "title", value: "x" }],
  ])("refuses %s on a locked element", async (commandId, extra) => {
    const { composer, ids } = setup();
    composer.elements.getElement(ids[0])!.setLocked(true);
    const before = liveRows(composer);
    await expect(applyAiEdit(composer, batch([commandId, { elementId: ids[0], ...extra }]))).rejects.toThrow(/locked/i);
    expect(liveRows(composer)).toEqual(before);
  });

  it("is all-or-nothing: a failing command rolls back the ones before it", async () => {
    const { composer, ids } = setup();
    const undoBefore = composer.history.getUndoCount();
    const before = liveRows(composer);

    await expect(
      applyAiEdit(
        composer,
        batch(
          ["set-style", { elementId: ids[0], property: "color", value: "red" }],
          ["set-text", { elementId: ids[1], text: "Changed" }],
          ["delete-element", { elementId: "does-not-exist" }],
        ),
      ),
    ).rejects.toThrow(/not found/i);

    expect(liveRows(composer)).toEqual(before);
    expect(composer.history.getUndoCount()).toBe(undoBefore);
    expect(composer.isTransactionActive()).toBe(false);
    // The editor is still usable afterwards: a later edit applies and undoes.
    const ok = await applyAiEdit(
      composer,
      batch(["set-style", { elementId: firstChildId(composer), property: "color", value: "blue" }]),
    );
    expect(ok.applied).toBe(1);
    expect(ok.undo?.()).toBe(true);
    expect(liveRows(composer)).toEqual(before);
  });

  it("returns an undo handle bound to the entry the edit recorded", async () => {
    const { composer, ids } = setup();
    const before = liveRows(composer);
    const res = await applyAiEdit(composer, batch(["set-style", { elementId: ids[0], property: "color", value: "red" }]));
    expect(res.applied).toBe(1);
    expect(res.undo).toBeTypeOf("function");
    expect(res.undo!()).toBe(true);
    expect(liveRows(composer)).toEqual(before);
  });

  it("returns a null undo handle when the edit changed nothing", async () => {
    const { composer, ids } = setup();
    const undoBefore = composer.history.getUndoCount();
    // Moving the last element down is a no-op; nothing reaches history.
    const res = await applyAiEdit(composer, batch(["move-element", { elementId: ids[1], direction: "down" }]));
    expect(res.undo).toBeNull();
    expect(composer.history.getUndoCount()).toBe(undoBefore);
  });

  it("a proposal-only edit records nothing and hands the proposal back", async () => {
    const { composer } = setup();
    const res = await applyAiEdit(composer, batch(["propose-action", { actionId: "site.publish" }]));
    expect(res.proposals).toEqual([{ actionId: "site.publish" }]);
    expect(res.undo).toBeNull();
  });
  /* Undo all's contract on the real stack: two AI entries come back newest
     first; with a user edit on top, the AI handle refuses and nothing moves. */
  it("chained handles undo two AI edits in reverse, and refuse under a user edit", async () => {
    const { composer, ids } = setup();
    const before = liveRows(composer);
    const first = await applyAiEdit(composer, batch(["set-style", { elementId: ids[0], property: "color", value: "red" }]));
    const second = await applyAiEdit(composer, batch(["set-text", { elementId: ids[1], text: "AI words" }]));
    expect(second.undo!()).toBe(true);
    expect(first.undo!()).toBe(true);
    expect(liveRows(composer)).toEqual(before);

    const { composer: c2, ids: ids2 } = setup();
    const ai = await applyAiEdit(c2, batch(["set-style", { elementId: ids2[0], property: "color", value: "red" }]));
    c2.elements.getElement(firstChildId(c2))!.setContent("user edit");
    c2.history.flushPending();
    const afterUser = liveRows(c2);
    expect(ai.undo!()).toBe(false);
    expect(liveRows(c2)).toEqual(afterUser);
  });
});

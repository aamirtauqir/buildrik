/**
 * Board 171:67 (AI · done) prints a contract under the Apply button: "Apply
 * lands as ONE undo step — ⌘Z takes back all three." That is a promise about
 * behaviour, so it is worth an assertion rather than a reading.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { applyAiEdit } from "../applySetStyle";
import type { Composer } from "@/engine";

function makeComposer() {
  const calls: string[] = [];
  return {
    calls,
    composer: {
      beginTransaction: vi.fn((label: string) => calls.push(`begin:${label}`)),
      endTransaction: vi.fn(() => calls.push("end")),
      rollbackTransaction: vi.fn(() => calls.push("rollback")),
      commands: { execute: vi.fn(() => calls.push("cmd")) },
      elements: { getElement: vi.fn(() => null) },
    } as unknown as Composer,
  };
}

describe("applyAiEdit — the board's one-undo-step promise", () => {
  it("wraps the whole batch in a single transaction", async () => {
    const { composer, calls } = makeComposer();

    await applyAiEdit(composer, {
      applyOps: {
        commit: {
          commands: [
            { type: "set-style", elementId: "a", styles: { color: "red" } },
            { type: "set-style", elementId: "b", styles: { color: "blue" } },
            { type: "set-style", elementId: "c", styles: { color: "green" } },
          ],
        },
      },
    });

    expect(calls.filter((c) => c.startsWith("begin:"))).toHaveLength(1);
    expect(calls.filter((c) => c === "end")).toHaveLength(1);
    expect(calls[0]).toBe("begin:ai-edit");
    expect(calls[calls.length - 1]).toBe("end");
  });

  /* A bad element id must not split the batch — the transaction still closes,
     so the partial edit is one undoable entry rather than none. */
  it("still closes the transaction when a command throws", async () => {
    const { composer, calls } = makeComposer();

    await applyAiEdit(composer, {
      applyOps: { commit: { commands: [{ type: "not-a-command" }] } },
    });

    expect(calls).toContain("end");
    expect(calls).not.toContain("rollback");
  });
});

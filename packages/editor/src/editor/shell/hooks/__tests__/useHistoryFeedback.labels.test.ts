/**
 * Board 814:7027: an undo toast says what was undone, in the past tense —
 * "Deleted 'Button'", "Moved 'Section' to Column 2", "Fill changed on 'Hero'".
 *
 * The description table was keyed on labels this engine has never recorded.
 * Eleven of its seventeen keys (`context-delete`, `batch-style`, `text-edit`,
 * `drag-drop`, `resize` …) matched nothing, and fifty real labels matched
 * nothing in it, so they fell through to a kebab-to-Title-Case fallback. The
 * commonest undo in the editor — ⌘Z after the Delete command, whose label is
 * `delete` — therefore read "Delete": the internal label with a capital D.
 *
 * So this test does not hard-code a list. It reads the labels out of the
 * engine and the editor, the way `syncRetryToasts` reads its toasts out of the
 * hooks, and fails when a new transaction label arrives with no sentence.
 *
 * @license BSD-3-Clause
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EVENTS } from "@/shared/constants";
import { useHistoryFeedback } from "../useHistoryFeedback";

const SRC = join(__dirname, "../../../..");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name !== "__tests__" && name !== "node_modules") walk(p, out);
    } else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

/** Every label `beginTransaction` is called with, across engine and editor. */
function transactionLabels(): string[] {
  const re = /beginTransaction(?:\?\.)?\(\s*(?:[A-Za-z.]+ \|\| )?"([^"]+)"/g;
  const found = new Set<string>();
  for (const file of [...walk(join(SRC, "engine")), ...walk(join(SRC, "editor"))]) {
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(re)) found.add(m[1]);
  }
  return [...found].sort();
}

/** What the fallback would produce — the shape the board does not want. */
const titleCased = (label: string) =>
  label.includes(" ")
    ? label
    : label.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

function describeUndo(label: string): string {
  const addToast = vi.fn();
  const handlers: Record<string, ((d?: unknown) => void)[]> = {};
  const composer = {
    on: (e: string, h: (d?: unknown) => void) => { (handlers[e] ??= []).push(h); },
    off: () => {},
    history: { undo: vi.fn(), redo: vi.fn() },
  };
  renderHook(() => useHistoryFeedback(composer as never, addToast as never));
  handlers[EVENTS.HISTORY_UNDO]?.forEach((h) => h({ entry: { label } }));
  return (addToast.mock.calls[0][0] as { description: string }).description;
}

describe("undo toasts say what was undone", () => {
  it("finds the transaction labels it is checking", () => {
    /* A run that resolves no labels would pass the next test vacuously —
       the same shape as a suite that loads no files. */
    expect(transactionLabels().length).toBeGreaterThan(40);
  });

  it("…and would catch one that had none", () => {
    /* The check above is an equality against a fallback. Watched to fail:
       a label nothing maps still comes back as its own Title-Cased name. */
    expect(describeUndo("wrap-element")).toBe(titleCased("wrap-element"));
  });

  it("every recorded transaction label has a past-tense sentence", () => {
    const raw = transactionLabels().filter((l) => describeUndo(l) === titleCased(l));
    expect(raw, `unmapped labels fall through to the internal name: ${raw.join(", ")}`)
      .toEqual([]);
  });

  it("the Delete command reads as a sentence, not as its own label", () => {
    /* `defaultCommands.ts` records "delete", never "delete-element", which is
       what the old table was keyed on. */
    expect(describeUndo("delete")).toBe("Deleted element");
    expect(describeUndo("nudge")).toBe("Moved element");
    expect(describeUndo("insert-block-drop")).toBe("Added block");
  });

  it("leaves a label that is already a sentence alone", () => {
    /* HistoryManager's own restore label. Kebab-splitting it gave
       "Restored To: Checkpoint". */
    expect(describeUndo("Restored to: Checkpoint")).toBe("Restored to: Checkpoint");
  });

  it("still names the action when the entry carries no label", () => {
    expect(describeUndo("")).toBe("last action");
  });
});

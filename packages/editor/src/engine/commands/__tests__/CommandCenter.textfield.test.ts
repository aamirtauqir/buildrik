/**
 * Regression: mod-key shortcuts must not hijack text editing or reach past a modal.
 *
 * The engine's keybinding listener sits on `window` in the CAPTURE phase, so it
 * runs before anything in the document tree and nothing downstream can stop it
 * — a modal calling stopPropagation does not help. It also calls
 * preventDefault(). Before the guard in CommandCenter.shouldHandleShortcut,
 * every ⌘/⌃ chord was treated as the canvas's, so while the user typed in a
 * page-rename field, the media search box or the "Type DELETE to confirm" gate:
 *
 *   ⌘A  selected every element on the canvas instead of the text
 *   ⌘Z  undid a canvas operation instead of the typo
 *   ⌘X  cut the selected element out of the document
 *
 * ⌘S and the other app-level chords must keep working mid-sentence, which is
 * why the guard is per-command rather than a blanket "ignore mod keys in inputs".
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { CommandCenter } from "../CommandCenter";

const mod = (key: string, extra: KeyboardEventInit = {}) =>
  new KeyboardEvent("keydown", {
    key,
    metaKey: true,
    bubbles: true,
    cancelable: true,
    ...extra,
  });

function makeCenter() {
  // CommandCenter only needs a composer shape for command execution; the guard
  // under test runs before any command body does.
  const composer = { emit: vi.fn(), on: vi.fn(), off: vi.fn() } as never;
  return new CommandCenter(composer);
}

describe("CommandCenter — mod chords aimed at a text field", () => {
  let center: ReturnType<typeof makeCenter>;
  let input: HTMLInputElement;
  let guard: (e: KeyboardEvent, id: string) => boolean;

  beforeEach(() => {
    center = makeCenter();
    // The guard is private by design; the listener is what exercises it in
    // production, so reach it directly rather than simulating the whole stack.
    guard = (center as never as {
      shouldHandleShortcut(e: KeyboardEvent, id: string): boolean;
    }).shouldHandleShortcut.bind(center);

    input = document.createElement("input");
    input.type = "text";
    document.body.appendChild(input);
  });

  afterEach(() => {
    input.remove();
    document.querySelectorAll('[role="dialog"]').forEach((n) => n.remove());
    center.destroy?.();
  });

  it.each([
    ["a", "select-all"],
    ["x", "cut"],
    ["c", "copy"],
    ["v", "paste"],
    ["z", "undo"],
  ])("leaves ⌘%s to the caret when it is in an input (%s)", (key, commandId) => {
    const e = mod(key);
    Object.defineProperty(e, "target", { value: input });
    expect(guard(e, commandId)).toBe(false);
  });

  it("still fires the same commands when the caret is NOT in a text field", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const e = mod("a");
    Object.defineProperty(e, "target", { value: div });
    expect(guard(e, "select-all")).toBe(true);
    div.remove();
  });

  it("keeps app-level chords working mid-sentence (⌘S)", () => {
    const e = mod("s");
    Object.defineProperty(e, "target", { value: input });
    expect(guard(e, "save")).toBe(true);
  });

  it("an open modal owns the keyboard — canvas commands stand down", () => {
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    document.body.appendChild(dialog);

    const button = document.createElement("button");
    dialog.appendChild(button);

    const e = mod("d");
    Object.defineProperty(e, "target", { value: button });
    expect(guard(e, "duplicate")).toBe(false);
  });

  it("with no modal open, the same chord fires", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const e = mod("d");
    Object.defineProperty(e, "target", { value: div });
    expect(guard(e, "duplicate")).toBe(true);
    div.remove();
  });
});

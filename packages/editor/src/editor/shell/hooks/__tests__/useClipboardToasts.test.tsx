import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { useClipboardToasts } from "../useClipboardToasts";

/**
 * ⌘D made two copies and ⌘V pasted twice — measured live, one heading became
 * three. Two owners: the command registry (capture-phase on window, which had
 * already run and called preventDefault) and `useCanvasKeyboard`, which
 * implemented the same four shortcuts again.
 *
 * The second implementation is gone; these lock the pieces that replaced it.
 */
function fakeComposer() {
  const handlers: Record<string, Array<() => void>> = {};
  return {
    composer: {
      on: (e: string, cb: () => void) => { (handlers[e] ??= []).push(cb); },
      off: (e: string, cb: () => void) => { handlers[e] = (handlers[e] ?? []).filter((h) => h !== cb); },
    } as unknown as Composer,
    fire: (e: string) => (handlers[e] ?? []).forEach((h) => h()),
    count: (e: string) => (handlers[e] ?? []).length,
  };
}

describe("useClipboardToasts", () => {
  it("says something for each of the four actions", () => {
    const { composer, fire } = fakeComposer();
    const addToast = vi.fn();
    renderHook(() => useClipboardToasts(composer, addToast));

    fire(EVENTS.CLIPBOARD_COPY);
    fire(EVENTS.CLIPBOARD_CUT);
    fire(EVENTS.CLIPBOARD_PASTE);
    fire(EVENTS.ELEMENT_DUPLICATED);

    expect(addToast.mock.calls.map((c) => c[0].description)).toEqual([
      "Element copied", "Element cut", "Element pasted", "Element duplicated",
    ]);
  });

  it("unsubscribes on unmount", () => {
    const { composer, count } = fakeComposer();
    const { unmount } = renderHook(() => useClipboardToasts(composer, vi.fn()));
    expect(count(EVENTS.CLIPBOARD_COPY)).toBe(1);
    unmount();
    expect(count(EVENTS.CLIPBOARD_COPY)).toBe(0);
  });
});

const read = (p: string) =>
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), p), "utf8");

describe("one owner per keystroke", () => {
  it("the canvas hook stands down for anything the registry already ran", () => {
    const hook = read("../../../canvas/hooks/useCanvasKeyboard.ts");
    expect(hook).toContain("if (e.defaultPrevented) return;");
  });

  it("the canvas hook no longer implements ⌘C/⌘V/⌘X/⌘D itself", () => {
    const hook = read("../../../canvas/hooks/useCanvasKeyboard.ts");
    // The ⌥ variants have no command and stay; the plain-⌘ branches are gone.
    expect(hook).not.toContain("// Cmd/Ctrl+C: Copy element");
    expect(hook).not.toContain("// Cmd/Ctrl+V: Paste element");
    expect(hook).not.toContain("cut-element");
    expect(hook).not.toContain("composer.elements.duplicateElement(selectedId)");
    expect(hook).toContain("Copy styles only");
    expect(hook).toContain("Paste styles only");
  });

  it("the commands no longer bind the arrow keys the canvas owns", () => {
    const commands = read("../../../../engine/commands/defaultCommands.ts");
    // Cheat sheet: bare arrows select, ⇧ moves 10px, ⌘ moves 1px, ⌥ reorders —
    // all four implemented by useCanvasKeyboard. Both binding them made ⇧-arrow
    // move 20px and a bare arrow nudge instead of moving the selection.
    expect(commands).not.toMatch(/shortcut: "arrow(up|down|left|right)"/);
    expect(commands).not.toMatch(/shortcut: "shift\+arrow(up|down|left|right)"/);
    // …and the commands themselves survive, for the palette.
    expect(commands).toContain('id: "nudge-up"');
    expect(commands).toContain('id: "nudge-up-large"');
  });
});

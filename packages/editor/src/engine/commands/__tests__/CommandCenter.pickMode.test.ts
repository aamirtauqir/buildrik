/**
 * Regression: the inspector's "Pick on canvas" owns a bare Escape while armed.
 *
 * The engine's "deselect" shortcut ("escape", no modifier) is capture-phase on
 * `window` and is set up at CommandCenter construction — before the inspector
 * ever mounts a "Pick on canvas" state. Live walk (flow-check, 2026-09-25):
 * clicking the inspector ⋯ menu's "Pick on canvas" then pressing Escape to
 * cancel it correctly cleared Canvas.tsx's own pick-mode flag, but the SAME
 * keystroke also ran "deselect" first, wiping the previously-selected element
 * and collapsing the whole inspector to "Nothing selected" — the user meant
 * only to bail out of picking. Escape targeting an <input>/dialog was never
 * the trigger; a bare Escape over the plain canvas body is what raced.
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { CommandCenter } from "../CommandCenter";

const escape = (extra: KeyboardEventInit = {}) =>
  new KeyboardEvent("keydown", {
    key: "Escape",
    bubbles: true,
    cancelable: true,
    ...extra,
  });

function makeCenter() {
  const composer = { emit: vi.fn(), on: vi.fn(), off: vi.fn() } as never;
  return new CommandCenter(composer);
}

describe("CommandCenter — deselect vs. inspector Pick-on-canvas", () => {
  let center: ReturnType<typeof makeCenter>;
  let guard: (e: KeyboardEvent, id: string) => boolean;
  let body: HTMLElement;

  beforeEach(() => {
    center = makeCenter();
    guard = (center as never as {
      shouldHandleShortcut(e: KeyboardEvent, id: string): boolean;
    }).shouldHandleShortcut.bind(center);
    body = document.body;
  });

  afterEach(() => {
    document.querySelectorAll('[data-bk-pick]').forEach((n) => n.remove());
    center.destroy?.();
  });

  it("stands down for 'deselect' while Canvas.tsx's pick flag is armed", () => {
    const flag = document.createElement("div");
    flag.setAttribute("data-bk-pick", "true");
    document.body.appendChild(flag);

    const e = escape();
    Object.defineProperty(e, "target", { value: body });
    expect(guard(e, "deselect")).toBe(false);
  });

  it("still deselects on a bare Escape with no pick in progress", () => {
    const e = escape();
    Object.defineProperty(e, "target", { value: body });
    expect(guard(e, "deselect")).toBe(true);
  });

  it("does not touch an unrelated command while picking (only 'deselect' stands down)", () => {
    const flag = document.createElement("div");
    flag.setAttribute("data-bk-pick", "true");
    document.body.appendChild(flag);

    const e = escape();
    Object.defineProperty(e, "target", { value: body });
    expect(guard(e, "close-shortcuts-modal")).toBe(true);
  });
});

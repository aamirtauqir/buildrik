/**
 * G2-050 — the element menu never outlives its element: it closes when the
 * selection leaves it or it is deleted; and Windows hints keep their "+".
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, act } from "@testing-library/react";
import type { Composer, Element } from "../../../../engine";
import { EVENTS } from "../../../../shared/constants/events";
import { ElementContextMenu } from "../ElementContextMenu";
import { formatShortcutHint } from "../MenuItem";

function setup() {
  const handlers = new Map<string, (p: unknown) => void>();
  let exists = true;
  const composer = {
    on: vi.fn((e: string, h: (p: unknown) => void) => handlers.set(e, h)),
    off: vi.fn(),
    elements: { getElement: vi.fn(() => (exists ? {} : null)) },
  } as unknown as Composer;
  const element = { getId: () => "el-1" } as unknown as Element;
  const onClose = vi.fn();
  render(<ElementContextMenu x={10} y={10} actions={[]} context={{ composer, element, isRoot: false }} onClose={onClose} />);
  return { handlers, onClose, remove: () => (exists = false) };
}

describe("ElementContextMenu — stale element", () => {
  it("stays open while the element is still selected", () => {
    const { handlers, onClose } = setup();
    act(() => handlers.get(EVENTS.SELECTION_CHANGED)?.({ selected: ["el-1", "el-2"] }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes when the selection moves off the element", () => {
    const { handlers, onClose } = setup();
    act(() => handlers.get(EVENTS.SELECTION_CHANGED)?.({ selected: ["el-2"] }));
    expect(onClose).toHaveBeenCalled();
  });

  it("closes when the element is deleted", () => {
    const { handlers, onClose, remove } = setup();
    remove();
    act(() => handlers.get(EVENTS.ELEMENT_DELETED)?.({}));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("formatShortcutHint", () => {
  it("keeps the + on Windows and drops it on a Mac", () => {
    expect(formatShortcutHint("Cmd+Alt+C", false)).toBe("Ctrl+Alt+C");
    expect(formatShortcutHint("Cmd+Alt+C", true)).toBe("⌘⌥C");
    expect(formatShortcutHint("Shift+Del", false)).toBe("Shift+Del");
  });
});

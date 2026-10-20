/**
 * @vitest-environment jsdom
 *
 * ⌘/Ctrl+click cycles through the elements stacked under the cursor. The
 * click-count tracker used to record the position before the cycle checked
 * it, so the first ⌘-click always looked like a repeat: empty stack, NaN
 * index, nothing selected (audit 2026-10-20 C2 B1).
 */
import { renderHook, act } from "@testing-library/react";
import type * as React from "react";
import { describe, it, expect, vi } from "vitest";

vi.mock("../../shared/hitTesting", () => ({
  buildElementStack: () => ["inner", "middle", "outer"],
  findElementWithHitExpansion: () => null,
}));
vi.mock("@/editor/chrome-ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/editor/chrome-ui")>()),
  useToast: () => ({ addToast: vi.fn() }),
}));

import { useSelectionBehavior } from "../useSelectionBehavior";
import type { Composer } from "@/engine";

function makeComposer() {
  const els = Object.fromEntries(
    ["inner", "middle", "outer"].map((id) => [id, { getId: () => id, isLocked: () => false }])
  );
  const select = vi.fn();
  const composer = {
    elements: { getElement: (id: string) => els[id] },
    selection: { select, clear: vi.fn(), addToSelection: vi.fn(), getAllSelected: () => [] },
  } as unknown as Composer;
  return { composer, select };
}

const cmdClick = { target: document.body, clientX: 50, clientY: 60, metaKey: true, ctrlKey: false, shiftKey: false } as unknown as React.MouseEvent;

describe("useSelectionBehavior — ⌘-click cycling", () => {
  it("the first ⌘-click selects the innermost element, the next ones cycle outward", () => {
    const { composer, select } = makeComposer();
    const { result } = renderHook(() => useSelectionBehavior({ composer, isEditing: false, onContextMenuClose: () => {} }));

    act(() => result.current.handleClick(cmdClick));
    expect(select).toHaveBeenLastCalledWith(expect.objectContaining({ getId: expect.any(Function) }));
    expect(select.mock.calls.at(-1)?.[0].getId()).toBe("inner");

    act(() => result.current.handleClick(cmdClick));
    expect(select.mock.calls.at(-1)?.[0].getId()).toBe("middle");

    act(() => result.current.handleClick(cmdClick));
    expect(select.mock.calls.at(-1)?.[0].getId()).toBe("outer");
  });
});

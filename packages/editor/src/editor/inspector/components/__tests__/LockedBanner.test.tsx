/**
 * LockedBanner — board 4418:114966, G2-006 / G2-167.
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { LockedBanner } from "../LockedBanner";

function makeComposer(locked: boolean) {
  const el = { locked, isLocked() { return this.locked; }, setLocked: vi.fn(function (this: { locked: boolean }, v: boolean) { this.locked = v; }) };
  const handlers = new Set<() => void>();
  return {
    el,
    handlers,
    elements: { getElement: () => el },
    on: (_: string, h: () => void) => handlers.add(h),
    off: (_: string, h: () => void) => handlers.delete(h),
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
  };
}

describe("LockedBanner", () => {
  it("renders nothing for an unlocked element", () => {
    render(<LockedBanner composer={makeComposer(false) as never} elementId="e" />);
    expect(screen.queryByTestId("inspector-locked-banner")).toBeNull();
  });

  it("says Locked and Unlock unlocks in one transaction", () => {
    const c = makeComposer(true);
    render(<LockedBanner composer={c as never} elementId="e" />);
    expect(screen.getByTestId("inspector-locked-banner")).toHaveTextContent("Locked");
    fireEvent.click(screen.getByRole("button", { name: "Unlock" }));
    expect(c.el.setLocked).toHaveBeenCalledWith(false);
    expect(c.beginTransaction).toHaveBeenCalledWith("unlock-element");
    act(() => c.handlers.forEach((h) => h()));
    expect(screen.queryByTestId("inspector-locked-banner")).toBeNull();
  });
});

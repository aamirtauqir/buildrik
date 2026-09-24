/**
 * Parity 4418:126882 — rail Help opens the "Keyboard" legend: a 280-wide card
 * at the right (x1144, y64), region keys with one line each, an "Also:" note,
 * and "All shortcuts ›" to the full sheet. ✕, Esc and a click outside close it.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { KeyboardLegend } from "../KeyboardLegend";
import { EVENTS } from "@/shared/constants/events";

function makeComposer() {
  const handlers = new Map<string, Set<() => void>>();
  return {
    emit: vi.fn(),
    on: vi.fn((ev: string, fn: () => void) => {
      if (!handlers.has(ev)) handlers.set(ev, new Set());
      handlers.get(ev)!.add(fn);
    }),
    off: vi.fn((ev: string, fn: () => void) => handlers.get(ev)?.delete(fn)),
    fire: (ev: string) => act(() => handlers.get(ev)?.forEach((fn) => fn())),
  };
}

afterEach(cleanup);

describe("KeyboardLegend", () => {
  it("toggles on UI_TOGGLE_KEYBOARD_LEGEND and lists the board's keys", () => {
    const c = makeComposer();
    render(<KeyboardLegend composer={c as never} />);
    expect(screen.queryByTestId("kbd-legend")).toBeNull();
    c.fire(EVENTS.UI_TOGGLE_KEYBOARD_LEGEND);
    const card = screen.getByTestId("kbd-legend");
    expect(card).toHaveTextContent("Keyboard");
    for (const k of ["Tab", "F6 / ⇧F6", "Esc", "⌘K", "A L P M D B", "R", "C", "⌘S · save", "⌘P / ⌘J", "⌘Z / ⌘⇧Z"]) {
      expect(screen.getByText(k, { selector: "[data-testid=kbd-legend-key]" })).toBeInTheDocument();
    }
    expect(card).toHaveTextContent("Also: ⌃, opens Settings");
  });

  it("All shortcuts › opens the full sheet and closes the legend", () => {
    const c = makeComposer();
    render(<KeyboardLegend composer={c as never} />);
    c.fire(EVENTS.UI_TOGGLE_KEYBOARD_LEGEND);
    fireEvent.click(screen.getByRole("button", { name: "All shortcuts ›" }));
    expect(c.emit).toHaveBeenCalledWith(EVENTS.UI_TOGGLE_CHEAT_SHEET, {});
    expect(screen.queryByTestId("kbd-legend")).toBeNull();
  });

  it("✕, Escape and a click outside close it", () => {
    const c = makeComposer();
    render(<KeyboardLegend composer={c as never} />);
    c.fire(EVENTS.UI_TOGGLE_KEYBOARD_LEGEND);
    fireEvent.click(screen.getByRole("button", { name: "Close keyboard legend" }));
    expect(screen.queryByTestId("kbd-legend")).toBeNull();
    c.fire(EVENTS.UI_TOGGLE_KEYBOARD_LEGEND);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("kbd-legend")).toBeNull();
    c.fire(EVENTS.UI_TOGGLE_KEYBOARD_LEGEND);
    fireEvent.click(screen.getByTestId("kbd-legend-dismiss"));
    expect(screen.queryByTestId("kbd-legend")).toBeNull();
  });
});

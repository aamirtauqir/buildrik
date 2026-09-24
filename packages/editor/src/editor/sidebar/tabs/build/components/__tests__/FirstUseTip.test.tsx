/**
 * FirstUseTip — board 7054:78348 (G2-113): one tip a moment after Add opens,
 * "Got it" closes it and the next Add shows the next tip; four in all.
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { FirstUseTip, FIRST_USE_TIP_DELAY_MS } from "../FirstUseTip";

function mount() {
  const anchor = document.createElement("div");
  anchor.getBoundingClientRect = () => ({ left: 60, right: 340, top: 800, bottom: 836, width: 280, height: 36, x: 60, y: 800, toJSON: () => ({}) }) as DOMRect;
  const utils = render(<FirstUseTip anchorRef={{ current: anchor }} />);
  act(() => {
    vi.advanceTimersByTime(FIRST_USE_TIP_DELAY_MS);
  });
  return utils;
}

describe("FirstUseTip", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });
  afterEach(() => vi.useRealTimers());

  it("appears after the delay with tip 1/4, beside the panel", () => {
    mount();
    const tip = screen.getByTestId("insert-first-use-tip");
    expect(tip.textContent).toContain("Tip 1/4");
    expect(tip.textContent).toContain("Drag ⠿ to place an element exactly");
    expect(tip.style.left).toBe("352px");
  });

  it("Got it closes it; the next Add shows tip 2; after four there are none", () => {
    const first = mount();
    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(screen.queryByTestId("insert-first-use-tip")).toBeNull();
    first.unmount();
    mount();
    expect(screen.getByTestId("insert-first-use-tip").textContent).toContain("Tip 2/4");
    localStorage.setItem("buildrick-build-tips-seen", "4");
    const { container } = render(<FirstUseTip anchorRef={{ current: document.createElement("div") }} />);
    act(() => {
      vi.advanceTimersByTime(FIRST_USE_TIP_DELAY_MS);
    });
    expect(container.querySelectorAll("[data-testid='insert-first-use-tip']").length).toBe(0);
  });

  it("Esc closes it", () => {
    mount();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("insert-first-use-tip")).toBeNull();
  });
});

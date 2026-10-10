/**
 * FirstUseTip — board 7054:78348 (G2-113): the Add panel's first-use tip,
 * "Tip n/4", beside the panel. WHEN it shows is the tip queue's call (L1-029):
 * idle only, one automatic tip per session, each tip once per site. It is a
 * note, never a dialog, and never takes focus.
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

const svc = vi.hoisted(() => ({ markEditorTip: vi.fn(async () => null) }));
vi.mock("@/services/OnboardingService", () => svc);

import { FirstUseTip } from "../FirstUseTip";
import { primeTipQueue, resetTipQueueForTests, TIP_IDLE_MS } from "@/editor/onboarding/tipQueue";

function mount() {
  const anchor = document.createElement("div");
  anchor.getBoundingClientRect = () => ({ left: 60, right: 340, top: 800, bottom: 836, width: 280, height: 36, x: 60, y: 800, toJSON: () => ({}) }) as DOMRect;
  const utils = render(<FirstUseTip anchorRef={{ current: anchor }} />);
  act(() => {
    vi.advanceTimersByTime(TIP_IDLE_MS + 300);
  });
  return utils;
}

describe("FirstUseTip", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    sessionStorage.clear();
    resetTipQueueForTests();
  });
  afterEach(() => vi.useRealTimers());

  it("appears once the user is idle, with tip 1/4 beside the panel, as a note that keeps focus where it was", () => {
    act(() => primeTipQueue("site-1", []));
    const field = document.createElement("input");
    document.body.appendChild(field);
    field.focus();
    mount();
    const tip = screen.getByTestId("insert-first-use-tip");
    expect(tip).toHaveAttribute("role", "note");
    expect(tip.textContent).toContain("Tip 1/4");
    expect(tip.textContent).toContain("Drag ⠿ to place an element exactly");
    expect(tip.style.left).toBe("352px");
    expect(document.activeElement).toBe(field);
    expect(svc.markEditorTip).toHaveBeenCalledWith("site-1", "build-tip-1", "seen");
    field.remove();
  });

  it("the next tip comes from what this site has seen; after four there are none", () => {
    act(() => primeTipQueue("site-1", ["build-tip-1"]));
    const first = mount();
    expect(screen.getByTestId("insert-first-use-tip").textContent).toContain("Tip 2/4");
    first.unmount();
    resetTipQueueForTests();
    act(() => primeTipQueue("site-1", ["build-tip-1", "build-tip-2", "build-tip-3", "build-tip-4"]));
    mount();
    expect(screen.queryByTestId("insert-first-use-tip")).toBeNull();
  });

  it("Got it closes it and records the dismissal; no second automatic tip this session", () => {
    act(() => primeTipQueue("site-1", []));
    const first = mount();
    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(screen.queryByTestId("insert-first-use-tip")).toBeNull();
    expect(svc.markEditorTip).toHaveBeenLastCalledWith("site-1", "build-tip-1", "dismissed");
    first.unmount();
    mount();
    expect(screen.queryByTestId("insert-first-use-tip")).toBeNull();
  });

  it("Esc closes it", () => {
    act(() => primeTipQueue("site-1", []));
    mount();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("insert-first-use-tip")).toBeNull();
  });
});

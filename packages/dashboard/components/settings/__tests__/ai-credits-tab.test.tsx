/**
 * What the AI credits tab does with the "unlimited" sentinel.
 *
 * PLAN_LIMITS spells unlimited as -1, and BUSINESS carries `aiGenerations: -1`.
 * The credits block read that as a number: `remaining = max(0, -1 - 0)` = 0, so
 * the plan whose own billing page advertises "Unlimited AI generations" showed
 * "0 remaining this month" and "0/-1 credits used" — and the `remaining === 0`
 * branch put `pointer-events: none` on the Generate New Site CTA. The headline
 * feature of the top paid plan was unreachable from the screen that runs it.
 *
 * The sibling "In-editor AI prompts" block already handled -1; only this one
 * did not.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AICreditsTab } from "../ai-credits-tab";

function generateLink() {
  return screen.getByText("Generate New Site").closest("a")!;
}

describe("AICreditsTab site-generation credits", () => {
  it("treats -1 as unlimited, not as a limit of minus one", () => {
    render(<AICreditsTab used={4} limit={-1} />);
    expect(screen.queryByText(/0\/-1/)).toBeNull();
    expect(screen.queryByText(/remaining this month/)).toBeNull();
    expect(screen.getByText("Unlimited")).toBeTruthy();
    expect(screen.getByText(/generated this month/)).toBeTruthy();
  });

  it("leaves Generate New Site reachable on an unlimited plan", () => {
    render(<AICreditsTab used={0} limit={-1} />);
    const link = generateLink();
    expect(link.getAttribute("aria-disabled")).toBe("false");
    expect(link.className).not.toContain("pointer-events-none");
  });

  it("still counts down a finite allowance", () => {
    render(<AICreditsTab used={1} limit={3} />);
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText(/remaining this month/)).toBeTruthy();
    expect(generateLink().getAttribute("aria-disabled")).toBe("false");
  });

  it("still blocks Generate New Site when a finite allowance is spent", () => {
    render(<AICreditsTab used={3} limit={3} />);
    const link = generateLink();
    expect(link.getAttribute("aria-disabled")).toBe("true");
    expect(link.className).toContain("pointer-events-none");
  });
});

/**
 * What the AI credits tab does with the "unlimited" sentinel.
 *
 * PLAN_LIMITS spells unlimited as -1, and BUSINESS carries `aiGenerations: -1`.
 * The credits block read that as a number: `remaining = max(0, -1 - 0)` = 0, so
 * the plan whose own billing page advertises "Unlimited AI generations" showed
 * "0 remaining this month" and "0/-1 credits used".
 *
 * The tab no longer offers a "Generate New Site" CTA: there is no AI entry in
 * the UI this version (R3-22). The server path stays; only the button went.
 *
 * The sibling "In-editor AI prompts" block already handled -1; only this one
 * did not.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AICreditsTab } from "../ai-credits-tab";

describe("AICreditsTab site-generation credits", () => {
  it("treats -1 as unlimited, not as a limit of minus one", () => {
    render(<AICreditsTab used={4} limit={-1} />);
    expect(screen.queryByText(/0\/-1/)).toBeNull();
    expect(screen.queryByText(/remaining this month/)).toBeNull();
    expect(screen.getByText("Unlimited")).toBeTruthy();
    expect(screen.getByText(/generated this month/)).toBeTruthy();
  });

  it("still counts down a finite allowance", () => {
    render(<AICreditsTab used={1} limit={3} />);
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText(/remaining this month/)).toBeTruthy();
  });

  it("offers no AI generation entry point (R3-22)", () => {
    render(<AICreditsTab used={0} limit={-1} />);
    expect(screen.queryByText("Generate New Site")).toBeNull();
    expect(document.querySelector('a[href*="method=ai"]')).toBeNull();
  });
});

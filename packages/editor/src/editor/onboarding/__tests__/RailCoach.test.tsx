/**
 * The first-run rail coach — board 65:2's note, S1.1 family.
 * "Got it" persists per browser; the bubble anchors beside the rail and
 * renders nothing at all when the rail is not in the DOM.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { STORAGE_KEYS } from "@/shared/constants/storageKeys";
import { RailCoach, railCoachDismissed } from "../RailCoach";

function mountRail() {
  const rail = document.createElement("nav");
  rail.setAttribute("data-testid", "rail");
  document.body.appendChild(rail);
  return rail;
}

beforeEach(() => {
  localStorage.clear();
  document.querySelectorAll('[data-testid="rail"]').forEach((n) => n.remove());
});

describe("RailCoach", () => {
  it("renders the board copy beside the rail with a Got it button", () => {
    mountRail();
    render(<RailCoach onDismiss={() => {}} />);
    expect(
      screen.getByText("Everything you build lives behind these six.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Got it" })).toBeInTheDocument();
  });

  /* QA (integration 5e0d47902): the coach mark was a --bk-ink bubble,
     rgb(17,24,39) — DESIGN.md's NO BLACK RULE (decision #25) bans near-black
     chrome surfaces. It takes the tooltip surface: white, hairline, ink-soft. */
  it("uses the light tooltip surface, not an ink fill", () => {
    mountRail();
    render(<RailCoach onDismiss={() => {}} />);
    const note = screen.getByTestId("rail-coach");
    expect(note.className).not.toMatch(/bg-\[var\(--bk-ink\)\]/);
    expect(note.className).toMatch(/tw:bg-white/);
    expect(note.className).toMatch(/tw:border-\[var\(--bk-gray-200\)\]/);
    expect(note.innerHTML).not.toMatch(/--bk-ink\)\]/);
  });

  it("renders nothing when the rail is not in the DOM", () => {
    render(<RailCoach onDismiss={() => {}} />);
    expect(screen.queryByRole("note")).toBeNull();
  });

  it("Got it persists the flag and calls onDismiss", () => {
    mountRail();
    let dismissed = false;
    render(<RailCoach onDismiss={() => (dismissed = true)} />);
    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(dismissed).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_COACH_DISMISSED)).toBe("1");
    expect(railCoachDismissed()).toBe(true);
  });

  it("railCoachDismissed reads false on a fresh browser", () => {
    expect(railCoachDismissed()).toBe(false);
  });
});

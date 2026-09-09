/**
 * ApprovedCompareView (§3) — the review Compare surface. The diff math is
 * proven against real ExportEngine output in
 * `shared/utils/html/__tests__/approvedCompare.test.ts`; this file verifies the
 * VIEW states: no-snapshot, the per-side loading asymmetry, the list, and the
 * always-present legend (icon+label, never color-only).
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApprovedCompareView } from "../ApprovedCompareView";
import type { ComparePage } from "@/shared/utils/html";

const wrap = (html: string): ComparePage[] => [{ path: "home", html }];
const page = (h2: string) => `<div class="root"><section class="hero"><h2>${h2}</h2></section></div>`;
const APPROVED = wrap(page("One"));
const CURRENT_CHANGED = wrap(page("Two"));
/** Two pages, and the change is on the one that is NOT active by default. */
const TWO_PAGES_APPROVED: ComparePage[] = [
  { path: "home", html: page("One") },
  { path: "about", html: page("Alpha") },
];
const TWO_PAGES_CURRENT: ComparePage[] = [
  { path: "home", html: page("One") },
  { path: "about", html: page("Beta") },
];

function renderView(props: Partial<React.ComponentProps<typeof ApprovedCompareView>> = {}) {
  return render(
    <ApprovedCompareView approvedPages={APPROVED} currentPages={CURRENT_CHANGED} {...props} />,
  );
}

afterEach(cleanup);

describe("ApprovedCompareView", () => {
  it("shows an explicit state when the round has no snapshot", () => {
    renderView({ approvedPages: null });
    expect(screen.getByText(/no approved snapshot for this round/i)).toBeInTheDocument();
  });

  it("shows the per-side loading asymmetry while current is still rendering", () => {
    renderView({ currentPages: null });
    expect(screen.getByText(/rendering current/i)).toBeInTheDocument();
    // Approved side renders immediately (its iframe is present).
    expect(document.querySelector("iframe")).toBeTruthy();
  });

  it("lists a content change in list mode", () => {
    renderView();
    fireEvent.click(screen.getByRole("button", { name: /^list$/i }));
    expect(screen.getByText(/text changed/i)).toBeInTheDocument();
  });

  it("draws no panes at all when nothing changed, in every mode (board 168:82)", () => {
    renderView({ currentPages: APPROVED });
    for (const mode of [/^side by side$/i, /^overlay$/i, /^list$/i]) {
      fireEvent.click(screen.getByRole("button", { name: mode }));
      expect(screen.getByText(/nothing changed since the approved version/i)).toBeInTheDocument();
      // The board's reason for the state: an empty diff view reads as broken.
      expect(document.querySelector("iframe")).toBeNull();
    }
  });

  it("still marks a single unchanged page while other pages have changes", () => {
    renderView({ approvedPages: TWO_PAGES_APPROVED, currentPages: TWO_PAGES_CURRENT });
    fireEvent.click(screen.getByRole("button", { name: /^list$/i }));
    expect(screen.getByText(/matches the approved version/i)).toBeInTheDocument();
    expect(screen.queryByText(/nothing changed since the approved version/i)).toBeNull();
  });

  it("sets the change count in mono, as all four Compare boards do", () => {
    renderView();
    const count = document.querySelector("[data-compare-count]");
    expect(count?.className).toContain("tw:font-mono");
    expect(count?.className).toContain("tw:tabular-nums");
  });

  /* Boards 168:2 / 168:26 / 168:48 draw ONE 48-tall compare bar and put the way
     out of Compare at its right end (168:14 "✕"). The view used to draw no exit
     at all — ReviewTab stacked a second toolbar above this one carrying a
     "‹ Back". These two lock the control's owner and its position. */
  it("carries the way out of Compare in its own bar, not in a second one", () => {
    const onBack = vi.fn();
    renderView({ onBack });
    const bar = document.querySelector('[data-testid="compare-bar"]');
    const close = screen.getByRole("button", { name: /close compare/i });
    expect(bar?.contains(close)).toBe(true);
    // Last control in the bar: the board puts it at the far right.
    const controls = [...(bar?.querySelectorAll("button") ?? [])];
    expect(controls[controls.length - 1]).toBe(close);
    fireEvent.click(close);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("draws the three modes as one segmented strip, active segment marked", () => {
    renderView();
    const strip = document.querySelector('[data-testid="compare-mode-strip"]');
    const segs = [...(strip?.querySelectorAll("button") ?? [])];
    expect(segs.map((b) => b.textContent)).toEqual(["Side by side", "Overlay", "List"]);
    expect(segs.map((b) => b.getAttribute("aria-pressed"))).toEqual(["true", "false", "false"]);
    fireEvent.click(segs[2]);
    expect(
      [...(strip?.querySelectorAll("button") ?? [])].map((b) => b.getAttribute("aria-pressed")),
    ).toEqual(["false", "false", "true"]);
  });

  it("renders the full legend so kinds read by icon+label, not color", () => {
    renderView();
    for (const label of ["Added", "Removed", "Moved", "Content", "Style"]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  it("sandboxes the preview iframes (no scripts, no same-origin)", () => {
    renderView();
    const frame = document.querySelector("iframe");
    expect(frame?.getAttribute("sandbox")).toBe("");
  });
});

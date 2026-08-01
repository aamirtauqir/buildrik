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
const APPROVED = wrap(`<div class="root"><section class="hero"><h2>One</h2></section></div>`);
const CURRENT_CHANGED = wrap(`<div class="root"><section class="hero"><h2>Two</h2></section></div>`);

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

  it("shows a clean state in list mode when nothing changed", () => {
    renderView({ currentPages: APPROVED });
    fireEvent.click(screen.getByRole("button", { name: /^list$/i }));
    expect(screen.getByText(/matches the approved version/i)).toBeInTheDocument();
  });

  it("always renders the full legend so kinds read by icon+label, not color", () => {
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

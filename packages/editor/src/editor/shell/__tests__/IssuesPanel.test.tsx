/**
 * IssuesPanel (P3) — aggregates the editor's issues (DS-lint + broken links +
 * missing alt, already collected into state.issues) into one reviewable list.
 * Verifies the filter, the counts, the clean/empty states, and jump-to.
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IssuesPanel } from "../IssuesPanel";

const ISSUES = [
  { id: "i1", type: "error" as const, message: "Broken link: /about → 404" },
  { id: "i2", type: "warning" as const, message: "Image missing alt text" },
  { id: "i3", type: "warning" as const, message: "Off-token color #123456" },
];

function renderPanel(props = {}) {
  return render(<IssuesPanel issues={ISSUES} onClose={vi.fn()} {...props} />);
}

afterEach(cleanup);

describe("IssuesPanel", () => {
  /* Boards 164:2 / 164:22 head the list with one line: what you are looking
     at, and how many. The error/warning split it replaces needed its own row
     plus a segmented filter above it to say the same thing. */
  it("lists every issue under an 'All · N' head", () => {
    renderPanel();
    expect(screen.getByText(/Broken link/)).toBeInTheDocument();
    expect(screen.getByText(/missing alt/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByText("· 3")).toBeInTheDocument();
  });

  it("cycles to errors only, and says what it is hiding", () => {
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByText(/Broken link/)).toBeInTheDocument();
    expect(screen.queryByText(/missing alt/)).not.toBeInTheDocument();
    expect(screen.getByText(/2 issues are hidden/)).toBeInTheDocument();
  });

  it("shows a filtered-empty state when a filter matches nothing", () => {
    renderPanel({ issues: ISSUES.filter((i) => i.type === "warning") });
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByText(/no errors/i)).toBeInTheDocument();
  });

  it("shows a clean state when there are zero issues", () => {
    renderPanel({ issues: [] });
    expect(screen.getByText(/no issues/i)).toBeInTheDocument();
  });

  it("jumps to the element when a row is clicked", () => {
    const onSelectElement = vi.fn();
    renderPanel({ onSelectElement });
    fireEvent.click(screen.getByText(/Broken link/));
    expect(onSelectElement).toHaveBeenCalledWith("i1");
  });

  // ── T10 page scope (topbar plan, eng D17) ──────────────────────────────────
  describe("page scope", () => {
    const PAGED = [
      { id: "p1", type: "error" as const, message: "Broken link on Home", pageId: "home" },
      { id: "p2", type: "warning" as const, message: "Missing alt on About", pageId: "about" },
      { id: "s1", type: "warning" as const, message: "Off-token color everywhere" },
    ];

    it("hides the scope filter when every issue is site-wide", () => {
      renderPanel(); // ISSUES carry no pageId
      expect(screen.queryByRole("group", { name: /issue scope/i })).not.toBeInTheDocument();
    });

    it("defaults to This page: current page's issues + site-wide, other pages hidden", () => {
      renderPanel({ issues: PAGED, activePageId: "home" });
      expect(screen.getByRole("group", { name: /issue scope/i })).toBeInTheDocument();
      expect(screen.getByText(/Broken link on Home/)).toBeInTheDocument();
      expect(screen.getByText(/Off-token color everywhere/)).toBeInTheDocument();
      expect(screen.queryByText(/Missing alt on About/)).not.toBeInTheDocument();
      // the head's count follows the scope
      expect(screen.getByText("· 2")).toBeInTheDocument();
    });

    it("All pages shows everything", () => {
      renderPanel({ issues: PAGED, activePageId: "home" });
      fireEvent.click(screen.getByRole("button", { name: /all pages/i }));
      expect(screen.getByText(/Missing alt on About/)).toBeInTheDocument();
      expect(screen.getByText("· 3")).toBeInTheDocument();
    });
  });
});

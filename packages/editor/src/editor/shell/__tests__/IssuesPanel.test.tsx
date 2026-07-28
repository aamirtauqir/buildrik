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
  it("lists all issues with an error/warning breakdown", () => {
    renderPanel();
    expect(screen.getByText(/Broken link/)).toBeInTheDocument();
    expect(screen.getByText(/missing alt/)).toBeInTheDocument();
    expect(screen.getByText(/1 error/i)).toBeInTheDocument();
    expect(screen.getByText(/2 warnings/i)).toBeInTheDocument();
  });

  it("filters to errors only", () => {
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: /^errors/i }));
    expect(screen.getByText(/Broken link/)).toBeInTheDocument();
    expect(screen.queryByText(/missing alt/)).not.toBeInTheDocument();
  });

  it("shows a filtered-empty state when a filter matches nothing", () => {
    renderPanel({ issues: ISSUES.filter((i) => i.type === "warning") });
    fireEvent.click(screen.getByRole("button", { name: /^errors/i }));
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
});

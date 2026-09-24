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
  /* Board 4418:147641: "Open issues: 3" heads the list; each row is a dot,
     the message over its location, Fix › and a severity pill; a legend
     closes the panel. The severity filter (no board draws it) stays as a
     quiet trailing control on the head row. */
  it("lists every issue under an 'Open issues: N' head, with the board's row parts", () => {
    renderPanel();
    expect(screen.getByText(/Broken link/)).toBeInTheDocument();
    expect(screen.getByText(/missing alt/)).toBeInTheDocument();
    expect(screen.getByText("Open issues: 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByTestId("issue-severity-0")).toHaveTextContent("Error");
    expect(screen.getByTestId("issue-severity-1")).toHaveTextContent("Warning · should fix");
    expect(screen.getByTestId("issue-dot-0").className).toContain("tw:bg-[var(--bk-error)]");
    expect(screen.getByText("● red = error · ● amber = warning")).toBeInTheDocument();
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

  it("hands the clicked issue to the locate handler (B9 / SH-63)", () => {
    const onSelectElement = vi.fn();
    renderPanel({ onSelectElement });
    fireEvent.click(screen.getByText(/Broken link/));
    expect(onSelectElement).toHaveBeenCalledWith(ISSUES[0]);
  });

  // ── T10 page scope (topbar plan, eng D17) ──────────────────────────────────
  describe("page scope", () => {
    const PAGED = [
      { id: "p1", type: "error" as const, message: "Broken link on Home", pageId: "home" },
      { id: "p2", type: "warning" as const, message: "Missing alt on About", pageId: "about" },
      { id: "s1", type: "warning" as const, message: "Off-token color everywhere" },
    ];

    it("always offers This page / Whole site, as the board draws it", () => {
      renderPanel(); // ISSUES carry no pageId — both scopes show the same list
      const group = screen.getByRole("group", { name: /issue scope/i });
      expect(group).toHaveTextContent("This page");
      expect(group).toHaveTextContent("Whole site");
    });

    it("defaults to This page: current page's issues + site-wide, other pages hidden", () => {
      renderPanel({ issues: PAGED, activePageId: "home" });
      expect(screen.getByRole("group", { name: /issue scope/i })).toBeInTheDocument();
      expect(screen.getByText(/Broken link on Home/)).toBeInTheDocument();
      expect(screen.getByText(/Off-token color everywhere/)).toBeInTheDocument();
      expect(screen.queryByText(/Missing alt on About/)).not.toBeInTheDocument();
      // the head's count follows the scope
      expect(screen.getByText("Open issues: 2")).toBeInTheDocument();
    });

    it("Whole site shows everything", () => {
      renderPanel({ issues: PAGED, activePageId: "home" });
      fireEvent.click(screen.getByRole("button", { name: /whole site/i }));
      expect(screen.getByText(/Missing alt on About/)).toBeInTheDocument();
      expect(screen.getByText("Open issues: 3")).toBeInTheDocument();
    });
  });
});

/* QA (integration 5e0d47902): the lint's long messages ("Color token
   "color-primary" missing darkValue. Will fall back…") wrapped to three lines
   inside the fixed 56-tall row (board 164:28), pushing the location line
   11 px past the row into the next one. One line each, the full text kept in
   the DOM and in the title. */
describe("IssuesPanel — a long message stays inside its 56 row", () => {
  it("message and location are single truncated lines, with the full message as the title", () => {
    const long = 'Color token "color-primary" missing darkValue. Will fall back to the light value in dark mode.';
    renderPanel({ issues: [{ id: "l1", type: "warning" as const, message: long, location: "Brand › color-primary" }] });
    const msg = screen.getByTestId("issue-message-0");
    expect(msg.textContent).toBe(long);
    expect(msg.className).toMatch(/tw:truncate/);
    expect(msg.getAttribute("title")).toBe(long);
    expect(screen.getByTestId("issue-location-0").className).toMatch(/tw:truncate/);
  });
});

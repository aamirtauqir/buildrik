/**
 * IssuesPanel (P3) — aggregates the editor's issues (DS-lint + broken links +
 * missing alt, already collected into state.issues) into one reviewable list.
 * Verifies the filter, the counts, the clean/empty states, and jump-to.
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { publishTray } from "../publishTrayStore";
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
  /* 2L9 Play F4.01 (303:32296) heads the list with the publishing verdict:
     "1 issue blocks publishing · 2 tips" (was "Open issues: 3"). */
  it("lists every issue under the publishing verdict, with the board's row parts", () => {
    renderPanel();
    expect(screen.getByText(/Broken link/)).toBeInTheDocument();
    expect(screen.getByText(/missing alt/)).toBeInTheDocument();
    expect(screen.getByText("1 issue blocks publishing · 2 tips")).toBeInTheDocument();
    expect(screen.queryByTestId("issues-review-publish")).toBeNull();
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    /* 2L9 B8-IS01: cards, not dot rows — a blocker on the red tint with ✕,
       advice on grey with !, the severity named for screen readers; no pill,
       no legend. */
    expect(screen.getByTestId("issue-severity-0")).toHaveTextContent("Error");
    expect(screen.getByTestId("issue-severity-1")).toHaveTextContent("Warning");
    expect(screen.getByTestId("issue-dot-0").textContent).toBe("✕ ");
    expect(screen.getByTestId("issue-row-0").className).toContain("tw:bg-[var(--bk-error-tint)]");
    expect(screen.getByTestId("issue-row-1").className).toContain("tw:bg-[var(--bk-bg-subtle)]");
    expect(screen.queryByText("● red = error · ● amber = warning")).toBeNull();
  });

  /* L4-036: with 1 error among 19 warnings the error was row 15 — producer
     order. Errors come first; within a severity the feed's order stands. */
  it("lists errors before warnings", () => {
    renderPanel({
      issues: [
        { id: "w1", type: "warning" as const, message: "Warning one" },
        { id: "e1", type: "error" as const, message: "The one error" },
        { id: "w2", type: "warning" as const, message: "Warning two" },
      ],
    });
    expect(screen.getByTestId("issue-severity-0")).toHaveTextContent("Error");
    expect(screen.getByTestId("issue-severity-1")).toHaveTextContent("Warning");
    const text = document.body.textContent ?? "";
    expect(text.indexOf("Warning one")).toBeLessThan(text.indexOf("Warning two"));
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
    expect(screen.getByText("No issues.")).toBeInTheDocument();
  });

  it("renders an Ignored (n) row per suppressed token, and Restore calls onUnignore", () => {
    const onUnignore = vi.fn();
    renderPanel({ suppressedTokenIds: ["color.accent", "color.border"], onUnignore });
    expect(screen.getByTestId("issues-ignored-row")).toHaveTextContent("Ignored (2)");
    fireEvent.click(screen.getByTestId("issue-restore-color.accent"));
    expect(onUnignore).toHaveBeenCalledWith("color.accent");
  });

  it("renders no Ignored row when nothing is suppressed", () => {
    renderPanel();
    expect(screen.queryByTestId("issues-ignored-row")).toBeNull();
  });

  it("hands the clicked issue to the locate handler (B9 / SH-63)", () => {
    const onSelectElement = vi.fn();
    renderPanel({ onSelectElement });
    fireEvent.click(screen.getByText(/Broken link/));
    expect(onSelectElement).toHaveBeenCalledWith(ISSUES[0]);
  });

  it("Fix › opens the exact target when there is nothing to repair mechanically (B8-IS01)", () => {
    const onSelectElement = vi.fn();
    const issue = { id: "e", type: "error" as const, message: "Collection list has no source", elementId: "list-1", location: "Home › Journal section" };
    renderPanel({ onSelectElement, issues: [issue] });
    fireEvent.click(screen.getByTestId("issue-open-0"));
    expect(onSelectElement).toHaveBeenCalledWith(issue);
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
      expect(screen.getByText("1 issue blocks publishing · 1 tip")).toBeInTheDocument();
    });

    it("Whole site shows everything", () => {
      renderPanel({ issues: PAGED, activePageId: "home" });
      fireEvent.click(screen.getByRole("button", { name: /whole site/i }));
      expect(screen.getByText(/Missing alt on About/)).toBeInTheDocument();
      expect(screen.getByText("1 issue blocks publishing · 2 tips")).toBeInTheDocument();
    });
  });

  /* Play F4.05 (303:34252): with no blocker the panel offers the next move. */
  it("no blockers: 'No blocking issues · N tips' and Review and publish opens the tray", () => {
    renderPanel({ issues: [{ id: "w", type: "warning" as const, message: "Image missing alt text" }] });
    expect(screen.getByText("No blocking issues · 1 tip")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("issues-review-publish"));
    expect(publishTray.get().open).toBe(true);
    publishTray.close();
  });
});

// ── x3: content-scan states ──────────────────────────────────────────────
describe("IssuesPanel — content-scan states", () => {
  it("shows nothing extra when scanState is idle (default)", () => {
    renderPanel();
    expect(screen.queryByTestId("issues-scan-banner")).not.toBeInTheDocument();
  });

  it("shows a scanning banner", () => {
    renderPanel({ scanState: "scanning" });
    expect(screen.getByTestId("issues-scan-banner")).toHaveTextContent(/scanning/i);
  });

  it("shows a scan-failed banner with Try again, which calls onRescan", () => {
    const onRescan = vi.fn();
    renderPanel({ scanState: "error", onRescan });
    const banner = screen.getByTestId("issues-scan-banner");
    expect(banner).toHaveTextContent(/scan failed/i);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRescan).toHaveBeenCalledTimes(1);
  });
});

/* 2L9 B8-IS01 cards wrap: the whole sentence is read before a fix, never
   cut at a fixed row height (the 56-tall row that truncated is gone). */
describe("IssuesPanel — a long message wraps inside its card", () => {
  it("message and location wrap; the full message stays the title", () => {
    const long = 'No dark value for "color-primary" — dark mode shows its light value, so check it on a dark page.';
    renderPanel({ issues: [{ id: "l1", type: "warning" as const, message: long, location: "Brand › color-primary" }] });
    const msg = screen.getByTestId("issue-message-0");
    expect(msg.textContent).toContain(long);
    expect(msg.className).toContain("tw:whitespace-normal");
    expect(msg.className).not.toMatch(/tw:truncate/);
    expect(msg.getAttribute("title")).toBe(long);
    expect(screen.getByTestId("issue-location-0").className).not.toMatch(/tw:truncate/);
  });
});

describe("IssuesPanel · images missing alt text (Play C02 353:24569, F4.01 303:32296)", () => {
  const ALT = [
    { id: "a1", type: "warning" as const, message: "Image is missing alt text", location: "Home › Image", elementId: "img1", pageId: "home", contentKind: "missing-alt" as const },
    { id: "a2", type: "warning" as const, message: "Image is missing alt text", location: "About › Image", elementId: "img2", pageId: "about", contentKind: "missing-alt" as const },
  ];

  it("two or more are one card; Fix › lists them, Open image › selects one, ‹ Back to Issues returns", () => {
    const onSelectElement = vi.fn();
    render(<IssuesPanel issues={[ISSUES[0], ...ALT]} onClose={vi.fn()} onSelectElement={onSelectElement} />);
    fireEvent.click(screen.getByRole("button", { name: "Whole site" }));
    const card = screen.getByTestId("issue-alt-group");
    expect(card).toHaveTextContent("2 images have no alt text");
    expect(card).toHaveTextContent("Home › Image, About › Image");
    // One card, one tip: "1 issue blocks publishing · 1 tip".
    expect(screen.getByTestId("issues-summary")).toHaveTextContent("1 issue blocks publishing · 1 tip");
    expect(screen.queryAllByText("Image is missing alt text")).toHaveLength(0);

    fireEvent.click(screen.getByTestId("issue-alt-group-fix"));
    expect(screen.getByText("Images missing alt text")).toBeInTheDocument();
    expect(screen.getByText("2 images · choose one to inspect")).toBeInTheDocument();
    expect(screen.getAllByText("Missing alt text · image content")).toHaveLength(2);
    fireEvent.click(screen.getAllByRole("button", { name: "Open image ›" })[1]);
    expect(onSelectElement).toHaveBeenCalledWith(ALT[1]);

    fireEvent.click(screen.getByTestId("issues-alt-back"));
    expect(screen.getByTestId("issue-alt-group")).toBeInTheDocument();
  });

  it("a single one keeps its own card", () => {
    render(<IssuesPanel issues={[ALT[0]]} onClose={vi.fn()} activePageId="home" />);
    expect(screen.queryByTestId("issue-alt-group")).toBeNull();
    expect(screen.getByText("Image is missing alt text")).toBeInTheDocument();
  });
});

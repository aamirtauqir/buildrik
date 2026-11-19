/**
 * PageRow class + chip + a11y assertions.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, createEvent } from "@testing-library/react";
import { SitePublicationContext } from "@/editor/shell/hooks/useLifecycle";
import { PageRow } from "../components/PageRow";
import type { PageItem } from "../types";

const baseProps = {
  pages: [] as PageItem[],
  composer: null,
  isRenaming: false,
  onSelect: vi.fn(),
  onRenameCommit: vi.fn(),
  onRenameCancel: vi.fn(),
  onRenameStart: vi.fn(),
  onContextMenu: vi.fn(),
};

const home: PageItem = {
  id: "p1",
  name: "Home",
  slug: "/",
  isHome: true,
  isActive: false,
  status: "live",
};

describe("PageRow", () => {
  // Board 140:2: plain rows carry NO slug, NO icon — only Home draws one
  // (roof glyph). Status chips are v3 (4418:93381), below.
  it("renders the name; no slug on the tree row", () => {
    const { container } = render(<PageRow page={home} {...baseProps} />);
    expect(container.querySelector(".bd-pg-row-name")).toHaveTextContent("Home");
    expect(container.querySelector(".bd-pg-row-slug")).toBeNull();
  });

  /* design-2l9 63:6393: every row has a glyph and its URL under the name;
     the open page is tagged Current. Re-baseline: page rows. */
  it("every row draws a glyph, the URL under its name, and Current on the open page", () => {
    const { container: h } = render(<PageRow page={{ ...home, isActive: true }} {...baseProps} />);
    expect(h.querySelector(".bd-pg-row-icon")).not.toBeNull();
    expect(h.querySelector(`[data-testid="page-row-path-${home.id}"]`)?.textContent).toBe("/");
    expect(h.querySelector(`[data-testid="page-row-incontext-${home.id}"]`)?.textContent).toBe("Current");
    const { container: p } = render(<PageRow page={{ ...home, isHome: false, isActive: false }} {...baseProps} />);
    expect(p.querySelector(".bd-pg-row-icon")).not.toBeNull();
  });

  it("every row leads with the always-visible checkbox (board 140:12)", () => {
    const { container } = render(<PageRow page={home} {...baseProps} />);
    expect(container.querySelector(".bd-pg-row-checkbox")).not.toBeNull();
  });

  it("active variant adds .bd-pg-row.active", () => {
    const { container } = render(
      <PageRow page={{ ...home, isActive: true }} {...baseProps} />,
    );
    expect(container.querySelector(".bd-pg-row.active")).not.toBeNull();
  });

  it("nested prop adds .bd-pg-row.nested", () => {
    const { container } = render(<PageRow page={home} nested {...baseProps} />);
    expect(container.querySelector(".bd-pg-row.nested")).not.toBeNull();
  });

  /* C5 G2-071 — board 4418:93381 (v3) draws the status on the row: "Draft"
     and "Hidden from publish" chips; a live page draws none. This test used
     to assert no chip at all (V1 board 140:2). */
  it("draws the board's status chip for a non-live page, none for a live one", () => {
    const { container, rerender } = render(<PageRow page={{ ...home, isHome: false }} {...baseProps} />);
    expect(container.querySelector(".bd-pg-chip")).toBeNull();
    expect(container.querySelector(".bd-pg-home-chip")).toBeNull();
    rerender(<PageRow page={{ ...home, status: "draft", isHome: false }} {...baseProps} />);
    expect(screen.getByTestId("page-status-chip-p1").textContent).toBe("Draft");
    rerender(<PageRow page={{ ...home, status: "hidden", isHome: false }} {...baseProps} />);
    expect(screen.getByTestId("page-status-chip-p1").textContent).toBe("Hidden from publish");
    const row = container.querySelector(".bd-pg-row");
    expect(row?.getAttribute("aria-label") ?? "").toContain("Hidden from publish");
  });

  it("long name shows title attribute for tooltip", () => {
    const longName = "A".repeat(50);
    const { container } = render(
      <PageRow page={{ ...home, name: longName }} {...baseProps} />,
    );
    const nameEl = container.querySelector(".bd-pg-row-name");
    expect(nameEl).toHaveAttribute("title", longName);
  });



  it("renders single overflow button (no per-row action strip)", () => {
    const { container } = render(<PageRow page={home} {...baseProps} />);
    const overflows = container.querySelectorAll(".bd-pg-row-overflow");
    expect(overflows.length).toBe(1);
    expect(container.querySelector(".pg-row__actions")).toBeNull();
    expect(container.querySelector(".pg-row__act")).toBeNull();
  });

  it("does not render legacy thumb gradient", () => {
    const { container } = render(<PageRow page={home} {...baseProps} />);
    expect(container.querySelector(".pg-row__thumb")).toBeNull();
  });

  it("does not render legacy 'updated' label", () => {
    const { container } = render(
      <PageRow
        page={{ ...home, updatedAt: new Date().toISOString() }}
        {...baseProps}
      />,
    );
    expect(container.querySelector(".pg-row__updated")).toBeNull();
    expect(container.querySelector(".bd-pg-row-updated")).toBeNull();
  });

  it("overflow click invokes onContextMenu", () => {
    const onContextMenu = vi.fn();
    const { container } = render(
      <PageRow page={home} {...baseProps} onContextMenu={onContextMenu} />,
    );
    const overflow = container.querySelector(".bd-pg-row-overflow") as HTMLElement;
    fireEvent.click(overflow);
    expect(onContextMenu).toHaveBeenCalled();
  });

  // Board 140:21 / 1171:4729 — the caption spells the row out as
  // "checkbox · chevron · icon · name · home ⌂ · dirty ●".
  it("renders the dirty dot only when the page has unsaved edits", () => {
    const { rerender } = render(<PageRow {...baseProps} page={home} />);
    expect(screen.queryByTestId("page-dirty-dot")).toBeNull();
    rerender(<PageRow {...baseProps} page={home} isDirty />);
    expect(screen.getByTestId("page-dirty-dot")).toBeInTheDocument();
    /* L3-009: the dot carries its word, and the word is what it means —
       board 4418:93381's "Unpublished" named UNSAVED edits. */
    expect(screen.getByTestId("page-dirty-label-p1").textContent).toBe("Unsaved changes");
  });

  it("announces unsaved changes in the row label", () => {
    render(<PageRow {...baseProps} page={home} isDirty />);
    expect(
      screen.getByRole("treeitem", { name: /unsaved changes/i }),
    ).toBeInTheDocument();
  });
});

/* L3-009 (owner, 2026-10-10): the row's screen-reader status comes from the
   same publication state as the visible chip — never "Live" on a site that
   has never been published. */
describe("PageRow · publication status (L3-009)", () => {
  const withSite = (site: { isPublished: boolean | null; hasUnpublishedChanges: boolean | null }, isDirty = false) =>
    render(
      <SitePublicationContext.Provider value={site}>
        <PageRow {...baseProps} page={home} isDirty={isDirty} />
      </SitePublicationContext.Provider>,
    );
  const rowName = () => screen.getByRole("treeitem").getAttribute("aria-label") ?? "";

  it("a never-published site reads 'Draft · not published yet', not 'Live'", () => {
    withSite({ isPublished: false, hasUnpublishedChanges: null });
    expect(rowName()).toContain("Draft · not published yet");
    expect(rowName()).not.toMatch(/\bLive\b/);
  });

  it("a live site with changes since reads 'Unpublished changes'", () => {
    withSite({ isPublished: true, hasUnpublishedChanges: true });
    expect(rowName()).toContain("Unpublished changes");
  });

  it("a live site with nothing waiting reads 'Live'", () => {
    withSite({ isPublished: true, hasUnpublishedChanges: false });
    expect(rowName()).toContain("Live");
  });

  it("unsaved edits read 'Unsaved changes' — visible and spoken alike", () => {
    withSite({ isPublished: true, hasUnpublishedChanges: true }, true);
    expect(rowName()).toContain("Unsaved changes");
    expect(rowName()).not.toContain("Unpublished changes");
    expect(screen.getByTestId("page-dirty-label-p1").textContent).toBe("Unsaved changes");
  });

  it("before the publish state is known it names no status", () => {
    withSite({ isPublished: null, hasUnpublishedChanges: null });
    expect(rowName()).not.toMatch(/Live|Draft|Unpublished/);
  });
});

/* A space typed into the rename field was swallowed and toggled the row's
   selection instead, so "Renamed Page" saved as "RenamedPage". Two handlers
   were responsible: the input's own, and the ROW's — the input sits inside the
   row, so its keystrokes bubble. The row already guarded Enter and F2 with
   `!isRenaming`; the Space branch, added later, did not. Measured in the app:
   typing "A B C" left "ABC", with defaultPrevented flipping between the
   capture and bubble phases while the target was the input. */
describe("PageRow — a space belongs to the page name, not to selection", () => {
  function renameProps(extra: Record<string, unknown> = {}) {
    return { ...baseProps, isRenaming: true, ...extra };
  }

  it("does not preventDefault a space typed into the rename field", () => {
    const onToggleSelect = vi.fn();
    const { container } = render(
      <PageRow page={home} {...renameProps({ onToggleSelect })} />,
    );
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input).not.toBeNull();
    const ev = createEvent.keyDown(input, { key: " ", bubbles: true });
    fireEvent(input, ev);
    expect(ev.defaultPrevented).toBe(false);
    expect(onToggleSelect).not.toHaveBeenCalled();
  });

  it("still toggles selection on space when the row is NOT renaming", () => {
    const onToggleSelect = vi.fn();
    const { container } = render(
      <PageRow page={home} {...baseProps} onToggleSelect={onToggleSelect} />,
    );
    const row = container.querySelector(".bd-pg-row") as HTMLElement;
    fireEvent.keyDown(row, { key: " " });
    expect(onToggleSelect).toHaveBeenCalledTimes(1);
  });
});


/* v3 4418:93108: an open rename field says its keys under itself. */
describe("PageRow — rename hint", () => {
  it("shows “Enter to save · Esc to cancel” only while renaming", () => {
    const { rerender } = render(<PageRow page={home} {...baseProps} />);
    expect(screen.queryByText("Enter to save · Esc to cancel")).toBeNull();
    rerender(<PageRow page={home} {...baseProps} isRenaming />);
    expect(screen.getByText("Enter to save · Esc to cancel")).toBeInTheDocument();
  });
});

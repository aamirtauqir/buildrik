/**
 * BRP1-M5 highlight (8224:230857): "Primary · Used by 14 elements across 3
 * pages" under the table, and the right column's "Home · 6 matches" card with
 * Next page / Clear highlight. The highlighted ids are exactly the tracker's
 * breakdown for the token.
 */
import { act, fireEvent, render, renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { EventEmitter } from "@/engine/EventEmitter";
import type { Composer } from "@/engine/Composer";
import { highlightPages, useTokenBreakdownIds, useUsageHighlight, UsageHighlightCard, UsageHighlightNotice } from "../UsageHighlight";

const tree = (id: string, children: Array<{ id: string; children?: unknown[] }> = []) => ({ id, children });
const PAGES = [
  { id: "home", name: "Home", root: tree("r1", [tree("a"), tree("b", [tree("c")])]) },
  { id: "menu", name: "Menu", root: tree("r2", [tree("d")]) },
  { id: "about", name: "About", root: tree("r3", [tree("e")]) },
];

function fakeComposer(breakdown: Array<{ elementId: string; styleProp: string }>) {
  const tracker = new EventEmitter() as EventEmitter & { getBreakdown: (id: string) => typeof breakdown };
  tracker.getBreakdown = vi.fn(() => breakdown);
  const composer = new EventEmitter() as unknown as Composer & EventEmitter;
  let active = "home";
  Object.assign(composer, {
    designSystem: { tokenUsage: tracker },
    elements: {
      exportPages: () => PAGES,
      getActivePage: () => PAGES.find((p) => p.id === active),
      setActivePage: vi.fn((id: string) => {
        active = id;
        composer.emit("page:changed", { pageId: id });
      }),
    },
  });
  return { composer, tracker };
}

describe("highlightPages", () => {
  it("counts the highlighted elements per page, in page order, skipping pages with none", () => {
    expect(highlightPages(PAGES, new Set(["a", "c", "d"]))).toEqual([
      { id: "home", name: "Home", count: 2 },
      { id: "menu", name: "Menu", count: 1 },
    ]);
  });
});

describe("useTokenBreakdownIds", () => {
  it("is exactly the tracker's breakdown element ids (distinct), and follows tokenUsage:changed", () => {
    const { composer, tracker } = fakeComposer([
      { elementId: "a", styleProp: "color" },
      { elementId: "a", styleProp: "background-color" },
      { elementId: "d", styleProp: "color" },
    ]);
    const { result } = renderHook(() => useTokenBreakdownIds(composer, "color-primary"));
    expect(tracker.getBreakdown).toHaveBeenCalledWith("color-primary");
    expect(result.current).toEqual(["a", "d"]);
    (tracker.getBreakdown as ReturnType<typeof vi.fn>).mockReturnValue([{ elementId: "e", styleProp: "color" }]);
    act(() => tracker.emit("tokenUsage:changed"));
    expect(result.current).toEqual(["e"]);
  });

  it("is empty when no token is highlighted", () => {
    const { composer } = fakeComposer([{ elementId: "a", styleProp: "color" }]);
    const { result } = renderHook(() => useTokenBreakdownIds(composer, null));
    expect(result.current).toEqual([]);
  });
});

describe("useUsageHighlight", () => {
  it("reports the active page's matches and Next page moves to the next page with matches", () => {
    const { composer } = fakeComposer([]);
    const { result } = renderHook(() => useUsageHighlight(composer, ["a", "d", "e"]));
    expect(result.current.active).toEqual({ id: "home", name: "Home", count: 1 });
    expect(result.current.pages).toHaveLength(3);
    act(() => result.current.nextPage());
    expect(composer.elements.setActivePage).toHaveBeenCalledWith("menu");
    expect(result.current.active).toEqual({ id: "menu", name: "Menu", count: 1 });
  });
});

describe("UsageHighlightNotice / UsageHighlightCard", () => {
  it("states the token, elements and pages", () => {
    const { getByTestId } = render(<UsageHighlightNotice tokenName="Primary" elements={14} pages={3} />);
    expect(getByTestId("brand-usage-highlight-notice").textContent).toBe("Primary · Used by 14 elements across 3 pages");
  });

  it("singular forms read as a sentence", () => {
    const { getByTestId } = render(<UsageHighlightNotice tokenName="Border" elements={1} pages={1} />);
    expect(getByTestId("brand-usage-highlight-notice").textContent).toBe("Border · Used by 1 element across 1 page");
  });

  it("draws the page's matches, Next page only with another page to go to, and Clear highlight", () => {
    const onNext = vi.fn();
    const onClear = vi.fn();
    const { getByTestId, getByRole, rerender, queryByRole } = render(
      <UsageHighlightCard active={{ id: "home", name: "Home", count: 6 }} tokenName="Primary" pageCount={3} onNext={onNext} onClear={onClear} />,
    );
    expect(getByTestId("brand-usage-highlight-card").textContent).toContain("Home · 6 matches");
    fireEvent.click(getByRole("button", { name: "Next page" }));
    fireEvent.click(getByRole("button", { name: "Clear highlight" }));
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onClear).toHaveBeenCalledTimes(1);
    rerender(<UsageHighlightCard active={{ id: "home", name: "Home", count: 1 }} tokenName="Primary" pageCount={1} onNext={onNext} onClear={onClear} />);
    expect(getByTestId("brand-usage-highlight-card").textContent).toContain("Home · 1 match");
    expect(queryByRole("button", { name: "Next page" })).toBeNull();
  });
});

describe("UsageHighlightNotice — uses outside the pages", () => {
  it("says where the uses are when no element binds the token directly", () => {
    const { getByTestId } = render(<UsageHighlightNotice tokenName="Primary" elements={0} pages={0} references={2} />);
    expect(getByTestId("brand-usage-highlight-notice").textContent).toBe(
      "Primary · Used by 2 references in shared styles or components — no element on a page uses it directly",
    );
  });
});

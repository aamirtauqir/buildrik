// @vitest-environment jsdom
/**
 * SearchResults — board 138:53 contract: ONE flat cross-source list,
 * label left + source-group tag right, no header, no category sections.
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { SearchResults } from "../SearchResults";
import type { InsertSearchHit } from "../../utils/search";
import type { FlatElEntry } from "../../catalog/types";
import type { BlockDefinition } from "../../../../../../blocks/blockRegistry";
import type { ComponentDefinition } from "@/shared/types/components";

const el: FlatElEntry = {
  name: "Button",
  iconHtml: "<rect />",
  blockId: "button",
  description: "A clickable button",
  tags: ["cta"],
  catId: "basic",
  catName: "Basic",
};

const block = { id: "button-group", label: "Button group", elementType: "container" } as BlockDefinition;

const saved = { id: "cmp-1", name: "CTA button", root: { type: "button" } } as unknown as ComponentDefinition;

const hits: InsertSearchHit[] = [
  { key: "el-basic-Button", label: "Button", group: "ELEMENTS", el },
  { key: "block-button-group", label: "Button group", group: "BLOCKS", block },
  { key: "saved-cmp-1", label: "CTA button", group: "SAVED", component: saved },
];

const noop = vi.fn();

const renderResults = (over: Partial<React.ComponentProps<typeof SearchResults>> = {}) =>
  render(
    <SearchResults
      query="button"
      hits={hits}
      onDragStart={noop}
      onBlockDragStart={noop}
      onElClick={noop}
      onBlockInsert={noop}
      onSavedInsert={noop}
      onClearSearch={noop}
      {...over}
    />
  );

/* Board 4418:100087 (Insert · searching): each 32px row is the label, a grey
   [Element] / [Block] / [Component] chip right after it, then "+ Add" and a ⠿
   grip at the right edge. It replaced 138:53's uppercase group tag. */
describe("SearchResults — cross-source rows (4418:100087)", () => {
  it("one row per hit: label, a source chip, + Add and a grip", () => {
    renderResults();
    expect(screen.getByTestId("insert-search-results")).toBeInTheDocument();
    const chips = hits.map((h) => screen.getByTestId(`insert-hit-chip-${h.key}`).textContent);
    expect(chips).toEqual(["Element", "Block", "Component"]);
    expect(screen.queryByText("ELEMENTS")).toBeNull();
    expect(screen.queryByText("BLOCKS")).toBeNull();
    for (const h of hits) {
      expect(screen.getByTestId(`insert-hit-add-${h.key}`).textContent).toBe("+ Add");
      expect(screen.getByTestId(`insert-hit-grip-${h.key}`).textContent).toBe("⠿");
    }
  });

  it("has NO results header and NO category sections — the board draws neither", () => {
    renderResults();
    expect(screen.queryByText(/results? for/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Basic")).not.toBeInTheDocument();
  });

  it("element row click → onElClick with the entry", () => {
    const onElClick = vi.fn();
    renderResults({ onElClick });
    fireEvent.click(screen.getByTestId("insert-hit-el-basic-Button"));
    expect(onElClick).toHaveBeenCalledWith(el);
  });

  it("block row click and its + Add → onBlockInsert with the definition", () => {
    const onBlockInsert = vi.fn();
    renderResults({ onBlockInsert });
    fireEvent.click(screen.getByTestId("insert-hit-block-button-group"));
    fireEvent.click(screen.getByTestId("insert-hit-add-block-button-group"));
    expect(onBlockInsert).toHaveBeenCalledTimes(2);
    expect(onBlockInsert).toHaveBeenCalledWith(block);
  });

  it("saved component row → onSavedInsert", () => {
    const onSavedInsert = vi.fn();
    renderResults({ onSavedInsert });
    fireEvent.click(screen.getByTestId("insert-hit-saved-cmp-1"));
    expect(onSavedInsert).toHaveBeenCalledWith(saved);
  });

  it("every row is a drag source; a saved component drags as a component id", () => {
    renderResults();
    for (const h of hits) expect(screen.getByTestId(`insert-hit-${h.key}`)).toHaveAttribute("draggable", "true");
    const setData = vi.fn();
    fireEvent.dragStart(screen.getByTestId("insert-hit-saved-cmp-1"), { dataTransfer: { setData, effectAllowed: "" } });
    expect(setData).toHaveBeenCalledWith("application/x-aquibra-component", "cmp-1");
  });
});

describe("SearchResults — no results state (138:106)", () => {
  it("renders the board's exact copy — curly quotes, trailing period, no icon", () => {
    const { container } = renderResults({ query: "pizza oven", hits: [] });
    expect(screen.getByText("Nothing matches ‘pizza oven’.")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    // Board 138:106 draws NO icon in the empty state.
    expect(container.querySelector("svg")).toBeNull();
  });

  it("calls onClearSearch when Clear search is clicked", () => {
    const handleClear = vi.fn();
    renderResults({ query: "xyz", hits: [], onClearSearch: handleClear });
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(handleClear).toHaveBeenCalledTimes(1);
  });
});

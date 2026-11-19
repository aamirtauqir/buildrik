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
import type { InsertSearchHit } from "@/editor/sidebar/tabs/build/utils/search";
import type { FlatElEntry } from "@/editor/sidebar/tabs/build/catalog/types";
import type { BlockDefinition } from "@/blocks/blockRegistry";
import type { ComponentDefinition } from "@/shared/types/components";

const el: FlatElEntry = {
  name: "Button",
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
      onDragHint={noop}
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

  /* Drag-only Add (owner 2026-11-19): Enter / Space insert, a pointer click
     only hints. */
  it("element row Enter → onElClick with the entry", () => {
    const onElClick = vi.fn();
    renderResults({ onElClick });
    fireEvent.keyDown(screen.getByTestId("insert-hit-el-basic-Button"), { key: "Enter" });
    expect(onElClick).toHaveBeenCalledWith(el);
  });

  it("block row Enter and Space → onBlockInsert with the definition", () => {
    const onBlockInsert = vi.fn();
    renderResults({ onBlockInsert });
    fireEvent.keyDown(screen.getByTestId("insert-hit-block-button-group"), { key: "Enter" });
    fireEvent.keyDown(screen.getByTestId("insert-hit-block-button-group"), { key: " " });
    expect(onBlockInsert).toHaveBeenCalledTimes(2);
    expect(onBlockInsert).toHaveBeenCalledWith(block);
  });

  it("saved component row Enter → onSavedInsert", () => {
    const onSavedInsert = vi.fn();
    renderResults({ onSavedInsert });
    fireEvent.keyDown(screen.getByTestId("insert-hit-saved-cmp-1"), { key: "Enter" });
    expect(onSavedInsert).toHaveBeenCalledWith(saved);
  });

  it("a pointer click on any row (or its + Add) inserts nothing and asks for the hint", () => {
    const onElClick = vi.fn();
    const onBlockInsert = vi.fn();
    const onSavedInsert = vi.fn();
    const onDragHint = vi.fn();
    renderResults({ onElClick, onBlockInsert, onSavedInsert, onDragHint });
    fireEvent.click(screen.getByTestId("insert-hit-el-basic-Button"), { detail: 1 });
    fireEvent.click(screen.getByTestId("insert-hit-add-block-button-group"), { detail: 1 });
    fireEvent.click(screen.getByTestId("insert-hit-saved-cmp-1"), { detail: 1 });
    expect(onElClick).not.toHaveBeenCalled();
    expect(onBlockInsert).not.toHaveBeenCalled();
    expect(onSavedInsert).not.toHaveBeenCalled();
    expect(onDragHint).toHaveBeenCalledTimes(3);
    expect(onDragHint).toHaveBeenLastCalledWith(screen.getByTestId("insert-hit-saved-cmp-1"));
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

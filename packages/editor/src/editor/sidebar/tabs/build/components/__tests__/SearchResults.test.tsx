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

const hits: InsertSearchHit[] = [
  { key: "el-basic-Button", label: "Button", group: "ELEMENTS", el },
  { key: "block-button-group", label: "Button group", group: "BLOCKS", block },
];

const noop = vi.fn();

const renderResults = (over: Partial<React.ComponentProps<typeof SearchResults>> = {}) =>
  render(
    <SearchResults
      query="button"
      hits={hits}
      onDragStart={noop}
      onElClick={noop}
      onBlockInsert={noop}
      onClearSearch={noop}
      {...over}
    />
  );

describe("SearchResults — flat cross-source list (138:53)", () => {
  it("renders one flat row per hit with the source-group tag on the right", () => {
    renderResults();
    expect(screen.getByTestId("insert-search-results")).toBeInTheDocument();
    expect(screen.getByText("Button")).toBeInTheDocument();
    expect(screen.getByText("ELEMENTS")).toBeInTheDocument();
    expect(screen.getByText("Button group")).toBeInTheDocument();
    expect(screen.getByText("BLOCKS")).toBeInTheDocument();
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

  it("block row click → onBlockInsert with the definition", () => {
    const onBlockInsert = vi.fn();
    renderResults({ onBlockInsert });
    fireEvent.click(screen.getByTestId("insert-hit-block-button-group"));
    expect(onBlockInsert).toHaveBeenCalledWith(block);
  });

  it("element rows are draggable, block rows are not", () => {
    renderResults();
    expect(screen.getByTestId("insert-hit-el-basic-Button")).toHaveAttribute("draggable", "true");
    expect(screen.getByTestId("insert-hit-block-button-group")).toHaveAttribute("draggable", "false");
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

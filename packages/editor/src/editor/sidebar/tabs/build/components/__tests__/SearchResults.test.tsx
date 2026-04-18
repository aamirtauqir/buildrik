// @vitest-environment jsdom

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { SearchResults } from "../SearchResults";

// Mock ElCard to avoid pulling in its full dependency tree
vi.mock("../ElCard", () => ({
  ElCard: ({ el }: { el: { name: string } }) => (
    <div data-testid={`el-card-${el.name}`}>{el.name}</div>
  ),
}));

const noop = vi.fn();

describe("SearchResults — no results state", () => {
  it("renders the no-results headline when the query has no matches", () => {
    render(
      <SearchResults
        query="foobar"
        groups={[]}
        onDragStart={noop}
        onElClick={noop}
        onClearSearch={noop}
      />
    );
    expect(screen.getByText('Nothing matches "foobar"')).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("does NOT render the AI suggestion card (v4 removed)", () => {
    render(
      <SearchResults
        query="xyz"
        groups={[]}
        onDragStart={noop}
        onElClick={noop}
        onClearSearch={noop}
      />
    );
    expect(screen.queryByText(/Try describing what you need/)).not.toBeInTheDocument();
  });

  it("renders the Clear search button", () => {
    render(
      <SearchResults
        query="xyz"
        groups={[]}
        onDragStart={noop}
        onElClick={noop}
        onClearSearch={noop}
      />
    );
    expect(screen.getByRole("button", { name: "Clear search" })).toBeInTheDocument();
  });

  it("calls onClearSearch when Clear search is clicked", () => {
    const handleClear = vi.fn();
    render(
      <SearchResults
        query="xyz"
        groups={[]}
        onDragStart={noop}
        onElClick={noop}
        onClearSearch={handleClear}
      />
    );
    screen.getByRole("button", { name: "Clear search" }).click();
    expect(handleClear).toHaveBeenCalledTimes(1);
  });

  it("renders the no-results sparkle icon", () => {
    const { container } = render(
      <SearchResults
        query="xyz"
        groups={[]}
        onDragStart={noop}
        onElClick={noop}
        onClearSearch={noop}
      />
    );
    expect(container.querySelector(".bld-no-results-icon")).toBeTruthy();
  });
});

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
      />
    );
    expect(screen.getByText("No matching block in Add")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders the AI suggestion card body", () => {
    render(
      <SearchResults
        query="xyz"
        groups={[]}
        onDragStart={noop}
        onElClick={noop}
      />
    );
    expect(
      screen.getByText(/Try describing what you need/)
    ).toBeInTheDocument();
  });

  it("renders the slash-shortcut hint", () => {
    render(
      <SearchResults
        query="xyz"
        groups={[]}
        onDragStart={noop}
        onElClick={noop}
      />
    );
    expect(
      screen.getByText("/ opens AI outside the sidebar.")
    ).toBeInTheDocument();
  });

  it("renders the no-results sparkle icon", () => {
    const { container } = render(
      <SearchResults
        query="xyz"
        groups={[]}
        onDragStart={noop}
        onElClick={noop}
      />
    );
    expect(container.querySelector(".bld-no-results-icon")).toBeTruthy();
  });
});

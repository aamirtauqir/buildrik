// @vitest-environment jsdom

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { SearchResults } from "../SearchResults";

// Mock ElCard to avoid pulling in its full dependency tree
vi.mock("../ElCard", () => ({
  ElCard: ({ el }: { el: { name: string } }) => (
    <div data-testid={`el-card-${el.name}`}>{el.name}</div>
  ),
}));

const noop = vi.fn();

describe("SearchResults — no results / AI handoff", () => {
  it("renders no-results message when query has no matches", () => {
    render(
      <SearchResults
        query="foobar"
        groups={[]}
        onDragStart={noop}
        onElClick={noop}
      />
    );
    // The component renders `Nothing matches "{query}"` with HTML entity
    // left/right double quotes (&ldquo;/&rdquo;). Match the stable prefix
    // so the test doesn't break on copy tweaks or query interpolation.
    expect(screen.getByText(/Nothing matches/)).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows AI handoff section with Sparkles icon", () => {
    const { container } = render(
      <SearchResults
        query="xyz"
        groups={[]}
        onDragStart={noop}
        onElClick={noop}
        onAiHandoff={noop}
      />
    );
    // Component uses `Can&rsquo;t` (HTML entity), which renders as the
    // curly right single quote (U+2019), not a straight ASCII apostrophe.
    expect(screen.getByText("Can\u2019t find what you need?")).toBeInTheDocument();
    expect(container.querySelector(".bld-ai-handoff-icon")).toBeTruthy();
  });

  it("shows Try AI card with Cmd+K shortcut badge", () => {
    render(
      <SearchResults
        query="xyz"
        groups={[]}
        onDragStart={noop}
        onElClick={noop}
        onAiHandoff={noop}
      />
    );
    expect(
      screen.getByText("Try AI to generate custom elements")
    ).toBeInTheDocument();
    expect(screen.getByText("\u2318 + K")).toBeInTheDocument();
  });

  it("calls onAiHandoff when AI card clicked", () => {
    const onAiHandoff = vi.fn();
    render(
      <SearchResults
        query="xyz"
        groups={[]}
        onDragStart={noop}
        onElClick={noop}
        onAiHandoff={onAiHandoff}
      />
    );
    fireEvent.click(screen.getByText("Try AI to generate custom elements"));
    expect(onAiHandoff).toHaveBeenCalledTimes(1);
  });
});

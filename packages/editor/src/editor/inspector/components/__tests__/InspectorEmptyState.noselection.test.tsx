/**
 * InspectorEmptyState — no selection, board 4428:44164 (v3).
 *
 * A centred "Nothing selected" over a two-line hint, and nothing else — no
 * AI link (the header's ✦ AI is the door once something is selected), no
 * CTA buttons.
 */
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { InspectorEmptyState } from "../InspectorEmptyState";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeComposer = () => ({ emit: vi.fn() }) as any;

describe("InspectorEmptyState — no selection", () => {
  it("says Nothing selected, then what to do", () => {
    render(<InspectorEmptyState composer={makeComposer()} />);
    expect(screen.getByTestId("inspector-empty-title")).toHaveTextContent("Nothing selected");
    expect(screen.getByTestId("inspector-empty-text")).toHaveTextContent(
      "Click an element on the canvas to edit its style, settings and effects.",
    );
  });

  it("is centred and carries no link or CTA", () => {
    render(<InspectorEmptyState composer={makeComposer()} />);
    const box = screen.getByTestId("inspector-empty");
    expect(box.className).toMatch(/tw:justify-center/);
    expect(box.className).toMatch(/tw:items-center/);
    expect(box.querySelectorAll("button")).toHaveLength(0);
  });
});

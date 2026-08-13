/**
 * InspectorEmptyState — no selection, board 159:99.
 *
 * The board draws two lines: a muted sentence and one accent link to the AI.
 * What it replaced was six blocks of chrome — icon circle, h3, description, two
 * CTA buttons and a keyboard tip — for "nothing is selected". Nothing here
 * covered any of that, which is why the rewrite ran green before these existed.
 */
import { render, fireEvent, screen } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { InspectorEmptyState } from "../InspectorEmptyState";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeComposer = () => ({ emit: vi.fn() }) as any;

describe("InspectorEmptyState — no selection", () => {
  it("says what to do in one sentence", () => {
    render(<InspectorEmptyState composer={makeComposer()} />);
    expect(screen.getByText("Select something on the canvas to edit it.")).toBeTruthy();
  });

  it("offers the AI entry and nothing else", () => {
    render(<InspectorEmptyState composer={makeComposer()} />);
    expect(screen.getByTestId("inspector-empty-ask-ai")).toBeTruthy();
    // The two CTAs the board dropped. Their destinations live on the rail and
    // in the command palette; an empty panel no longer advertises them.
    expect(screen.queryByText(/Open Build Panel/i)).toBeNull();
    expect(screen.queryByText(/Browse Templates/i)).toBeNull();
    expect(screen.queryByText(/Nothing Selected/i)).toBeNull();
  });

  it("routes Ask AI to the AI panel", () => {
    const composer = makeComposer();
    render(<InspectorEmptyState composer={composer} />);
    fireEvent.click(screen.getByTestId("inspector-empty-ask-ai"));
    expect(composer.emit).toHaveBeenCalledWith("ui:switch-tab", { tab: "ai" });
  });

  it("renders the sentence without a composer, and no dead link", () => {
    render(<InspectorEmptyState composer={null} />);
    expect(screen.getByText("Select something on the canvas to edit it.")).toBeTruthy();
    expect(screen.queryByTestId("inspector-empty-ask-ai")).toBeNull();
  });
});

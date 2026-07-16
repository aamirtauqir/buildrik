/**
 * MultiSelectToolbar — alignment / distribution gating (align needs 2+,
 * distribute needs 3+), handler wiring, and the batch panel's Mixed labelling.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { TooltipProvider } from "@/editor/shared/vibcoder/Tooltip";
import { MultiSelectToolbar } from "../MultiSelectToolbar";
import { AlignmentHandler } from "@/engine/canvas/AlignmentHandler";
import { makeMockElement, makeMockComposer } from "@/editor/inspector/__tests__/harness";

function renderToolbar(
  selectedIds: string[],
  composer: unknown = makeMockComposer(),
) {
  return render(
    <TooltipProvider>
      <MultiSelectToolbar selectedIds={selectedIds} composer={composer as never} />
    </TooltipProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("MultiSelectToolbar — gating", () => {
  it("shows the selection count", () => {
    renderToolbar(["a", "b"]);
    expect(screen.getByText("2 elements selected")).toBeInTheDocument();
  });

  it("disables alignment when no composer is present", () => {
    renderToolbar(["a", "b"], null);
    expect(screen.getByRole("button", { name: "Align elements to left" })).toBeDisabled();
  });

  it("disables alignment with a single element and hides the batch panel", () => {
    renderToolbar(["a"]);
    expect(screen.getByRole("button", { name: "Align elements to left" })).toBeDisabled();
    expect(screen.queryByText(/Batch Edit/)).not.toBeInTheDocument();
  });

  it("enables alignment at 2 but keeps distribution disabled", () => {
    renderToolbar(["a", "b"]);
    expect(screen.getByRole("button", { name: "Align elements to left" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Distribute elements horizontally with equal spacing" })
    ).toBeDisabled();
  });

  it("enables distribution at 3 elements", () => {
    renderToolbar(["a", "b", "c"]);
    expect(
      screen.getByRole("button", { name: "Distribute elements horizontally with equal spacing" })
    ).toBeEnabled();
  });
});

describe("MultiSelectToolbar — handler wiring", () => {
  it("clicking Align Left calls alignHorizontal(ids, 'left')", () => {
    const spy = vi.spyOn(AlignmentHandler.prototype, "alignHorizontal").mockImplementation(() => {});
    renderToolbar(["a", "b"]);
    fireEvent.click(screen.getByRole("button", { name: "Align elements to left" }));
    expect(spy).toHaveBeenCalledWith(["a", "b"], "left");
  });

  it("clicking Align Middle calls alignVertical(ids, 'middle')", () => {
    const spy = vi.spyOn(AlignmentHandler.prototype, "alignVertical").mockImplementation(() => {});
    renderToolbar(["a", "b"]);
    fireEvent.click(screen.getByRole("button", { name: "Align elements to middle vertically" }));
    expect(spy).toHaveBeenCalledWith(["a", "b"], "middle");
  });

  it("clicking Distribute Horizontally calls distribute(ids, 'horizontal')", () => {
    const spy = vi.spyOn(AlignmentHandler.prototype, "distribute").mockImplementation(() => {});
    renderToolbar(["a", "b", "c"]);
    fireEvent.click(
      screen.getByRole("button", { name: "Distribute elements horizontally with equal spacing" })
    );
    expect(spy).toHaveBeenCalledWith(["a", "b", "c"], "horizontal");
  });
});

describe("MultiSelectToolbar — batch panel Mixed labelling", () => {
  it("labels a field 'Mixed' when a property differs across the selection", () => {
    const e1 = makeMockElement({ id: "e1", styles: { "background-color": "#ff0000" } });
    const e2 = makeMockElement({ id: "e2", styles: { "background-color": "#0000ff" } });
    const composer = makeMockComposer({ elements: [e1, e2] });
    renderToolbar(["e1", "e2"], composer);
    expect(screen.getByText("Background · Mixed")).toBeInTheDocument();
    expect(screen.getByText(/differ across selection/)).toBeInTheDocument();
  });
});

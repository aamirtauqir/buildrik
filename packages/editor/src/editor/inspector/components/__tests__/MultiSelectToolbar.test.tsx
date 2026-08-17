/**
 * MultiSelectToolbar — alignment / distribution gating (align needs 2+,
 * distribute needs 3+), handler wiring, and the batch panel's Mixed labelling.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { MultiSelectToolbar } from "../MultiSelectToolbar";
import { AlignmentHandler } from "@/engine/canvas/AlignmentHandler";
import { makeMockElement, makeMockComposer } from "@/editor/inspector/__tests__/harness";

function renderToolbar(
  selectedIds: string[],
  composer: unknown = makeMockComposer(),
) {
  return render(
    <MultiSelectToolbar selectedIds={selectedIds} composer={composer as never} />
  );
}

afterEach(() => vi.restoreAllMocks());

describe("MultiSelectToolbar — gating", () => {
  /* Board 159:123 reads "2 selected". The panel is already the element
     inspector, so the noun was doing no work. */
  it("shows the selection count", () => {
    renderToolbar(["a", "b"]);
    expect(screen.getByText("2 selected")).toBeInTheDocument();
  });

  it("carries the same AI entry the single-selection header does", () => {
    renderToolbar(["a", "b"]);
    expect(screen.getByTestId("multiselect-ai-chip")).toBeInTheDocument();
  });

  it("renders no AI entry without a composer to route it", () => {
    renderToolbar(["a", "b"], null);
    expect(screen.queryByTestId("multiselect-ai-chip")).toBeNull();
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
  /* Board 159:123 — the row keeps its own name and the empty field says
     "Mixed", with one sentence under the fields saying what editing it does. */
  it("says 'Mixed' inside the field when a property differs across the selection", () => {
    const e1 = makeMockElement({ id: "e1", styles: { "background-color": "#ff0000" } });
    const e2 = makeMockElement({ id: "e2", styles: { "background-color": "#0000ff" } });
    const composer = makeMockComposer({ elements: [e1, e2] });
    renderToolbar(["e1", "e2"], composer);
    expect(screen.getByText("Background")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Mixed")).toBeInTheDocument();
    expect(
      screen.getByText("Editing a Mixed field applies it to all 2.")
    ).toBeInTheDocument();
  });
});


describe("MultiSelectToolbar — board 159:123 bands ALIGN, and only ALIGN", () => {
  /* The board draws a full-width tinted strip holding the ALIGN label AND its
     six buttons, with DISTRIBUTE plain on the panel below. The tint used to
     sit on the button GROUP in both sections instead: ALIGN's band spanned the
     full width at a 4% contrast step and read as nothing, while DISTRIBUTE got
     a grey pill the board does not draw. Measured off the frame — the band is
     #F3F4F6 (`--bk-bg-subtle`) from the ALIGN label down through its buttons,
     and white from DISTRIBUTE onward. */
  const sectionOf = (label: string) => {
    const heading = screen.getByText(label);
    return heading.parentElement as HTMLElement;
  };

  it("tints the ALIGN section", () => {
    renderToolbar(["a", "b", "c"]);
    expect(sectionOf("Align").style.background).toContain("--bk-bg-subtle");
  });

  it("leaves DISTRIBUTE on the plain panel", () => {
    renderToolbar(["a", "b", "c"]);
    expect(sectionOf("Distribute").style.background).toBe("");
  });

  it("gives the banded buttons an edge — transparent on a tint has none", () => {
    renderToolbar(["a", "b", "c"]);
    const align = screen.getByRole("button", { name: "Align elements to left" });
    expect(align.className).toContain("tw:bg-white");
    expect(align.className).not.toContain("tw:bg-transparent");
  });
});

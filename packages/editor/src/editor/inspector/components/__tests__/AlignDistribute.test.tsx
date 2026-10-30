/**
 * AlignDistribute — 2L9 B04 (247:29578): "Align and distribute" heads a
 * multi-selection's Style tab — Reference (the selection's bounds), Align ×6,
 * Distribute Horizontal / Vertical (disabled under 3). Real Composer.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "@/engine/__tests__/test-utils/realComposer";
import { AlignmentHandler } from "@/engine/canvas/AlignmentHandler";
import { AlignDistribute } from "../AlignDistribute";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function setup(count: number) {
  const composer = createTestComposer();
  const page = composer.elements.createPage("Home");
  const ids = Array.from({ length: count }, (_, i) => {
    const h = composer.elements.createElement("heading", { content: `H${i}` });
    composer.elements.addElement(h, page.root.id);
    return h.getId();
  });
  render(<AlignDistribute composer={composer} selectedIds={ids} />);
  return { composer, ids };
}

describe("AlignDistribute — B04", () => {
  it("titled 'Align and distribute', with the reference the engine measures against", () => {
    setup(2);
    expect(screen.getByRole("heading", { name: "Align and distribute" })).toBeInTheDocument();
    const ref = screen.getByLabelText("Reference") as HTMLSelectElement;
    expect([...ref.options].map((o) => o.textContent)).toEqual(["Selection bounds"]);
  });

  it("six align actions, named for a screen reader; none stays lit", () => {
    setup(2);
    const group = screen.getByRole("group", { name: "Align" });
    const names = within(group).getAllByRole("button").map((b) => b.getAttribute("aria-label"));
    expect(names).toEqual(["Align left", "Align centre", "Align right", "Align top", "Align middle", "Align bottom"]);
    for (const b of within(group).getAllByRole("button")) expect(b).not.toHaveAttribute("aria-pressed");
  });

  it("an align action runs the engine's alignment on the whole selection", () => {
    const spy = vi.spyOn(AlignmentHandler.prototype, "alignHorizontal").mockImplementation(() => undefined);
    const { ids } = setup(2);
    fireEvent.click(screen.getByRole("button", { name: "Align left" }));
    expect(spy).toHaveBeenCalledWith(ids, "left");
  });

  it("Distribute is disabled under 3, enabled at 3", () => {
    setup(2);
    expect(screen.getByTestId("inspector-multi-distribute-h")).toBeDisabled();
    expect(screen.getByTestId("inspector-multi-distribute-v")).toBeDisabled();
    cleanup();
    const spy = vi.spyOn(AlignmentHandler.prototype, "distribute").mockImplementation(() => undefined);
    const { ids } = setup(3);
    expect(screen.getByTestId("inspector-multi-distribute-h")).toBeEnabled();
    fireEvent.click(screen.getByTestId("inspector-multi-distribute-v"));
    expect(spy).toHaveBeenCalledWith(ids, "vertical");
  });

});

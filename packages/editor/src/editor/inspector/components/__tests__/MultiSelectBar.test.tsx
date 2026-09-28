/**
 * MultiSelectBar — board 22: Align ×6, Distribute Horizontal / Vertical
 * (disabled under 3), Group, and "Edits apply to all N. One Undo restores
 * all N." Real Composer.
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
import { MultiSelectBar } from "../MultiSelectBar";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function setup(count: number, splitParents = false) {
  const composer = createTestComposer();
  const page = composer.elements.createPage("Home");
  const box = composer.elements.createElement("container");
  composer.elements.addElement(box, page.root.id);
  const ids = Array.from({ length: count }, (_, i) => {
    const h = composer.elements.createElement("heading", { content: `H${i}` });
    composer.elements.addElement(h, splitParents && i === 0 ? page.root.id : box.getId());
    return h.getId();
  });
  render(<MultiSelectBar composer={composer} selectedIds={ids} />);
  return { composer, ids };
}

describe("MultiSelectBar — board 22", () => {
  it("rows in board order: Align, Distribute, Group, then the note", () => {
    setup(3);
    const bar = screen.getByTestId("inspector-multi-bar");
    expect(bar.textContent).toMatch(/^Align.*Distribute.*Horizontal.*Vertical.*Group.*Edits apply to all 3\. One Undo restores all 3\.$/);
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

  it("Group runs the group command when the selection shares a parent", () => {
    const { composer } = setup(3);
    const run = vi.spyOn(composer.commands, "run");
    fireEvent.click(screen.getByTestId("inspector-multi-group"));
    expect(run).toHaveBeenCalledWith("group");
  });

  it("Group is shut, with the reason, when the parents differ", () => {
    setup(3, true);
    expect(screen.getByTestId("inspector-multi-group")).toBeDisabled();
    expect(screen.getByTitle("Group needs elements that share a parent")).toBeInTheDocument();
  });
});

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ProInspector } from "../ProInspector";

const makeComposer = () => ({
  elements: { getElement: vi.fn(() => null) },
  selection: {
    getSelected: vi.fn(() => null),
    getAllSelected: vi.fn(() => []),
    select: vi.fn(),
    clear: vi.fn(),
  },
  styles: null,
  history: { canUndo: vi.fn(() => false), canRedo: vi.fn(() => false) },
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
});

const el = { id: "abc12345678", type: "container" };

describe("Element actions overflow menu — delete entry", () => {
  it("exposes a Delete menu item with an SVG icon (not emoji)", () => {
    render(
      <ProInspector selectedElement={el} composer={makeComposer() as never} onDelete={vi.fn()} />
    );

    // The standalone delete button was replaced by a three-dot overflow menu.
    // Open the menu and assert the Delete option is present.
    fireEvent.click(screen.getByRole("button", { name: /element actions/i }));
    const deleteItem = screen.getByRole("menuitem", { name: /^delete$/i });
    expect(deleteItem.querySelector("svg")).not.toBeNull();
    expect(deleteItem.textContent?.trim()).not.toBe("🗑️");
  });
});

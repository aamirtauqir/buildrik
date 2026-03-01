import { render, screen } from "@testing-library/react";
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

describe("Delete button — SVG not emoji", () => {
  it("renders delete button with SVG icon, not emoji", () => {
    const { container: _container } = render(
      <ProInspector selectedElement={el} composer={makeComposer() as never} onDelete={vi.fn()} />
    );
    const deleteBtn = screen.getByRole("button", { name: /delete selected element/i });
    // Should contain SVG, not the trash emoji text
    expect(deleteBtn.querySelector("svg")).not.toBeNull();
    expect(deleteBtn.textContent?.trim()).not.toBe("🗑️");
  });
});

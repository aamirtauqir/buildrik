import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
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

const el = { id: "xyzabc12345678", type: "container" };

describe("Element ID — click to copy", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("renders element ID as a button", () => {
    render(<ProInspector selectedElement={el} composer={makeComposer() as never} />);
    // The ID shows the last 8 chars
    expect(screen.getByRole("button", { name: /copy element id/i })).toBeInTheDocument();
  });

  it("calls clipboard.writeText with full element id on click", async () => {
    render(<ProInspector selectedElement={el} composer={makeComposer() as never} />);
    const copyBtn = screen.getByRole("button", { name: /copy element id/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("#xyzabc12345678");
  });
});

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ProInspector } from "../ProInspector";
import { ToastProvider } from "@/editor/chrome-ui";

/* ProInspector mounts DetachInstanceButton, which reports a refused detach
   rather than swallowing it — so it needs the toast context. AquibraStudio
   wraps the whole studio in one, so every real mount has it and only these
   tests rendered the subtree bare. */
const renderWithToast = (ui: React.ReactNode) => render(<ToastProvider>{ui}</ToastProvider>);


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
  isProjectLoading: () => false,
});

const el = { id: "abc12345678", type: "container" };

describe("Element actions overflow menu — delete entry", () => {
  it("exposes a Delete menu item with an SVG icon (not emoji)", () => {
    renderWithToast(
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

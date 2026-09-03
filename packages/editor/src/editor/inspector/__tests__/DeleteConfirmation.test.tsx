import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ProInspector } from "../ProInspector";
import { ToastProvider } from "@/editor/chrome-ui";

/* ProInspector mounts DetachInstanceButton, which reports a refused detach
   rather than swallowing it — so it needs the toast context. AquibraStudio
   wraps the whole studio in one, so every real mount has it and only these
   tests rendered the subtree bare. */
const renderWithToast = (ui: React.ReactNode) => render(<ToastProvider>{ui}</ToastProvider>);


// A minimal composer mock that satisfies all hooks used by ProInspector.
// - useComposerSelection needs selection.getSelected / getAllSelected
// - useStyleHandlers returns early when elements.getElement returns null (safe)
// - styles: null is intentional — useStyleHandlers guards with `if (composer.styles)`
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

const selectedElement = { id: "abc12345678", type: "container", tag: "div" };

// Helper: open the element actions menu then click Delete. Replaces the old
// direct "delete selected element" button that was absorbed into the overflow
// menu in Phase 5.
const openDeleteConfirmation = () => {
  fireEvent.click(screen.getByRole("button", { name: /element actions/i }));
  fireEvent.click(screen.getByRole("menuitem", { name: /^delete$/i }));
};

describe("Delete confirmation modal — copy", () => {
  it("does NOT say 'cannot be undone'", () => {
    renderWithToast(
      <ProInspector
        selectedElement={selectedElement as never}
        composer={makeComposer() as never}
        onDelete={vi.fn()}
      />
    );
    openDeleteConfirmation();
    expect(screen.queryByText(/cannot be undone/i)).not.toBeInTheDocument();
  });

  it("mentions Ctrl+Z undo hint", () => {
    renderWithToast(
      <ProInspector
        selectedElement={selectedElement as never}
        composer={makeComposer() as never}
        onDelete={vi.fn()}
      />
    );
    openDeleteConfirmation();
    expect(screen.getByRole("alert")).toHaveTextContent(/ctrl\+z/i);
  });
});

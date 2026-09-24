import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ProInspector } from "../ProInspector";
import { ToastProvider } from "@/editor/chrome-ui";

/* ProInspector mounts VariantSection, which reports a refused detach
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

// Helper: open the element actions menu then click Delete.
const clickMenuDelete = () => {
  fireEvent.click(screen.getByRole("button", { name: /element actions/i }));
  fireEvent.click(screen.getByRole("menuitem", { name: /^delete$/i }));
};

/* Decision #17 (plan 2026-09-21): one element deletes at once, with the Undo
   toast the shell's handler raises. The confirm modal that stood here is for
   N > 1 (MultiSelectToolbar) and component masters (the Components panel). */
describe("Inspector ⋯ Delete — instant, no confirm for one element", () => {
  it("calls onDelete straight from the menu item, without a dialog", () => {
    const onDelete = vi.fn();
    renderWithToast(
      <ProInspector
        selectedElement={selectedElement as never}
        composer={makeComposer() as never}
        onDelete={onDelete}
      />
    );
    clickMenuDelete();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onDelete).toHaveBeenCalledWith("abc12345678");
  });
});

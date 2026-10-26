/**
 * UnsavedWarningModal + PageSettingsDrawer — board 1171:4820's two exits.
 *
 * The board draws TWO actions: Keep editing (accent, safe) and Discard
 * changes (error outline). "Save & Switch" left with the third button —
 * the drawer autosaves 500ms after any change, so the only unsaved state
 * this modal can guard is a failed save or one still inside that window.
 *
 * REGRESSION: the drawer opens this same modal on a guarded CLOSE, but
 * Discard only ever called confirmTabChange() — with no pending tab that
 * is a no-op, so discarding while closing left the drawer sitting open.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UnsavedWarningModal } from "../UnsavedWarningModal";

const props = { pageName: "About", stays: "Home", onSaveAndLeave: vi.fn() };

describe("UnsavedWarningModal (design-2l9 board 63:18758)", () => {
  /* #20 made the three tabs one form, so the prompt only guards CLOSING
     now — it says so instead of naming one tab's fields ("Leaving this tab"
     was about the retired tab-switch guard). */
  /* Re-baseline: the guard is "Leave without saving?" with three actions. */
  it("names the page, and offers Keep editing · Discard changes · Save and leave", () => {
    const onSaveAndLeave = vi.fn();
    render(<UnsavedWarningModal isOpen onDiscard={vi.fn()} onCancel={vi.fn()} {...props} onSaveAndLeave={onSaveAndLeave} />);
    expect(screen.getByText("Leave without saving?")).toBeInTheDocument();
    expect(screen.getByTestId("pages-unsaved-body")).toHaveTextContent(
      "You have unsaved page settings for About. Save or discard them to return to Pages, or keep editing. Home stays open.",
    );
    expect(screen.getByRole("button", { name: /keep editing/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /discard the unsaved changes/i })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("pages-unsaved-save"));
    expect(onSaveAndLeave).toHaveBeenCalledTimes(1);
  });

  it("Keep editing cancels, Discard discards", () => {
    const onDiscard = vi.fn();
    const onCancel = vi.fn();
    render(
      <UnsavedWarningModal isOpen onDiscard={onDiscard} onCancel={onCancel} {...props} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /keep editing/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /discard the unsaved changes/i }));
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  // The safe action takes focus: the destructive one must never be one stray
  // Enter away from a modal that just appeared.
  it("focus lands on Keep editing, not on Discard", () => {
    render(
      <UnsavedWarningModal isOpen onDiscard={vi.fn()} onCancel={vi.fn()} {...props} />,
    );
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: /keep editing/i }),
    );
  });
});

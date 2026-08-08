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

describe("UnsavedWarningModal (board 1171:4820)", () => {
  it("names the tab's edits and offers exactly the board's two actions", () => {
    render(
      <UnsavedWarningModal isOpen pendingTab="seo" onDiscard={vi.fn()} onCancel={vi.fn()} />,
    );
    expect(screen.getByText("Discard unsaved SEO changes?")).toBeInTheDocument();
    expect(screen.getByText(/page title and description/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /keep editing/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /discard the unsaved changes/i })).toBeInTheDocument();
    expect(screen.queryByText(/Save & Switch/i)).toBeNull();
  });

  it("titles itself per tab — Social names the social fields", () => {
    render(
      <UnsavedWarningModal isOpen pendingTab="social" onDiscard={vi.fn()} onCancel={vi.fn()} />,
    );
    expect(screen.getByText("Discard unsaved Social changes?")).toBeInTheDocument();
    expect(screen.getByText(/social title, description and image/)).toBeInTheDocument();
  });

  it("Keep editing cancels, Discard discards", () => {
    const onDiscard = vi.fn();
    const onCancel = vi.fn();
    render(
      <UnsavedWarningModal isOpen pendingTab="seo" onDiscard={onDiscard} onCancel={onCancel} />,
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
      <UnsavedWarningModal isOpen pendingTab="seo" onDiscard={vi.fn()} onCancel={vi.fn()} />,
    );
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: /keep editing/i }),
    );
  });
});

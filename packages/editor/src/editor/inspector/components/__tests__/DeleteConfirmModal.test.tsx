/**
 * DeleteConfirmModal — board 1706:8458 (Modal · Inspector · delete-confirm).
 *
 * No test file existed for this component: every mount point
 * (ProInspector.branches.test.tsx, ProInspector.p4States.test.tsx,
 * ProInspector.createCollectionThreading.test.tsx) mocks it to `() => null`.
 *
 * VERIFIED LIVE 2026-09-04 at :5099, 1440x900, Container inserted then
 * deleted via Element actions -> Delete: panel 720x134 (board 720x132),
 * Close 32x32, Cancel 88.5x28, "Delete Container" 152x28 — the footer's
 * buttons are both 28 tall now, not flowbite's 40. That fix lives in
 * `MODAL_FOOT_CLASS`'s `[&_button]:h-7` descendant selector (Modal.tsx),
 * which jsdom does not compute layout for, so these tests lock in the
 * STRUCTURE the fix depends on (a real ModalFooter, not a hand-rolled flex
 * row) rather than re-measuring pixels.
 *
 * @license BSD-3-Clause
 */
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { DeleteConfirmModal } from "../DeleteConfirmModal";

describe("DeleteConfirmModal", () => {
  it("names what it will destroy in the title and the confirm button", () => {
    render(
      <DeleteConfirmModal
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        elementLabel="Hero Section"
      />
    );
    expect(screen.getByText("Delete Hero Section?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete Hero Section" })).toBeInTheDocument();
  });

  /* The code contract wins on behaviour: a delete here is one undo step,
     not the board's sample "This cannot be undone". */
  it("says the delete is undoable, not that it's permanent", () => {
    render(
      <DeleteConfirmModal isOpen onClose={vi.fn()} onConfirm={vi.fn()} elementLabel="Card" />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Ctrl+Z");
    expect(screen.queryByText(/cannot be undone/i)).toBeNull();
  });

  it("Cancel closes without confirming, Delete confirms", () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <DeleteConfirmModal isOpen onClose={onClose} onConfirm={onConfirm} elementLabel="Card" />
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Delete Card" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when closed", () => {
    render(
      <DeleteConfirmModal isOpen={false} onClose={vi.fn()} onConfirm={vi.fn()} elementLabel="Card" />
    );
    expect(screen.queryByText(/Delete Card\?/)).toBeNull();
  });

  /* Board 1706:8462's footer buttons are capped at 28 tall by
     MODAL_FOOT_CLASS's `[&_button]:h-7` descendant selector — which only
     reaches buttons that are actual DESCENDANTS of a real ModalFooter. A
     hand-rolled flex row inside ModalBody (the shape that shipped 40-tall
     buttons) would not carry this class at all. */
  it("puts both footer buttons inside a real ModalFooter", () => {
    render(
      <DeleteConfirmModal isOpen onClose={vi.fn()} onConfirm={vi.fn()} elementLabel="Card" />
    );
    const cancel = screen.getByRole("button", { name: "Cancel" });
    const confirm = screen.getByRole("button", { name: "Delete Card" });
    // MODAL_FOOT_CLASS carries this exact utility pair — its presence on the
    // shared parent is what caps every button inside it at 28.
    const footer = cancel.parentElement;
    expect(footer?.className).toContain("tw:[&_button]:h-7");
    expect(footer).toContainElement(confirm);
  });
});

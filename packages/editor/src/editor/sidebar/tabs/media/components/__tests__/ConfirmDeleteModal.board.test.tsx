/**
 * ConfirmDeleteModal — board 1175:4827.
 *
 * REGRESSION: this file referenced `.med-modal-*` classes whose CSS was
 * deleted on 2026-04-11 (ab72ef18). The modal that guards deleting dozens of
 * files rendered unstyled for four months — no warning tint, no red on the
 * destructive button — because an orphan className fails nothing. Styles are
 * inline `tw:` utilities now, so the same drift cannot repeat silently.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDeleteModal } from "../ConfirmDeleteModal";
import type { ConfirmDeletePayload } from "../../data/mediaTypes";

function payload(over: Partial<ConfirmDeletePayload> = {}): ConfirmDeletePayload {
  return {
    keys: Array.from({ length: 34 }, (_, i) => `k${i}`),
    names: Array.from({ length: 34 }, (_, i) => `file-${i}.jpg`),
    inUseCount: 5,
    isBulk: true,
    ...over,
  } as ConfirmDeletePayload;
}

describe("ConfirmDeleteModal (board 1175:4827)", () => {
  it("names the count in both the title and the destructive button", () => {
    render(<ConfirmDeleteModal payload={payload()} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("Delete 34 files?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete 34 files" })).toBeInTheDocument();
  });

  it("warns that in-use files will break the elements that reference them", () => {
    render(<ConfirmDeleteModal payload={payload()} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole("alert").textContent).toMatch(
      /5 files are currently used on the canvas/,
    );
  });

  // The Button doc's rule: "disabled without a reason is a bug."
  it("says WHY delete is disabled while the typed word does not match", () => {
    render(<ConfirmDeleteModal payload={payload()} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(
      screen.getByText("Delete stays disabled until the word matches exactly."),
    ).toBeInTheDocument();
  });

  it("the gate only opens on an exact DELETE, and the hint leaves with it", () => {
    const onConfirm = vi.fn();
    render(<ConfirmDeleteModal payload={payload()} onConfirm={onConfirm} onCancel={vi.fn()} />);
    const input = screen.getByLabelText("Type DELETE to confirm");
    const button = screen.getByRole("button", { name: "Delete 34 files" });

    fireEvent.change(input, { target: { value: "delete" } });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "DELETE" } });
    expect(button).not.toBeDisabled();
    expect(screen.queryByText(/stays disabled/)).toBeNull();
    fireEvent.click(button);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("a small delete needs no typing gate at all", () => {
    render(
      <ConfirmDeleteModal
        payload={payload({ keys: ["k1"], names: ["one.jpg"], inUseCount: 0, isBulk: false })}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("Delete file?")).toBeInTheDocument();
    expect(screen.queryByLabelText("Type DELETE to confirm")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("button", { name: "Delete" })).not.toBeDisabled();
  });

  it("lists the first few names and counts the rest", () => {
    render(<ConfirmDeleteModal payload={payload()} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("file-0.jpg")).toBeInTheDocument();
    expect(screen.getByText("and 31 more")).toBeInTheDocument();
  });
});

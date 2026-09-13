/**
 * ConfirmDeleteModal — the >20-file typed gate, board 1175:4827.
 *
 * The Clone (3701:20385, "Delete 2 selected files?") displaces this board's
 * copy — its "Delete 34 files?" title, 📄 name list and amber in-use alert are
 * gone — but the gate itself is a data-safety door the Clone never draws, so
 * it stays exactly as the board specified it: the word must match, the button
 * holds the error fill while it does not, and the reason is printed under it.
 *
 * REGRESSION: this file referenced `.med-modal-*` classes whose CSS was
 * deleted on 2026-04-11 (ab72ef18). The modal that guards deleting dozens of
 * files rendered unstyled for four months — no red on the destructive button
 * — because an orphan className fails nothing. Styles are inline `tw:`
 * utilities now, so the same drift cannot repeat silently.
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
    inUse: Array.from({ length: 5 }, (_, i) => ({ key: `k${i}`, name: `file-${i}`, count: 1, pages: ["Home"] })),
    isBulk: true,
    ...over,
    /* The `as ConfirmDeletePayload` that used to close this object is why
       adding a required field compiled clean here and then threw at runtime in
       five tests. A cast on a fixture turns a type error into a crash. */
  };
}

describe("ConfirmDeleteModal (board 1175:4827 — the >20 gate, under Clone 3701:20385 copy)", () => {
  it("names the count in both the title and the destructive button", () => {
    render(<ConfirmDeleteModal payload={payload()} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByTestId("media-delete-title")).toHaveTextContent("Delete 34 selected files?");
    expect(screen.getByRole("button", { name: "Delete 34 files" })).toBeInTheDocument();
  });

  it("totals the placements across the set in the Clone's one sentence, not an alert band", () => {
    render(<ConfirmDeleteModal payload={payload()} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByTestId("media-delete-body")).toHaveTextContent(/and 29 more will be permanently deleted\. This affects 5 placements\.$/);
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

  /* Board 1175:4838 draws Delete in --color/error WHILE the gate is up. */
  it("holds the error fill while disabled instead of flowbite's grey swap", () => {
    render(<ConfirmDeleteModal payload={payload()} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    const button = screen.getByTestId("media-delete-confirm");
    expect(button).toBeDisabled();
    expect(button.className).toMatch(/tw:disabled:bg-\[var\(--bk-error\)\]/);
  });

  it("a small delete needs no typing gate at all", () => {
    render(
      <ConfirmDeleteModal
        payload={payload({ keys: ["k1"], names: ["one.jpg"], inUseCount: 0, inUse: [], isBulk: false })}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByTestId("media-delete-title")).toHaveTextContent("Delete one.jpg?");
    expect(screen.queryByLabelText("Type DELETE to confirm")).toBeNull();
    expect(screen.getByRole("button", { name: "Delete permanently" })).not.toBeDisabled();
  });
});

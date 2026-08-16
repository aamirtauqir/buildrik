/**
 * ConfirmDeleteModal — the destructive gate, rendered for real.
 *
 * Written 2026-08-01 to close a coverage hole the final whole-branch review
 * named: the only other test that touches this component mocks it to
 * `() => null`, so the most destructive path in the media library had no
 * render coverage at all. It also carries the regression guard for the
 * flowbite migration's TextField fix — `.bk-input` lost every CSS rule when
 * `editor/ui/ui.css` was deleted, which left this exact confirmation input
 * rendering as an unstyled browser default.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDeleteModal } from "../ConfirmDeleteModal";
import type { ConfirmDeletePayload } from "../../data/mediaTypes";

const payload = (over: Partial<ConfirmDeletePayload> = {}): ConfirmDeletePayload => ({
  keys: ["a"],
  names: ["one.png"],
  inUseCount: 0,
  isBulk: false,
  ...over,
});

const bulk = (n: number) =>
  payload({
    keys: Array.from({ length: n }, (_, i) => `k${i}`),
    names: Array.from({ length: n }, (_, i) => `f${i}.png`),
    isBulk: true,
  });

describe("ConfirmDeleteModal", () => {
  it("renders a single-file confirm without the type-DELETE gate", () => {
    render(<ConfirmDeleteModal payload={payload()} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("Delete file?")).toBeInTheDocument();
    expect(screen.queryByLabelText("Type DELETE to confirm")).not.toBeInTheDocument();
  });

  /*
    The case both existing tests stepped over: `payload()` is isBulk false and
    `bulk(21)` is plural either way, so nothing covered one asset reached
    THROUGH selection mode. Live, that printed "Delete 1 files?" directly above
    a warning reading "1 file is currently used on the canvas" — the modal
    contradicting itself inside one dialog. `isBulk` means "came from selection
    mode", not "more than one".
  */
  it("says 'Delete 1 file?' for a single asset selected in bulk mode", () => {
    render(<ConfirmDeleteModal payload={bulk(1)} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("Delete 1 file?")).toBeInTheDocument();
    expect(screen.queryByText("Delete 1 files?")).not.toBeInTheDocument();
  });

  it("shows the type-DELETE gate only past the large-bulk threshold", () => {
    const { unmount } = render(
      <ConfirmDeleteModal payload={bulk(20)} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.queryByLabelText("Type DELETE to confirm")).not.toBeInTheDocument();
    unmount();

    render(<ConfirmDeleteModal payload={bulk(21)} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("Delete 21 files?")).toBeInTheDocument();
    expect(screen.getByLabelText("Type DELETE to confirm")).toBeInTheDocument();
  });

  it("the gate input is really styled — not a bare browser input", () => {
    render(<ConfirmDeleteModal payload={bulk(21)} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    const input = screen.getByLabelText("Type DELETE to confirm");
    // TextField's ported .bk-input rules: box, border, focus ring, invalid,
    // disabled. If the teardown ever strips them again this fails loudly.
    expect(input.className).toMatch(/tw:border-gray-300/);
    expect(input.className).toMatch(/tw:rounded-lg/);
    expect(input.className).toMatch(/tw:h-9/);
    expect(input.className).toMatch(/tw:bg-white/);
  });

  it("keeps confirmation disabled until DELETE is typed exactly", () => {
    const onConfirm = vi.fn();
    render(<ConfirmDeleteModal payload={bulk(21)} onConfirm={onConfirm} onCancel={vi.fn()} />);
    const input = screen.getByLabelText("Type DELETE to confirm");
    const confirm = screen.getByRole("button", { name: /delete/i });

    expect(confirm).toBeDisabled();

    fireEvent.change(input, { target: { value: "delete" } });
    expect(confirm).toBeDisabled();

    fireEvent.change(input, { target: { value: "DELETE" } });
    expect(confirm).toBeEnabled();

    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("cancels without deleting", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDeleteModal payload={payload()} onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

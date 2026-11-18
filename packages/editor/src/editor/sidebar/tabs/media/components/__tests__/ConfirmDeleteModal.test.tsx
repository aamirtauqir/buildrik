/**
 * ConfirmDeleteModal — the destructive gate, rendered for real.
 *
 * Copy is the Clone's (Figma page "Editor v1 Clone", section 3695:45625):
 *   3708:20650 / 21082 / 22372  Delete <file>?  — one file, used
 *   3701:20385                  Delete 2 selected files? — the checked set
 * The V1 board 1175:4827's "Delete file?" title, its 📄 name list and its
 * amber "N files are currently used on the canvas" alert are displaced; the
 * type-DELETE gate past 20 files is gone (decision #29 — plain confirm).
 *
 * Written 2026-08-01 to close a coverage hole the final whole-branch review
 * named: the only other test that touches this component mocks it to
 * `() => null`, so the most destructive path in the media library had no
 * render coverage at all.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDeleteModal } from "../ConfirmDeleteModal";
import type { ConfirmDeletePayload } from "@/editor/sidebar/tabs/media/data/mediaTypes";

const payload = (over: Partial<ConfirmDeletePayload> = {}): ConfirmDeletePayload => ({
  keys: ["hero"],
  names: ["hero-dark.jpg"],
  inUseCount: 0,
  inUse: [],
  isBulk: false,
  ...over,
});

const bulk = (n: number, over: Partial<ConfirmDeletePayload> = {}) =>
  payload({
    keys: Array.from({ length: n }, (_, i) => `k${i}`),
    names: Array.from({ length: n }, (_, i) => `f${i}.png`),
    isBulk: true,
    ...over,
  });

const footButtons = () =>
  within(screen.getByTestId("media-delete-foot"))
    .getAllByRole("button")
    .map((b) => b.textContent?.trim());

describe("Clone 3708:20650 · Delete hero-dark.jpg? — one used file", () => {
  const used = payload({
    inUseCount: 1,
    inUse: [{ key: "hero", name: "hero-dark", count: 3, pages: ["Home", "Menu"] }],
  });

  it("2L9 199:42695 — titles the dialog with the full filename and says what breaks", () => {
    render(<ConfirmDeleteModal payload={used} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByTestId("media-delete-title")).toHaveTextContent("Delete hero-dark.jpg?");
    expect(screen.getByTestId("media-delete-body")).toHaveTextContent("Used in 3 known places. Those images will break.");
    expect(screen.getByTestId("media-delete-note")).toHaveTextContent(
      "May also be used as a favicon, social image or brand image — check Site settings. After 8 seconds this can’t be undone.",
    );
  });

  it("offers Cancel (primary) · Delete asset, and no Replace instead", () => {
    render(<ConfirmDeleteModal payload={used} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(footButtons()).toEqual(["Cancel", "Delete asset"]);
    expect(screen.queryByTestId("media-delete-replace")).toBeNull();
  });

  it("singular: 'Used in 1 known place.'", () => {
    render(
      <ConfirmDeleteModal
        payload={payload({
          keys: ["chef"],
          names: ["chef-intro.mp4"],
          inUseCount: 1,
          inUse: [{ key: "chef", name: "chef-intro", count: 1, pages: [] }],
        })}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByTestId("media-delete-title")).toHaveTextContent("Delete chef-intro.mp4?");
    expect(screen.getByTestId("media-delete-body")).toHaveTextContent(/^Used in 1 known place\. /);
  });

  it("Delete asset confirms; Cancel does not", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDeleteModal payload={used} onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Delete asset" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

describe("Delete <file>? — one unused file", () => {
  it("says there are no known placements and offers Cancel · Delete asset", () => {
    render(<ConfirmDeleteModal payload={payload()} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByTestId("media-delete-title")).toHaveTextContent("Delete hero-dark.jpg?");
    expect(screen.getByTestId("media-delete-body")).toHaveTextContent("No known placements on this site.");
    expect(footButtons()).toEqual(["Cancel", "Delete asset"]);
    expect(screen.queryByLabelText("Type DELETE to confirm")).not.toBeInTheDocument();
  });
});

describe("Clone 3701:20385 · Delete 2 selected files? — the checked set", () => {
  const two = bulk(2, {
    keys: ["hero", "chef"],
    names: ["hero-dark.jpg", "chef-intro.mp4"],
    inUseCount: 2,
    inUse: [
      { key: "hero", name: "hero-dark", count: 3, pages: ["Home"] },
      { key: "chef", name: "chef-intro", count: 1, pages: ["Home"] },
    ],
  });

  it("names each file with its use count and totals the placements", () => {
    render(<ConfirmDeleteModal payload={two} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByTestId("media-delete-title")).toHaveTextContent("Delete 2 selected files?");
    expect(screen.getByTestId("media-delete-body")).toHaveTextContent(
      "hero-dark.jpg (3 uses) and chef-intro.mp4 (1 use) will be permanently deleted. This affects 4 placements.",
    );
    expect(footButtons()).toEqual(["Cancel", "Delete 2 files"]);
  });

  it("marks an unused file '(unused)' and joins three names with commas and 'and'", () => {
    render(
      <ConfirmDeleteModal
        payload={bulk(3, {
          keys: ["hero", "team", "chef"],
          names: ["hero-dark.jpg", "team-photo.jpg", "chef-intro.mp4"],
          inUseCount: 2,
          inUse: [
            { key: "hero", name: "hero-dark", count: 3, pages: [] },
            { key: "chef", name: "chef-intro", count: 1, pages: [] },
          ],
        })}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByTestId("media-delete-body")).toHaveTextContent(
      "hero-dark.jpg (3 uses), team-photo.jpg (unused) and chef-intro.mp4 (1 use) will be permanently deleted. This affects 4 placements.",
    );
  });

  it("when none of the checked files is used it says so instead of counting placements", () => {
    render(
      <ConfirmDeleteModal
        payload={bulk(2, { keys: ["team", "opening"], names: ["team-photo.jpg", "grand-opening.mp4"] })}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByTestId("media-delete-body")).toHaveTextContent(
      "team-photo.jpg (unused) and grand-opening.mp4 (unused) will be permanently deleted. None of them is used on the site.",
    );
  });

  it("a single checked file reads in the singular and never offers Replace instead", () => {
    render(
      <ConfirmDeleteModal
        payload={bulk(1, {
          keys: ["chef"],
          names: ["chef-intro.mp4"],
          inUseCount: 1,
          inUse: [{ key: "chef", name: "chef-intro", count: 1, pages: [] }],
        })}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
       
      />,
    );
    expect(screen.getByTestId("media-delete-title")).toHaveTextContent("Delete 1 selected file?");
    expect(screen.getByTestId("media-delete-body")).toHaveTextContent(
      "chef-intro.mp4 (1 use) will be permanently deleted. This affects 1 placement.",
    );
    expect(footButtons()).toEqual(["Cancel", "Delete 1 file"]);
  });

  it("names the first five and counts the rest, so a large set stays one readable sentence", () => {
    render(<ConfirmDeleteModal payload={bulk(8)} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByTestId("media-delete-body")).toHaveTextContent(
      "f0.png (unused), f1.png (unused), f2.png (unused), f3.png (unused), f4.png (unused) and 3 more will be permanently deleted.",
    );
    expect(screen.queryByText(/f5\.png/)).toBeNull();
  });

  it("the destructive button is red-filled and the sentence is body ink, not an alert band", () => {
    render(<ConfirmDeleteModal payload={two} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByTestId("media-delete-confirm").className).toMatch(/tw:bg-\[var\(--bk-error\)\]/);
  });
});

/* Decision #29: typed DELETE is for irreversible AND wide actions (site ·
   collection · record with page · token in use). A large asset delete is a
   plain confirm — the file list and placement count are the warning. */
describe("large bulk delete — plain confirm (decision #29)", () => {
  it("21 files: no typing gate, Delete is enabled and confirms in one click", () => {
    const onConfirm = vi.fn();
    render(<ConfirmDeleteModal payload={bulk(21)} onConfirm={onConfirm} onCancel={vi.fn()} />);
    expect(screen.getByTestId("media-delete-title")).toHaveTextContent("Delete 21 selected files?");
    expect(screen.queryByLabelText("Type DELETE to confirm")).toBeNull();
    expect(screen.queryByText(/stays disabled/)).toBeNull();
    const confirm = screen.getByRole("button", { name: "Delete 21 files" });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

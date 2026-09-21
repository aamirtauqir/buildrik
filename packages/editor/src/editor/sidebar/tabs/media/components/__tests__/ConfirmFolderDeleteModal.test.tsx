/**
 * ConfirmFolderDeleteModal — the folder-delete gate, rendered for real.
 *
 * P0 close-out for the silent-refusal bug: an empty folder used to delete
 * with no confirm and a non-empty folder used to throw FOLDER_NOT_EMPTY into
 * the void. The modal is the only render path the user ever sees, so this is
 * also the gate against copy drift on B1-12 / B1-13.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmFolderDeleteModal } from "../ConfirmFolderDeleteModal";
import type { ConfirmFolderDeletePayload } from "../../data/mediaTypes";

const payload = (over: Partial<ConfirmFolderDeletePayload> = {}): ConfirmFolderDeletePayload => ({
  folderId: "f1",
  folderName: "Heroes",
  assetCount: 0,
  subFolderCount: 0,
  ...over,
});

describe("ConfirmFolderDeleteModal", () => {
  it("shows the simple delete prompt when the folder is empty", () => {
    render(
      <ConfirmFolderDeleteModal payload={payload()} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByText('Delete "Heroes"?')).toBeInTheDocument();
    expect(screen.queryByText(/isn't empty/i)).not.toBeInTheDocument();
    // Move files… must NOT appear for empty folders — no files to move.
    expect(screen.queryByRole("button", { name: /move files/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^delete$/i })).toBeInTheDocument();
  });

  it("names both files and sub-folders in the warning copy", () => {
    render(
      <ConfirmFolderDeleteModal
        payload={payload({ assetCount: 3, subFolderCount: 2 })}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText(/3 files and 2 folders/)).toBeInTheDocument();
  });

  it("uses singular grammar when each count is one", () => {
    render(
      <ConfirmFolderDeleteModal
        payload={payload({ assetCount: 1, subFolderCount: 1 })}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText(/1 file and 1 folder/)).toBeInTheDocument();
  });

  it("offers Move files… only when the folder is non-empty", () => {
    const { rerender } = render(
      <ConfirmFolderDeleteModal
        payload={payload({ assetCount: 0, subFolderCount: 1 })}
        onMoveFiles={vi.fn()}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    // 1 sub-folder, 0 assets — still non-empty, button appears.
    expect(screen.getByRole("button", { name: /move files/i })).toBeInTheDocument();

    rerender(
      <ConfirmFolderDeleteModal
        payload={payload({ assetCount: 0, subFolderCount: 0 })}
        onMoveFiles={vi.fn()}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.queryByRole("button", { name: /move files/i })).not.toBeInTheDocument();
  });

  it("invokes onConfirm only on click of the Delete button", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmFolderDeleteModal
        payload={payload({ assetCount: 2 })}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /delete folder with contents/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("invokes onMoveFiles only on click of Move files…", () => {
    const onConfirm = vi.fn();
    const onMoveFiles = vi.fn();
    render(
      <ConfirmFolderDeleteModal
        payload={payload({ assetCount: 2 })}
        onConfirm={onConfirm}
        onMoveFiles={onMoveFiles}
        onCancel={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /move files/i }));
    expect(onMoveFiles).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("invokes onCancel only on click of Cancel", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmFolderDeleteModal
        payload={payload({ assetCount: 2 })}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

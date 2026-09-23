/**
 * MoveAssetsModal — Clone 3683:19950 "Move 2 assets".
 *
 * The bulk bar's `Move to folder…` opens it (prototype edge
 * `Move to folder…|CLIC|OVE>Assets · Move selected files`). Title counts the
 * checked set, the body says where each file IS ("hero-dark.jpg is in Hero
 * shots; chef-intro.mp4 is unfiled. Choose a destination."), then one
 * full-width secondary button per folder and Cancel. Choosing a folder is
 * the move; the orchestrator runs it.
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { MoveAssetsModal } from "../MoveAssetsModal";
import { TEN, makeFolder } from "../../__tests__/libraryFixture";

const FOLDERS = [
  makeFolder({ id: "f1", name: "Products" }),
  makeFolder({ id: "f2", name: "Hero shots" }),
  makeFolder({ id: "f3", name: "Campaign images", parentId: "f1" }),
];

const hero = { ...TEN[0], folderId: "f2" };
const chef = { ...TEN[7], folderId: null };

function mount(items = [hero, chef], over: Partial<React.ComponentProps<typeof MoveAssetsModal>> = {}) {
  const props = {
    open: true,
    items,
    folders: FOLDERS,
    onClose: vi.fn(),
    onMove: vi.fn(),
    ...over,
  };
  render(<MoveAssetsModal {...props} />);
  return props;
}

describe("Clone 3683:19950 · Move 2 assets", () => {
  it("titles with the count and names where each file is, unfiled when it has no folder", () => {
    mount();
    expect(screen.getByTestId("mgr-move-title")).toHaveTextContent("Move 2 assets");
    expect(screen.getByTestId("mgr-move-body")).toHaveTextContent(
      "hero-dark.jpg is in Hero shots; chef-intro.mp4 is unfiled. Choose a destination.",
    );
  });

  it("reads 'Move 1 asset' for a single file", () => {
    mount([chef]);
    expect(screen.getByTestId("mgr-move-title")).toHaveTextContent("Move 1 asset");
    expect(screen.getByTestId("mgr-move-body")).toHaveTextContent("chef-intro.mp4 is unfiled. Choose a destination.");
  });

  it("offers EVERY folder as a full-width button, including nested ones and the one a file is already in", () => {
    mount();
    const list = within(screen.getByTestId("mgr-move-folders"));
    expect(list.getAllByRole("button").map((b) => b.textContent?.trim())).toEqual([
      "Products",
      "Hero shots",
      "Campaign images",
    ]);
    // Only the folders — there is no Root / Unfiled row on the board.
    expect(screen.queryByText(/root/i)).toBeNull();
  });

  it("choosing a folder moves there and closes", () => {
    const props = mount();
    fireEvent.click(screen.getByTestId("mgr-move-folder-f1"));
    expect(props.onMove).toHaveBeenCalledWith("f1");
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("Cancel closes without moving", () => {
    const props = mount();
    fireEvent.click(screen.getByTestId("mgr-move-cancel"));
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onMove).not.toHaveBeenCalled();
  });

  it("renders nothing while closed", () => {
    mount([hero, chef], { open: false });
    expect(screen.queryByTestId("mgr-move")).toBeNull();
  });
});

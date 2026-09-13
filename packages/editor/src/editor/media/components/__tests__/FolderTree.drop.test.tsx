/**
 * FolderTree — asset→folder drop targets.
 *
 * Ported from the retired 560 panel with the "one manager" decision (board
 * 1159:4593 draws a single fullpage manager). The fullpage tree had NO drop
 * handlers at all, so deleting that panel without this would have taken
 * drag-to-folder with it.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FolderTree } from "../FolderTree";
import type { MediaFolder } from "@/editor/sidebar/tabs/media/data/mediaTypes";

const folders: MediaFolder[] = [
  { id: "f1", name: "Products", parentId: null } as MediaFolder,
];

function mount(onMoveAssetToFolder?: (k: string, f: string | null) => void, assetDragActive = false) {
  return render(
    <FolderTree
      assetDragActive={assetDragActive}
      folders={folders}
      currentFolderId={null}
      setCurrentFolderId={vi.fn()}
      counts={{ all: 3, img: 3, vid: 0, ico: 0, fnt: 0 }}
      smartFolder={null}
      setSmartFolder={vi.fn()}
      recentCount={1}
      inUseCount={2}
      unusedCount={1}
      allTags={[]}
      setLibrarySearch={vi.fn()}
      folderCounts={new Map()}
      onNewFolder={vi.fn()}
      deleteFolder={vi.fn()}
      onTrashClick={vi.fn()}
      onMoveAssetToFolder={onMoveAssetToFolder}
    />,
  );
}

/** A drop payload carrying the key the grid publishes. */
function dataTransfer(key: string) {
  return {
    getData: (type: string) =>
      type === "application/x-buildrik-media-asset-key" || type === "text/plain" ? key : "",
    setData: vi.fn(),
    dropEffect: "",
  };
}

describe("FolderTree — drag an asset onto a folder", () => {
  it("dropping on a folder row moves the asset into it", () => {
    const onMove = vi.fn();
    mount(onMove);
    const row = screen.getByText("Products").closest(".mgr-node")!;
    fireEvent.dragOver(row, { dataTransfer: dataTransfer("a1") });
    fireEvent.drop(row, { dataTransfer: dataTransfer("a1") });
    expect(onMove).toHaveBeenCalledWith("a1", "f1");
  });

  it("dropping on All assets moves it back to the root", () => {
    const onMove = vi.fn();
    mount(onMove);
    const row = screen.getByText("All assets").closest(".mgr-node")!;
    fireEvent.drop(row, { dataTransfer: dataTransfer("a2") });
    expect(onMove).toHaveBeenCalledWith("a2", null);
  });

  it("marks the hovered row so the user can see where it will land", () => {
    mount(vi.fn());
    const row = screen.getByText("Products").closest(".mgr-node")!;
    expect(row.className).not.toContain("dragover");
    fireEvent.dragOver(row, { dataTransfer: dataTransfer("a1") });
    expect(row.className).toContain("dragover");
    fireEvent.dragLeave(row, { dataTransfer: dataTransfer("a1") });
    expect(row.className).not.toContain("dragover");
  });

  it("a drop with no asset key is ignored", () => {
    const onMove = vi.fn();
    mount(onMove);
    const row = screen.getByText("Products").closest(".mgr-node")!;
    fireEvent.drop(row, { dataTransfer: dataTransfer("") });
    expect(onMove).not.toHaveBeenCalled();
  });

  it("without the handler the rows are not drop targets at all", () => {
    mount(undefined);
    const row = screen.getByText("Products").closest(".mgr-node")!;
    fireEvent.dragOver(row, { dataTransfer: dataTransfer("a1") });
    expect(row.className).not.toContain("dragover");
  });
});

// Clone 4215:26635 — while an asset is in flight EVERY folder row (All assets
// and each user folder) is outlined as a target; the smart rows, New folder
// and Trash are not places a file can land.
describe("FolderTree — every folder is a target while an asset is dragged (Clone 4215:26635)", () => {
  it("outlines All assets and each folder, and nothing else", () => {
    mount(vi.fn(), true);
    expect(screen.getByTestId("mgr-row-all-assets")).toHaveAttribute("data-drop-target", "true");
    expect(screen.getByTestId("mgr-row-folder-f1")).toHaveAttribute("data-drop-target", "true");
    expect(screen.getByTestId("mgr-row-recent")).not.toHaveAttribute("data-drop-target");
    expect(screen.getByTestId("mgr-new-folder-open")).not.toHaveAttribute("data-drop-target");
    expect(screen.getByTestId("mgr-row-trash")).not.toHaveAttribute("data-drop-target");
  });

  it("outlines nothing at rest, or without a move handler", () => {
    const { unmount } = mount(vi.fn(), false);
    expect(screen.getByTestId("mgr-row-folder-f1")).not.toHaveAttribute("data-drop-target");
    unmount();
    mount(undefined, true);
    expect(screen.getByTestId("mgr-row-folder-f1")).not.toHaveAttribute("data-drop-target");
  });
});

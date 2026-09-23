/**
 * B5 — the media write gate (audit G3-064, P1 "Viewers can mutate the
 * library"). A VIEWER sees upload / delete / rename controls DISABLED WITH
 * THE REASON — board 6289:148485 "View only — ask an editor to upload", the
 * B2-07 7567:190220 pattern — as `aria-disabled` + a tooltip, so the control
 * stays focusable and the reason readable by keyboard (decision #19). An
 * unknown role gates nothing: the server enforces, the chrome only explains.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { WorkspaceRole } from "@/services/RoleService";
import type { LibraryItem, MediaFolder } from "../data/mediaTypes";
import { UploadZone } from "../components/UploadZone";
import { MediaContextMenu } from "../components/MediaContextMenu";
import { FolderTree } from "@/editor/media/components/FolderTree";
import { AssetGrid } from "@/editor/media/components/AssetGrid";
import { makeMediaState } from "@/editor/media/__tests__/libraryFixture";
import { VIEW_ONLY_REASON } from "../hooks/useMediaWriteAccess";

let role: WorkspaceRole | null = "VIEWER";
vi.mock("@/editor/shell/hooks/useEditorRole", () => ({ useEditorRole: () => role }));

afterEach(() => {
  cleanup();
  role = "VIEWER";
});

const item = (): LibraryItem =>
  ({
    key: "a1", name: "logo.png", type: "img", src: "x", thumb: "x", size: 1,
    createdAt: new Date().toISOString(), mimeType: "image/png", assetSource: "uploaded",
  }) as LibraryItem;

describe("UploadZone — view only", () => {
  const storage = { used: 0, total: 1024 };

  it("says the reason, is aria-disabled, and takes neither a click nor a drop", () => {
    const onUpload = vi.fn();
    render(<UploadZone storage={storage} onUpload={onUpload} uploadQueue={[]} viewOnlyReason={VIEW_ONLY_REASON.upload} />);
    const zone = screen.getByTestId("media-upload-zone");
    expect(zone).toHaveAttribute("aria-disabled", "true");
    expect(zone).toHaveTextContent("View only — ask an editor to upload");
    const input = screen.getByTestId("media-upload-input") as HTMLInputElement;
    const click = vi.spyOn(input, "click");
    fireEvent.click(zone);
    fireEvent.keyDown(zone, { key: "Enter" });
    expect(click).not.toHaveBeenCalled();
    const file = new File(["x"], "x.png", { type: "image/png" });
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("without a reason the zone works as before", () => {
    const onUpload = vi.fn();
    render(<UploadZone storage={storage} onUpload={onUpload} uploadQueue={[]} />);
    const zone = screen.getByTestId("media-upload-zone");
    expect(zone).not.toHaveAttribute("aria-disabled");
    const file = new File(["x"], "x.png", { type: "image/png" });
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    expect(onUpload).toHaveBeenCalledWith([file]);
  });
});

describe("MediaContextMenu — view only", () => {
  const mount = () => {
    const onRename = vi.fn();
    const onDelete = vi.fn();
    render(
      <MediaContextMenu
        x={10} y={10} item={item()}
        onClose={vi.fn()} onInsert={vi.fn()} onSelect={vi.fn()} onRename={onRename} onEditImage={vi.fn()}
        onMoveToFolder={vi.fn()} onCopyUrl={vi.fn()} onDelete={onDelete}
      />,
    );
    return { onRename, onDelete };
  };

  it("keeps Rename… and Delete in the menu, aria-disabled, and they run nothing", () => {
    const { onRename, onDelete } = mount();
    const rename = screen.getByTestId("media-ctx-rename");
    const del = screen.getByTestId("media-ctx-delete");
    expect(rename).toHaveAttribute("aria-disabled", "true");
    expect(del).toHaveAttribute("aria-disabled", "true");
    expect(rename).not.toBeDisabled(); // focusable — the reason must be reachable
    fireEvent.click(rename);
    fireEvent.click(del);
    expect(onRename).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
    // the read-only rows are untouched
    expect(screen.getByTestId("media-ctx-copy-url")).not.toHaveAttribute("aria-disabled");
  });

  it("an EDITOR gets the live rows", () => {
    role = "EDITOR";
    const { onDelete } = mount();
    expect(screen.getByTestId("media-ctx-delete")).not.toHaveAttribute("aria-disabled");
    fireEvent.click(screen.getByTestId("media-ctx-delete"));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("an unknown role gates nothing — the server decides", () => {
    role = null;
    mount();
    expect(screen.getByTestId("media-ctx-rename")).not.toHaveAttribute("aria-disabled");
  });
});

describe("FolderTree — view only", () => {
  const mount = () => {
    const onNewFolder = vi.fn();
    const deleteFolder = vi.fn(async () => {});
    render(
      <FolderTree
        folders={[{ id: "f1", name: "Brand", parentId: null } as MediaFolder]}
        currentFolderId={null} setCurrentFolderId={vi.fn()}
        counts={{ all: 0, img: 0, vid: 0, ico: 0, fnt: 0 }}
        smartFolder={null} setSmartFolder={vi.fn()} recentCount={0} inUseCount={0} unusedCount={0}
        allTags={[]} tagFilter={null} setTagFilter={vi.fn()} folderCounts={new Map()}
        onNewFolder={onNewFolder} deleteFolder={deleteFolder} onTrashClick={vi.fn()}
      />,
    );
    return { onNewFolder, deleteFolder };
  };

  it("New folder is aria-disabled and inert; the folder's trash stays on show, aria-disabled", () => {
    const { onNewFolder, deleteFolder } = mount();
    const row = screen.getByTestId("mgr-new-folder-open");
    expect(row).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(row);
    fireEvent.keyDown(row, { key: "Enter" });
    expect(onNewFolder).not.toHaveBeenCalled();
    const trash = screen.getByLabelText("Delete folder");
    expect(trash).toHaveAttribute("aria-disabled", "true");
    expect(trash.className).toMatch(/mgr-node-del--view-only/);
    fireEvent.click(trash);
    expect(deleteFolder).not.toHaveBeenCalled();
  });

  it("an EDITOR keeps both doors", () => {
    role = "EDITOR";
    const { onNewFolder, deleteFolder } = mount();
    fireEvent.click(screen.getByTestId("mgr-new-folder-open"));
    expect(onNewFolder).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByLabelText("Delete folder"));
    expect(deleteFolder).toHaveBeenCalledWith("f1");
  });
});

describe("AssetGrid — view only", () => {
  const mount = (over: Parameters<typeof makeMediaState>[0] = {}) => {
    const state = makeMediaState({ fmtFilter: "", storage: { used: 0, total: 1024 }, ...over });
    const onUploadClick = vi.fn();
    render(
      <AssetGrid
        state={state} visibleItems={state.libraryItems} usageMap={new Map()} smartFolder={null}
        selectedAssetId={null} onSelectAsset={vi.fn()} onInsert={vi.fn()} onUploadClick={onUploadClick}
        onOpenStockModal={vi.fn()} onDownload={vi.fn(() => 0)} onMoveSelected={vi.fn()}
        onAssetDragStart={vi.fn()} onAssetDragEnd={vi.fn()} addToast={vi.fn()}
      />,
    );
    return { state, onUploadClick };
  };

  it("the empty library's Upload CTA is aria-disabled and inert", () => {
    const { onUploadClick } = mount({ libraryItems: [] });
    const cta = screen.getByTestId("mgr-empty-upload");
    expect(cta).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(cta);
    expect(onUploadClick).not.toHaveBeenCalled();
  });

  it("bulk Delete is aria-disabled and never asks the state to delete", () => {
    const items = [item(), { ...item(), key: "a2", name: "b.png" } as LibraryItem];
    const { state } = mount({ libraryItems: items, selMode: true, selectedKeys: new Set(["a1"]) });
    const del = screen.getByTestId("mgr-bulk-delete");
    expect(del).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(del);
    expect(state.requestBulkDelete).not.toHaveBeenCalled();
  });

  it("an EDITOR's bulk Delete asks the state", () => {
    role = "EDITOR";
    const items = [item()];
    const { state } = mount({ libraryItems: items, selMode: true, selectedKeys: new Set(["a1"]) });
    fireEvent.click(screen.getByTestId("mgr-bulk-delete"));
    expect(state.requestBulkDelete).toHaveBeenCalledTimes(1);
  });
});

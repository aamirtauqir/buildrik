/**
 * FolderTree — the 2L9 B6-A01 (199:37199) rail: All assets and the smart
 * scopes, nested folder nav, collapse/expand, the New folder door, delete
 * folders, and the Fonts row.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import type { MediaBucket, MediaFolder, MediaTypeFilter } from "@/editor/sidebar/tabs/media/data/mediaTypes";
import { FolderTree, type FolderTreeProps } from "../FolderTree";

function makeFolder(over: Partial<MediaFolder> = {}): MediaFolder {
  return { id: "f1", name: "Brand", parentId: null, ...over } as MediaFolder;
}

function mount(over: Partial<FolderTreeProps> = {}) {
  const props: FolderTreeProps = {
    folders: [],
    currentFolderId: null,
    setCurrentFolderId: vi.fn(),
    smartFolder: null,
    setSmartFolder: vi.fn(),
    activeTypes: new Set(),
    setType: vi.fn(),
    onNewFolder: vi.fn(),
    deleteFolder: vi.fn(async () => {}),
    ...over,
  };
  const utils = render(<FolderTree {...props} />);
  return { ...utils, props };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("FolderTree — 199:37199 rail", () => {
  const nestedOrder = [
    makeFolder({ id: "f1", name: "Brand shots" }),
    makeFolder({ id: "f2", name: "Logos", parentId: "f1" }),
  ];

  it("reads All assets · Recent · Used on this site · No known placements · My folders · folders · + New folder · Fonts", () => {
    const { container } = mount({ folders: nestedOrder });
    const order = Array.from(container.querySelectorAll(".mgr-node, .mgr-tree-head-title, .mgr-tree-head-sub")).map(
      (el) => el.textContent,
    );
    expect(order).toEqual([
      "All assets",
      "Recent",
      "Used on this site",
      "No known placements",
      "My folders",
      "Only you see these",
      "Brand shots",
      "Logos",
      "+ New folder",
      "Fonts",
    ]);
    expect(screen.queryByTestId("mgr-section-smart")).toBeNull();
    expect(screen.queryByText(/^smart$/i)).toBeNull();
  });

  it("no row carries a count or an icon — only a folder's expand chevron draws an svg", () => {
    const { container } = mount({ folders: nestedOrder });
    expect(container.querySelector(".mgr-node-count")).toBeNull();
    for (const row of Array.from(container.querySelectorAll(".mgr-node"))) {
      const svgs = Array.from(row.querySelectorAll("svg")).filter(
        (svg) => !svg.closest(".mgr-chev-btn") && !svg.closest(".mgr-node-del"),
      );
      expect(svgs).toHaveLength(0);
    }
  });

  it("'Only you see these' is a visible line under My folders, not a tooltip", () => {
    mount();
    const head = screen.getByTestId("mgr-section-folders");
    expect(head).toHaveTextContent("My folders");
    expect(head).toHaveTextContent("Only you see these");
    expect(head).not.toHaveAttribute("title");
  });

  it("an empty folder list draws only '+ New folder' — no 'No folders yet'", () => {
    mount();
    expect(screen.queryByText("No folders yet")).toBeNull();
    expect(screen.getByTestId("mgr-new-folder-open")).toHaveTextContent("+ New folder");
  });

  it("Tab reaches every row, Fonts included, and Enter on Fonts scopes to fonts", () => {
    const { container, props } = mount({ folders: nestedOrder });
    const rows = Array.from(container.querySelectorAll<HTMLElement>(".mgr-node"));
    expect(rows).toHaveLength(8);
    for (const row of rows) {
      expect(row).toHaveAttribute("role", "button");
      expect(row).toHaveAttribute("tabindex", "0");
    }
    const fonts = screen.getByTestId("mgr-row-fonts");
    fonts.focus();
    expect(fonts).toHaveFocus();
    fireEvent.keyDown(fonts, { key: "Enter" });
    expect(props.setSmartFolder).toHaveBeenCalledWith(null);
    expect(props.setCurrentFolderId).toHaveBeenCalledWith(null);
    expect(props.setType).toHaveBeenCalledWith("fnt");
  });
});

/* The rail with live scope state, the way LibraryManager hosts it. */
function LiveRail({ onType }: { onType: (t: MediaTypeFilter) => void }) {
  const [smartFolder, setSmartFolder] = React.useState<FolderTreeProps["smartFolder"]>(null);
  const [currentFolderId, setCurrentFolderId] = React.useState<string | null>(null);
  const [activeTypes, setActiveTypes] = React.useState<ReadonlySet<MediaBucket>>(new Set());
  return (
    <FolderTree
      folders={[makeFolder({ id: "f1", name: "Brand shots" })]}
      currentFolderId={currentFolderId}
      setCurrentFolderId={setCurrentFolderId}
      smartFolder={smartFolder}
      setSmartFolder={setSmartFolder}
      activeTypes={activeTypes}
      setType={(t) => {
        onType(t);
        setActiveTypes(t === "all" ? new Set() : new Set([t]));
      }}
      onNewFolder={vi.fn()}
      deleteFolder={vi.fn(async () => {})}
      onMoveAssetToFolder={vi.fn()}
    />
  );
}

describe("FolderTree — the Fonts row (199:37199)", () => {
  it("clicking Fonts sets the type to fnt and makes it the selected row; All assets is not", () => {
    const onType = vi.fn();
    render(<LiveRail onType={onType} />);
    expect(screen.getByTestId("mgr-row-all-assets")).toHaveClass("active");
    fireEvent.click(screen.getByTestId("mgr-row-fonts"));
    expect(onType).toHaveBeenCalledWith("fnt");
    expect(screen.getByTestId("mgr-row-fonts")).toHaveClass("active");
    expect(screen.getByTestId("mgr-row-fonts")).toHaveAttribute("aria-current", "true");
    expect(screen.getByTestId("mgr-row-all-assets")).not.toHaveClass("active");
  });

  it("leaving Fonts through All assets resets the type filter to all", () => {
    const onType = vi.fn();
    render(<LiveRail onType={onType} />);
    fireEvent.click(screen.getByTestId("mgr-row-fonts"));
    onType.mockClear();
    fireEvent.click(screen.getByTestId("mgr-row-all-assets"));
    expect(onType).toHaveBeenCalledWith("all");
    expect(screen.getByTestId("mgr-row-all-assets")).toHaveClass("active");
    expect(screen.getByTestId("mgr-row-fonts")).not.toHaveClass("active");
  });

  it("other rows leave the type filter alone when Fonts is not the scope", () => {
    const { props } = mount({ activeTypes: new Set(["img"]) });
    fireEvent.click(screen.getByTestId("mgr-row-recent"));
    fireEvent.click(screen.getByTestId("mgr-row-all-assets"));
    expect(props.setType).not.toHaveBeenCalled();
  });

  it("is not the selected row while a folder or smart scope holds the fnt filter", () => {
    mount({ activeTypes: new Set(["fnt"]), smartFolder: "recent" });
    expect(screen.getByTestId("mgr-row-fonts")).not.toHaveClass("active");
    expect(screen.getByTestId("mgr-row-recent")).toHaveClass("active");
  });

  it("is not a drop target, even while an asset is in flight", () => {
    const onMove = vi.fn();
    mount({ onMoveAssetToFolder: onMove, assetDragActive: true });
    const fonts = screen.getByTestId("mgr-row-fonts");
    expect(fonts).not.toHaveAttribute("data-drop-target");
    expect(screen.getByTestId("mgr-row-all-assets")).toHaveAttribute("data-drop-target", "true");
    fireEvent.drop(fonts, { dataTransfer: { getData: () => "a1" } });
    expect(onMove).not.toHaveBeenCalled();
  });
});

describe("FolderTree — smart folders", () => {
  it("clicking a smart folder sets it and clears the folder selection", () => {
    const { props } = mount();
    fireEvent.click(screen.getByText("Recent"));
    expect(props.setSmartFolder).toHaveBeenCalledWith("recent");
    expect(props.setCurrentFolderId).toHaveBeenCalledWith(null);
  });

  it("the active smart folder row carries the active class", () => {
    const { container } = mount({ smartFolder: "unused" });
    const active = container.querySelector(".mgr-node.active");
    expect(active?.textContent).toContain("No known placements");
  });

  it("'All assets' is active only when neither folder nor smart folder is set", () => {
    const { container } = mount();
    const active = container.querySelectorAll(".mgr-node.active");
    expect(active).toHaveLength(1);
    expect(active[0].textContent).toBe("All assets");
  });
});

describe("FolderTree — user folders", () => {
  const nested = [
    makeFolder({ id: "f1", name: "Brand" }),
    makeFolder({ id: "f2", name: "Logos", parentId: "f1" }),
    makeFolder({ id: "f3", name: "Photos" }),
  ];

  it("renders the nested tree (children visible while expanded)", () => {
    mount({ folders: nested });
    expect(screen.getByText("Brand")).toBeInTheDocument();
    expect(screen.getByText("Logos")).toBeInTheDocument();
    expect(screen.getByText("Photos")).toBeInTheDocument();
  });

  it("collapse hides children, expand shows them again", () => {
    mount({ folders: nested });
    // Brand has children → expandable chevron with Collapse label
    fireEvent.click(screen.getByLabelText("Collapse"));
    expect(screen.queryByText("Logos")).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Expand"));
    expect(screen.getByText("Logos")).toBeInTheDocument();
  });

  it("clicking a folder selects it and clears the smart folder", () => {
    const { props } = mount({ folders: nested });
    fireEvent.click(screen.getByText("Photos"));
    expect(props.setSmartFolder).toHaveBeenCalledWith(null);
    expect(props.setCurrentFolderId).toHaveBeenCalledWith("f3");
  });

  it("delete button deletes the folder without also navigating into it", () => {
    const { props } = mount({ folders: [makeFolder({ id: "f9", name: "Old" })] });
    fireEvent.click(screen.getAllByLabelText("Delete folder")[0]);
    expect(props.deleteFolder).toHaveBeenCalledWith("f9");
    expect(props.setCurrentFolderId).not.toHaveBeenCalled();
  });

  // Clone 3700:20347 — `row/＋ New folder` opens the Create folder OVERLAY.
  // These replace four tests that protected V1 board 1205:4829's inline
  // editing row (a field that opened in the tree, Enter/Esc spelled out
  // under it). The tree no longer names anything; it asks the orchestrator
  // for the modal, and — as before the inline row — never an OS prompt.
  it("Clone 3700:20347 — '+ New folder' asks for the modal; nothing opens in the tree, no OS dialog", () => {
    const promptSpy = vi.spyOn(window, "prompt");
    const { props } = mount();
    fireEvent.click(screen.getByRole("button", { name: "+ New folder" }));
    expect(props.onNewFolder).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByTestId("mgr-new-folder-input")).toBeNull();
    expect(promptSpy).not.toHaveBeenCalled();
  });

  it("Clone 3698:20337 — the trigger is a row in FOLDERS after the last folder, not a caption icon, and it does not scope", () => {
    const { props } = mount({ folders: nested });
    const trigger = screen.getByTestId("mgr-new-folder-open");
    expect(trigger).toHaveClass("mgr-node");
    expect(trigger).toHaveTextContent("+ New folder");
    expect(trigger).toHaveClass("mgr-node--new");
    const foldersCaption = screen.getByTestId("mgr-section-folders");
    expect(foldersCaption.contains(trigger)).toBe(false);
    // After the folders it will land beside.
    const rows = Array.from(document.querySelectorAll("[data-testid^='mgr-row-folder-'], [data-testid='mgr-new-folder-open']"));
    expect(rows[rows.length - 1]).toBe(trigger);
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(props.onNewFolder).toHaveBeenCalledTimes(1);
    expect(props.setCurrentFolderId).not.toHaveBeenCalled();
    expect(props.setSmartFolder).not.toHaveBeenCalled();
  });
});

/* 2L9 B6-A01 — the tag filter left the rail for the grid's "Any tag ▾". */
it("FolderTree draws no Tags row and no Trash row", () => {
  mount();
  expect(screen.queryByTestId("mgr-row-tags")).toBeNull();
  expect(screen.queryByText("Trash")).toBeNull();
});

describe("FolderTree — FC-4 (fix-all 2026-09-25): folders are per-user, never shared", () => {
  it("labels the section 'My folders', not the bare, shareable-sounding 'Folders'", () => {
    mount();
    expect(screen.getByTestId("mgr-section-folders")).toHaveTextContent("My folders");
    expect(screen.queryByText("Folders")).not.toBeInTheDocument();
  });
});

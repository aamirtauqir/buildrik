/**
 * FolderTree — smart folders, nested folder nav, collapse/expand,
 * create/delete folders, tag search shortcuts, Trash stub (pinned).
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { LibraryItem, MediaFolder } from "../../../sidebar/tabs/media/data/mediaTypes";
import { FolderTree, type FolderTreeProps } from "../FolderTree";

function makeFolder(over: Partial<MediaFolder> = {}): MediaFolder {
  return { id: "f1", name: "Brand", parentId: null, ...over } as MediaFolder;
}

function mount(over: Partial<FolderTreeProps> = {}) {
  const props: FolderTreeProps = {
    folders: [],
    currentFolderId: null,
    setCurrentFolderId: vi.fn(),
    counts: { all: 0, img: 0, vid: 0, ico: 0, fnt: 0 },
    smartFolder: null,
    setSmartFolder: vi.fn(),
    recentCount: 0,
    inUseCount: 0,
    unusedCount: 0,
    allTags: [],
    libraryItems: [],
    setLibrarySearch: vi.fn(),
    createFolder: vi.fn(async () => {}),
    deleteFolder: vi.fn(async () => {}),
    onTrashClick: vi.fn(),
    ...over,
  };
  const utils = render(<FolderTree {...props} />);
  return { ...utils, props };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("FolderTree — smart folders", () => {
  it("renders Recent / In use / Unused with their counts", () => {
    mount({ recentCount: 2, inUseCount: 5, unusedCount: 3 });
    expect(screen.getByText("Recent")).toBeInTheDocument();
    expect(screen.getByText("In use")).toBeInTheDocument();
    expect(screen.getByText("Unused")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("clicking a smart folder sets it and clears the folder selection", () => {
    const { props } = mount();
    fireEvent.click(screen.getByText("Recent"));
    expect(props.setSmartFolder).toHaveBeenCalledWith("recent");
    expect(props.setCurrentFolderId).toHaveBeenCalledWith(null);
  });

  it("the active smart folder row carries the active class", () => {
    const { container } = mount({ smartFolder: "unused" });
    const active = container.querySelector(".mgr-node.active");
    expect(active?.textContent).toContain("Unused");
  });

  it("'All assets' is active only when neither folder nor smart folder is set", () => {
    const { container } = mount({ counts: { all: 7, img: 7, vid: 0, ico: 0, fnt: 0 } });
    const active = container.querySelector(".mgr-node.active");
    expect(active?.textContent).toContain("All assets");
    expect(active?.textContent).toContain("7");
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

  it("New folder prompts for a name and calls createFolder with the trimmed value", () => {
    vi.spyOn(window, "prompt").mockReturnValue("  Assets 2026  ");
    const { props } = mount();
    fireEvent.click(screen.getByTitle("New folder"));
    expect(props.createFolder).toHaveBeenCalledWith("Assets 2026");
  });

  it("cancelling the prompt creates nothing", () => {
    vi.spyOn(window, "prompt").mockReturnValue(null);
    const { props } = mount();
    fireEvent.click(screen.getByTitle("New folder"));
    expect(props.createFolder).not.toHaveBeenCalled();
  });

  it("shows the empty hint when there are no folders", () => {
    mount();
    expect(screen.getByText("No folders yet")).toBeInTheDocument();
  });
});

describe("FolderTree — tags", () => {
  it("renders a Tags section when tags exist and clicking one searches", () => {
    const items = [
      { key: "a", altText: "summer beach" } as LibraryItem,
      { key: "b", altText: "summer city" } as LibraryItem,
    ];
    const { props } = mount({ allTags: ["summer"], libraryItems: items });
    expect(screen.getByText("Tags")).toBeInTheDocument();
    fireEvent.click(screen.getByText("summer"));
    expect(props.setLibrarySearch).toHaveBeenCalledWith("summer");
  });

  it("hides the Tags section when no tags exist", () => {
    mount({ allTags: [] });
    expect(screen.queryByText("Tags")).not.toBeInTheDocument();
  });
});

describe("FolderTree — Trash (KNOWN stub, pinned)", () => {
  it("Trash renders with a hardcoded 0 count and only fires the orchestrator callback", () => {
    // Trash is not implemented — the row always shows 0 and the orchestrator
    // wires onTrashClick to a "Trash coming soon" toast. Pinned as-is.
    const { props } = mount();
    const trash = screen.getByText("Trash");
    fireEvent.click(trash);
    expect(props.onTrashClick).toHaveBeenCalledTimes(1);
    expect(props.setCurrentFolderId).not.toHaveBeenCalled();
    expect(props.setSmartFolder).not.toHaveBeenCalled();
  });
});

/**
 * FolderTree — smart folders, nested folder nav, collapse/expand, the
 * New folder door, delete folders, the Tags ▾ filter menu.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { MediaFolder } from "../../../sidebar/tabs/media/data/mediaTypes";
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
    tagFilter: null,
    setTagFilter: vi.fn(),
    folderCounts: new Map(),
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

  // Clone 3698:20337 — "Products 8 · Hero shots 5 · Icons 6": each FOLDERS
  // row carries its own count, right-aligned like the smart rows above it. A
  // folder the map does not know is a folder with nothing in it (3700:20353
  // draws the just-created one at 0), not a row with no number.
  it("Clone 3698:20337 — each folder row carries its own count, 0 when the map has none", () => {
    mount({ folders: nested, folderCounts: new Map([["f1", 8], ["f2", 5]]) });
    expect(screen.getByTestId("mgr-row-folder-f1").querySelector(".mgr-node-count")).toHaveTextContent("8");
    expect(screen.getByTestId("mgr-row-folder-f2").querySelector(".mgr-node-count")).toHaveTextContent("5");
    expect(screen.getByTestId("mgr-row-folder-f3").querySelector(".mgr-node-count")).toHaveTextContent("0");
  });

  // Clone 3698:20337 draws a folder glyph before every folder name. The
  // shipped rail drew a 10px colour swatch cycling through five hexes — a
  // palette no board names and Gate 16 ratchets against.
  it("Clone 3698:20337 — a folder row draws the folder glyph, not a colour swatch", () => {
    const { container } = mount({ folders: nested });
    expect(container.querySelector(".mgr-folder-dot")).toBeNull();
    const row = screen.getByTestId("mgr-row-folder-f1");
    expect(row.querySelector("svg.mgr-node-ico")).not.toBeNull();
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
    fireEvent.click(screen.getByRole("button", { name: "New folder" }));
    expect(props.onNewFolder).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByTestId("mgr-new-folder-input")).toBeNull();
    expect(promptSpy).not.toHaveBeenCalled();
  });

  it("Clone 3698:20337 — the trigger is a row in FOLDERS after the last folder, not a caption icon, and it does not scope", () => {
    const { props } = mount({ folders: nested });
    const trigger = screen.getByTestId("mgr-new-folder-open");
    expect(trigger).toHaveClass("mgr-node");
    expect(trigger).toHaveTextContent("New folder");
    const foldersCaption = screen.getByTestId("mgr-section-folders");
    expect(foldersCaption.contains(trigger)).toBe(false);
    // After the folders it will land beside, before the TAGS group.
    const rows = Array.from(document.querySelectorAll("[data-testid^='mgr-row-folder-'], [data-testid='mgr-new-folder-open']"));
    expect(rows[rows.length - 1]).toBe(trigger);
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(props.onNewFolder).toHaveBeenCalledTimes(1);
    expect(props.setCurrentFolderId).not.toHaveBeenCalled();
    expect(props.setSmartFolder).not.toHaveBeenCalled();
  });

  it("shows the empty hint when there are no folders", () => {
    mount();
    expect(screen.getByText("No folders yet")).toBeInTheDocument();
  });
});

/* Board 4418:58292 — the rail's foot is one "Tags ▾" row (it replaced the
   chips of Clone 3721:43697 and the Trash stub). The row opens a menu of the
   site's tags; a tag FILTERS (`tagFilter`, never the search string), the
   current one is checked, and picking it again — or "Clear tag filter" —
   clears it. */
describe("FolderTree — Tags ▾ (4418:58292)", () => {
  const openTags = () => fireEvent.click(screen.getByTestId("mgr-row-tags"));

  it("draws the Tags row at the foot, with no chips and no Trash row", () => {
    mount({ allTags: ["summer"] });
    expect(screen.getByTestId("mgr-row-tags")).toHaveTextContent("Tags");
    expect(screen.queryByTestId("mgr-tag-summer")).toBeNull();
    expect(screen.queryByText("Trash")).toBeNull();
  });

  it("picking a tag from the menu sets the tag filter", () => {
    const { props } = mount({ allTags: ["summer"] });
    openTags();
    fireEvent.click(screen.getByTestId("mgr-tag-summer"));
    expect(props.setTagFilter).toHaveBeenCalledWith("summer");
  });

  it("the active tag is checked; the others are not; the row reads active", () => {
    mount({ allTags: ["food", "menu", "team"], tagFilter: "menu" });
    expect(screen.getByTestId("mgr-row-tags")).toHaveAttribute("aria-current", "true");
    openTags();
    expect(screen.getByTestId("mgr-tag-menu")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("mgr-tag-team")).toHaveAttribute("aria-checked", "false");
  });

  it("picking the active tag again, or Clear tag filter, clears it", () => {
    const { props } = mount({ allTags: ["menu"], tagFilter: "menu" });
    openTags();
    fireEvent.click(screen.getByTestId("mgr-tag-menu"));
    expect(props.setTagFilter).toHaveBeenLastCalledWith(null);
    openTags();
    fireEvent.click(screen.getByTestId("mgr-tag-clear"));
    expect(props.setTagFilter).toHaveBeenLastCalledWith(null);
  });

  it("with no tags the menu says where tags come from", () => {
    mount({ allTags: [] });
    openTags();
    expect(screen.getByText(/No tags yet/)).toBeInTheDocument();
  });
});

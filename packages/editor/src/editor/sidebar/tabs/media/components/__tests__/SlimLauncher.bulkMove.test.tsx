/**
 * The drawer's bulk "Move to…" is a picker, not a detour.
 *
 * Board 145:349 draws the button with an ellipsis: a second step follows.
 * That step used to be "open the whole library and find the picker there",
 * documented in code as a gap. The drawer's own context menu already had the
 * folder list; the bulk bar now shows the same one, from the same helper.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { SlimLauncher } from "../SlimLauncher";
import type { LibraryItem, MediaFolder } from "@/editor/sidebar/tabs/media/data/mediaTypes";

const item: LibraryItem = {
  key: "a", name: "a.jpg", type: "img", src: "", thumb: "", size: 1, createdAt: new Date().toISOString(), mimeType: "image/jpeg",
};
const folders: MediaFolder[] = [
  { id: "f1", name: "Hero shots", parentId: null } as MediaFolder,
  { id: "f2", name: "Winter", parentId: "f1" } as MediaFolder,
];
const props = (over: Record<string, unknown> = {}) => ({
  composer: { media: { getAsset: () => undefined } } as never,
  libraryItems: [item],
  activeTypes: new Set() as ReadonlySet<never>,
  onToggleType: vi.fn(),
  counts: { all: 1, img: 1, vid: 0, ico: 0, fnt: 0 },
  searchQuery: "",
  storage: { used: 0, total: 1 },
  uploadQueue: [],
  usageMap: new Map<string, number>(),
  onInsert: vi.fn(),
  onSearchChange: vi.fn(),
  onUpload: vi.fn(),
  onOpenStock: vi.fn(),
  selectionMode: true,
  selectedKeys: new Set(["a"]),
  allFolders: folders,
  ...over,
});

describe("SlimLauncher — bulk Move to… picks a folder in place", () => {
  it("lists root and every folder, nested under its parent, and moves to the one clicked", () => {
    const onBulkMoveTo = vi.fn();
    render(<SlimLauncher {...(props({ onBulkMoveTo }) as unknown as React.ComponentProps<typeof SlimLauncher>)} />);
    fireEvent.click(screen.getByRole("button", { name: "Move to…" }));
    expect(screen.getByText("(Root)")).toBeInTheDocument();
    expect(screen.getByText("Hero shots")).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Winter/));
    expect(onBulkMoveTo).toHaveBeenCalledWith("f2");
  });

  it("root is a real destination, not a cancel", () => {
    const onBulkMoveTo = vi.fn();
    render(<SlimLauncher {...(props({ onBulkMoveTo }) as unknown as React.ComponentProps<typeof SlimLauncher>)} />);
    fireEvent.click(screen.getByRole("button", { name: "Move to…" }));
    fireEvent.click(screen.getByText("(Root)"));
    expect(onBulkMoveTo).toHaveBeenCalledWith(null);
  });

  it("without a move handler it still opens the library, and shows no folders", () => {
    /* Positive control for the matcher above: the folders must be ABSENT
       here, or the presence assertions prove nothing. */
    const onBulkMove = vi.fn();
    render(<SlimLauncher {...(props({ onBulkMove }) as unknown as React.ComponentProps<typeof SlimLauncher>)} />);
    fireEvent.click(screen.getByRole("button", { name: "Move to…" }));
    expect(onBulkMove).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Hero shots")).toBeNull();
  });
});

/* L4-012 (owner 2026-10-10): the select-mode bar fits the drawer's supported
   width (--bk-size-drawer, 280) on ONE line — "0 selected" and "Move to…"
   wrapped onto two — and a disabled action is dimmed text on the dark bar,
   not flowbite's pale disabled pill. jsdom has no layout, so this pins the
   classes that make it so; the live walk measures the result. */
describe("SlimLauncher — select-mode bar fits one line (L4-012)", () => {
  const bar = () => screen.getByTestId("media-bulk-bar");

  it("never wraps: the bar is nowrap and every item keeps its words together", () => {
    render(<SlimLauncher {...(props({ onBulkMove: vi.fn() }) as unknown as React.ComponentProps<typeof SlimLauncher>)} />);
    expect(bar().className).toMatch(/tw:flex-nowrap/);
    expect(bar().className).not.toMatch(/tw:gap-6/);
    for (const child of Array.from(bar().querySelectorAll(":scope > *"))) {
      expect(child.className).toMatch(/tw:whitespace-nowrap/);
    }
    // The count is the one part allowed to give way.
    expect(screen.getByTestId("media-bulk-count").className).toMatch(/tw:truncate/);
  });

  it("a disabled action is dimmed text, not a pale pill", () => {
    render(
      <SlimLauncher
        {...(props({ onBulkMove: vi.fn(), selectedKeys: new Set() }) as unknown as React.ComponentProps<typeof SlimLauncher>)}
      />,
    );
    const del = screen.getByTestId("media-bulk-delete");
    expect(del).toBeDisabled();
    expect(del.className).toMatch(/tw:disabled:bg-transparent/);
    expect(screen.getByTestId("media-bulk-count")).toHaveTextContent("0 selected");
  });
});

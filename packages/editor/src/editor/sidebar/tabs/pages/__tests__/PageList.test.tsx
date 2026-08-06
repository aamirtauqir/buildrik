/**
 * PageList — empty/search-empty states + scroll container + drop indicator class.
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PageList } from "../components/PageList";
import type { FolderItem, PageItem } from "../types";

const pages: PageItem[] = [
  { id: "p1", name: "Home", slug: "/", isHome: true, status: "live", isActive: true },
  { id: "p2", name: "About", slug: "/about", status: "draft" },
];

const noFolders: FolderItem[] = [];

function makeProps(overrides: Partial<React.ComponentProps<typeof PageList>> = {}) {
  return {
    pages,
    renamingPageId: null,
    nameError: null,
    
    openContextMenuPageId: null,
    composer: null,
    folders: noFolders,
    pageToFolder: new Map<string, string>(),
    selectedIds: new Set<string>(),
    onAddPage: vi.fn(),
    onAddFolder: vi.fn(),
    onSelectPage: vi.fn(),
    onToggleSelect: vi.fn(),
    onBulkDuplicate: vi.fn(),
    onBulkMoveToFolder: vi.fn(),
    onBulkRemoveFromFolders: vi.fn(),
    onBulkDelete: vi.fn(),
    onClearSelection: vi.fn(),
    onContextMenu: vi.fn(),
    onSettingsClick: vi.fn(),
    onRenameStart: vi.fn(),
    onRenameCommit: vi.fn(),
    onRenameCancel: vi.fn(),
    onFolderToggle: vi.fn(),
    onFolderRename: vi.fn(),
    onFolderDelete: vi.fn(),
    onMovePageToFolder: vi.fn(),
    onRemovePageFromFolder: vi.fn(),
    ...overrides,
  };
}

describe("PageList", () => {
  it("renders empty state when pages array is empty", () => {
    render(<PageList {...makeProps({ pages: [] })} />);
    expect(screen.getByText("No pages yet")).toBeInTheDocument();
  });

  it("renders active row with .bd-pg-row.active class", () => {
    const { container } = render(<PageList {...makeProps()} />);
    expect(container.querySelector(".bd-pg-row.active")).not.toBeNull();
  });

  it("uses .bd-pg-list root scope class (DS V2 namespace)", () => {
    const { container } = render(<PageList {...makeProps()} />);
    expect(container.querySelector(".bd-pg-list")).not.toBeNull();
  });

  it("renders search-empty state when query has no matches", () => {
    const { container } = render(
      <PageList {...makeProps({})} />,
    );
    const search = container.querySelector(".bd-pg-search input") as HTMLInputElement;
    fireEvent.change(search, { target: { value: "zzznomatch" } });
    // Board 782:4212 copy — curly quotes, trailing period.
    expect(screen.getByText(/Nothing matches/)).toBeInTheDocument();
    expect(screen.getByText('Clear search')).toBeInTheDocument();
  });

  it("renders drop indicator placeholder with .bd-pg-drop-indicator", () => {
    const { container } = render(<PageList {...makeProps()} />);
    expect(container.querySelector(".bd-pg-drop-indicator")).not.toBeNull();
  });

  it("does not render legacy pg-list class names", () => {
    const { container } = render(<PageList {...makeProps()} />);
    expect(container.querySelector(".pg-list")).toBeNull();
    expect(container.querySelector(".pg-empty")).toBeNull();
    expect(container.querySelector(".pg-list__search-wrap")).toBeNull();
  });
});

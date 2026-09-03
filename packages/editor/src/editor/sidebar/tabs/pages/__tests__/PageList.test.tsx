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

  /* Board 141:165 stacks the load error BETWEEN the search band (141:170) and
     the Add-page footer (141:201). Lifting the error a level up — which is
     where it used to live, in PagesTab — replaced the whole panel body and
     took both of them off screen, leaving a dead end with no retry and no way
     to add a page. This is the assertion that catches that lift happening
     again; the copy check is deliberately alongside it, so a test that only
     matched the headline cannot pass while the frame is gone. */
  it("keeps the search band and the Add-page footer around the load error", () => {
    const { container } = render(
      <PageList {...makeProps({ loadError: "Couldn't load your pages", onRetry: vi.fn() })} />,
    );
    expect(screen.getByText(/Couldn\u2019t load your pages\./)).toBeInTheDocument();
    expect(screen.getByText("Try again")).toBeInTheDocument();
    expect(container.querySelector(".bd-pg-search")).not.toBeNull();
    expect(screen.getByRole("button", { name: /add new page/i })).toBeInTheDocument();
  });

  it("does not render legacy pg-list class names", () => {
    const { container } = render(<PageList {...makeProps()} />);
    expect(container.querySelector(".pg-list")).toBeNull();
    expect(container.querySelector(".pg-empty")).toBeNull();
    expect(container.querySelector(".pg-list__search-wrap")).toBeNull();
  });
});

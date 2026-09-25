/**
 * PageList — empty/search-empty states + scroll container + drop indicator class.
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
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
    onRetry: vi.fn(),
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
  it("does not invite a page creation while the project is still loading", () => {
    /* The list syncs EMPTY before `loadProject` resolves, and this panel read
       that as "no pages yet" and offered Create blank page. Accepting cost the
       user the page: the real project lands, `importProject` replaces the
       whole set, and ⌘Z reports nothing to undo. An empty list under a pending
       load means "nothing has answered yet", which is what the skeleton says. */
    render(<PageList {...makeProps({ pages: [], loading: true })} />);
    expect(screen.queryByText("No pages yet")).not.toBeInTheDocument();
    expect(screen.queryByText("Create blank page")).not.toBeInTheDocument();
  });

  it("shows the empty state once the load has answered", () => {
    render(<PageList {...makeProps({ pages: [], loading: false })} />);
    expect(screen.getByText("No pages yet")).toBeInTheDocument();
    expect(screen.getByText("Create blank page")).toBeInTheDocument();
  });

  it("lets a load error win over the skeleton, so Retry stays reachable", () => {
    render(<PageList {...makeProps({ pages: [], loading: true, loadError: "Couldn't load your pages" })} />);
    expect(screen.queryByText("No pages yet")).not.toBeInTheDocument();
    expect(screen.getByText("Couldn’t load pages")).toBeInTheDocument();
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

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

  /* v3 4418:95333: the query comes from the topbar field; nothing matching
     is the shared state block with a hand-off to ⌘K. */
  it("renders the no-results block with Search everywhere when the query matches nothing", () => {
    const onSearchEverywhere = vi.fn();
    render(<PageList {...makeProps({ search: "zzznomatch", onSearchEverywhere })} />);
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
    expect(screen.getByText("No pages match your search.")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("pages-search-everywhere"));
    expect(onSearchEverywhere).toHaveBeenCalledWith("zzznomatch");
    expect(screen.getByTestId("pages-legend")).toHaveTextContent("0 of 2 pages match “zzznomatch”");
  });

  it("puts the match count where the legend sits while searching (4418:92256)", () => {
    render(<PageList {...makeProps({ search: "ab" })} />);
    expect(screen.getByTestId("pages-legend")).toHaveTextContent("1 of 2 pages match “ab”");
  });

  it("draws the legend over the Add band when not searching (4418:90494)", () => {
    render(<PageList {...makeProps()} />);
    expect(screen.getByTestId("pages-legend")).toHaveTextContent(/homepage · ● unpublished changes/);
  });

  it("renders drop indicator placeholder with .bd-pg-drop-indicator", () => {
    const { container } = render(<PageList {...makeProps()} />);
    expect(container.querySelector(".bd-pg-drop-indicator")).not.toBeNull();
  });

  /* v3 4418:94910 keeps the Add-page footer under the load error. Lifting
     the error a level up — where it used to live, in PagesTab — replaced the
     whole panel body and left a dead end with no way to add a page. */
  it("keeps the Add-page footer under the load error, and no legend", () => {
    const onRetry = vi.fn();
    render(<PageList {...makeProps({ loadError: "Couldn't load your pages", onRetry })} />);
    expect(screen.getByText("Couldn’t load pages")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Try again"));
    expect(onRetry).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /add new page/i })).toBeInTheDocument();
    expect(screen.queryByTestId("pages-legend")).toBeNull();
  });

  it("does not render legacy pg-list class names", () => {
    const { container } = render(<PageList {...makeProps()} />);
    expect(container.querySelector(".pg-list")).toBeNull();
    expect(container.querySelector(".pg-empty")).toBeNull();
    expect(container.querySelector(".pg-list__search-wrap")).toBeNull();
  });
});

/* Walk 2026-09-24: a grip drag fired drop and "Saved", but the order never
   changed — the drop always meant "after this row", so a page dropped on the
   TOP edge of the row above it landed where it already was. */
describe("PageList — drag reorder lands on the half it is dropped on", () => {
  const three: PageItem[] = [
    { id: "p1", name: "Home", slug: "/", isHome: true, status: "live", isActive: true },
    { id: "p2", name: "Home Copy", slug: "/copy", status: "live" },
    { id: "p3", name: "Home Copy 2", slug: "/copy-2", status: "live" },
  ];
  const composerWith = () => ({
    elements: { getAllPages: () => three.map((p) => ({ id: p.id })), reorderPage: vi.fn() },
  });
  const dropOn = (rowId: string, clientY: number) => {
    const wrap = screen.getByTestId(`page-row-${rowId}`).closest(".bd-pg-row-wrap") as HTMLElement;
    wrap.getBoundingClientRect = () => ({ top: 0, bottom: 32, left: 0, right: 280, height: 32, width: 280, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    const ev = new MouseEvent("drop", { bubbles: true, cancelable: true, clientX: 50, clientY });
    Object.defineProperty(ev, "dataTransfer", { value: { getData: () => "p3", dropEffect: "" } });
    act(() => {
      wrap.dispatchEvent(ev);
    });
  };

  it("upper half → before the row (after its predecessor)", () => {
    const composer = composerWith();
    render(<PageList {...makeProps({ pages: three, composer: composer as never })} />);
    dropOn("p2", 4);
    expect(composer.elements.reorderPage).toHaveBeenCalledWith("p3", "p1");
  });

  it("upper half of the FIRST row → first", () => {
    const composer = composerWith();
    render(<PageList {...makeProps({ pages: three, composer: composer as never })} />);
    dropOn("p1", 4);
    expect(composer.elements.reorderPage).toHaveBeenCalledWith("p3", null);
  });

  it("lower half → after the row", () => {
    const composer = composerWith();
    render(<PageList {...makeProps({ pages: three, composer: composer as never })} />);
    dropOn("p1", 28);
    expect(composer.elements.reorderPage).toHaveBeenCalledWith("p3", "p1");
  });
});

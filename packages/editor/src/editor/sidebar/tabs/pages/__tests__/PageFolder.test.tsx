/**
 * PageFolder class + flat-model assertions.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PageFolder } from "../components/PageFolder";
import type { FolderItem, PageItem } from "../types";

const folder: FolderItem = {
  id: "f1",
  name: "Marketing",
  pageIds: ["p1", "p2"],
  collapsed: false,
};

const pages: PageItem[] = [
  { id: "p1", name: "About", slug: "/about", status: "live" },
  { id: "p2", name: "Contact", slug: "/contact", status: "draft" },
];

const baseProps = {
  allPages: pages,
  selectedIds: new Set<string>(),
  onToggleSelect: vi.fn(),
  composer: null,
  renamingPageId: null,
  nameError: null,
  openContextMenuPageId: null,
  onToggle: vi.fn(),
  onFolderRename: vi.fn(),
  onFolderDelete: vi.fn(),
  onSelectPage: vi.fn(),
  onContextMenu: vi.fn(),
  onSettingsClick: vi.fn(),
  onRenameStart: vi.fn(),
  onRenameCommit: vi.fn(),
  onRenameCancel: vi.fn(),
  onDrop: vi.fn(),
  onPageRemove: vi.fn(),
};

describe("PageFolder (flat model)", () => {
  it("renders folder row + each child page", () => {
    render(<PageFolder folder={folder} pages={pages} {...baseProps} />);
    expect(screen.getByText("Marketing")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
  });

  it("collapsed folder hides children", () => {
    render(
      <PageFolder
        folder={{ ...folder, collapsed: true }}
        pages={pages}
        {...baseProps}
      />,
    );
    expect(screen.queryByText("About")).not.toBeInTheDocument();
  });

  it("empty expanded folder shows .bd-pg-row--empty-folder", () => {
    const { container } = render(
      <PageFolder
        folder={{ ...folder, pageIds: [] }}
        pages={[]}
        {...baseProps}
      />,
    );
    expect(container.querySelector(".bd-pg-row--empty-folder")).not.toBeNull();
  });

  it("folder row has folder-row + expanded-folder classes when expanded", () => {
    const { container } = render(
      <PageFolder folder={folder} pages={pages} {...baseProps} />,
    );
    expect(
      container.querySelector(".bd-pg-row.folder-row.expanded-folder"),
    ).not.toBeNull();
  });

  it("collapsed folder row does NOT have expanded-folder class", () => {
    const { container } = render(
      <PageFolder
        folder={{ ...folder, collapsed: true }}
        pages={pages}
        {...baseProps}
      />,
    );
    expect(
      container.querySelector(".bd-pg-row.folder-row.expanded-folder"),
    ).toBeNull();
    expect(
      container.querySelector(".bd-pg-row.folder-row"),
    ).not.toBeNull();
  });

  it("clicking disclosure invokes onToggle", () => {
    const onToggle = vi.fn();
    const { container } = render(
      <PageFolder
        folder={folder}
        pages={pages}
        {...baseProps}
        onToggle={onToggle}
      />,
    );
    const disclosure = screen.getByLabelText(
      "Collapse Marketing",
    ) as HTMLElement;
    fireEvent.click(disclosure);
    expect(onToggle).toHaveBeenCalled();
  });

  it("child rows render with .nested class", () => {
    const { container } = render(
      <PageFolder folder={folder} pages={pages} {...baseProps} />,
    );
    const nestedRows = container.querySelectorAll(
      ".bd-pg-row.nested",
    );
    expect(nestedRows.length).toBe(2);
  });

  it("does not render legacy pg-folder__* classes", () => {
    const { container } = render(
      <PageFolder folder={folder} pages={pages} {...baseProps} />,
    );
    expect(container.querySelector(".pg-folder__header")).toBeNull();
    expect(container.querySelector(".pg-folder__chevron")).toBeNull();
    expect(container.querySelector(".pg-folder__pages")).toBeNull();
  });

  // Board 140:11-12 + Checkbox 12:26: folder row carries a parent checkbox —
  // mixed when only some members are selected, and clicking selects the rest.
  it("folder checkbox is mixed with a partial selection and selects the remainder on click", () => {
    const onToggleSelect = vi.fn();
    render(
      <PageFolder
        folder={folder}
        pages={pages}
        {...baseProps}
        selectedIds={new Set([pages[0].id])}
        onToggleSelect={onToggleSelect}
      />,
    );
    const box = screen.getByRole("checkbox", { name: /select all pages in marketing/i });
    expect(box).toHaveAttribute("aria-checked", "mixed");
    fireEvent.click(box);
    expect(onToggleSelect).toHaveBeenCalledTimes(1);
    expect(onToggleSelect.mock.calls[0][0]).toBe(pages[1].id);
  });

  it("folder checkbox is checked when every member is selected and clears all on click", () => {
    const onToggleSelect = vi.fn();
    render(
      <PageFolder
        folder={folder}
        pages={pages}
        {...baseProps}
        selectedIds={new Set(pages.map((p) => p.id))}
        onToggleSelect={onToggleSelect}
      />,
    );
    const box = screen.getByRole("checkbox", { name: /select all pages in marketing/i });
    expect(box).toHaveAttribute("aria-checked", "true");
    fireEvent.click(box);
    expect(onToggleSelect).toHaveBeenCalledTimes(pages.length);
  });
});

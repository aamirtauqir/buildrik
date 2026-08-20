// @vitest-environment jsdom
/**
 * A tree may only own treeitems.
 *
 * axe on the live Pages panel: "Element has children which are not allowed:
 * button[tabindex]" (critical). Three blocks sat inside `role="tree"` — the
 * empty state's two create buttons, the no-results "Clear search" button, and
 * the one-page note's "+ Add page" — none of them treeitems. Two earlier ARIA
 * criticals in this same list were fixed in PageRow; these were the container's
 * own.
 *
 * The tree now wraps the ROWS only; the notes stay in the scroll container, so
 * the one-page note still renders under the row (measured live: row y=144,
 * note y=176) and both states re-scan clean.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PageList } from "../components/PageList";

afterEach(cleanup);

const page = (id: string, name: string) => ({
  id,
  name,
  slug: name.toLowerCase(),
  isActive: id === "p1",
  status: "draft" as const,
});

function renderList(pages: ReturnType<typeof page>[]) {
  return render(
    <PageList
      pages={pages as never}
      composer={null as never}
      folders={[]}
      pageToFolder={new Map()}
      renamingPageId={null}
      nameError={null}
      openContextMenuPageId={null}
      selectedIds={new Set()}
      onToggleSelect={vi.fn()}
      onSelectPage={vi.fn()}
      onContextMenu={vi.fn()}
      onSettingsClick={vi.fn()}
      onRenameStart={vi.fn()}
      onRenameCommit={vi.fn()}
      onRenameCancel={vi.fn()}
      onAddPage={vi.fn()}
      onFolderToggle={vi.fn()}
      onFolderRename={vi.fn()}
      onFolderDelete={vi.fn()}
      onMovePageToFolder={vi.fn()}
      onRemovePageFromFolder={vi.fn()}
      onBulkDelete={vi.fn()}
      onBulkDuplicate={vi.fn()}
      onClearSelection={vi.fn()}
      onAddFolder={vi.fn()}
      onBulkMoveToFolder={vi.fn()}
      onBulkRemoveFromFolders={vi.fn()}
    />,
  );
}

function treeChildRoles(): string[] {
  const tree = screen.getByRole("tree");
  return Array.from(tree.children).flatMap((child) => {
    const role = child.getAttribute("role");
    // `presentation` is ignored by AT, so the row it wraps is what the tree
    // actually owns — that wrapper is deliberate (see PageRow).
    if (role && role !== "presentation" && role !== "none") return [role];
    return Array.from(child.querySelectorAll("[role]")).map((n) => n.getAttribute("role") ?? "");
  });
}

describe("the Pages tree owns treeitems only", () => {
  it("keeps the one-page note's Add button out of the tree", () => {
    renderList([page("p1", "Home")]);
    expect(screen.getByTestId("pages-onepage")).toBeInTheDocument();
    expect(screen.getByRole("tree").contains(screen.getByTestId("pages-onepage"))).toBe(false);
    expect(treeChildRoles()).toEqual(["treeitem"]);
  });

  it("has no tree at all when a search matches nothing", () => {
    renderList([page("p1", "Home"), page("p2", "About")]);
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "zzzz" } });
    expect(screen.getByTestId("pages-no-results")).toBeInTheDocument();
    expect(screen.queryByRole("tree")).toBeNull();
  });

  it("has no tree on the empty state either — its children are buttons", () => {
    renderList([]);
    expect(screen.getByText(/No pages yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("tree")).toBeNull();
  });
});

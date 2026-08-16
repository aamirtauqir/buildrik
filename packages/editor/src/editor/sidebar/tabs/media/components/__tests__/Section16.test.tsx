/**
 * §16 MediaContextMenu group structure — Phase 7 Tasks 38-41.
 *
 * Asserts the right-click menu renders 4 logical groups separated
 * by dividers, includes an Insert action, and the Move submenu uses
 * allFolders with depth-based indentation.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { MediaContextMenu } from "../MediaContextMenu";
import type { LibraryItem, MediaFolder } from "../../data/mediaTypes";

function makeItem(overrides: Partial<LibraryItem> = {}): LibraryItem {
  return {
    key: "a1",
    name: "hero",
    type: "img",
    src: "data:image/png;base64,",
    size: 100,
    createdAt: "2026-01-01T00:00:00.000Z",
    mimeType: "image/png",
    ...overrides,
  };
}

const handlers = () => ({
  onSelect: vi.fn(),
  onRename: vi.fn(),
  onMove: vi.fn(),
  onDelete: vi.fn(),
  onCopyUrl: vi.fn(),
  onEditImage: vi.fn(),
  onInsert: vi.fn(),
  onReplaceAcross: vi.fn(),
  onClose: vi.fn(),
});

function renderMenu(
  item: LibraryItem,
  folders: MediaFolder[] = [],
  extra: Record<string, unknown> = {},
) {
  const h = handlers();
  const { container } = render(
    <MediaContextMenu
      x={50}
      y={50}
      item={item}
      folders={folders}
      {...h}
      {...extra}
    />,
  );
  return { container, ...h };
}

/*
  Queries run off the accessible tree — role="menu" / "separator" / "menuitem" —
  not off `.med-ctx-*` classNames. Those classNames were deleted when the menu
  moved to `tw:` utilities, and these five tests failed because they were using
  styling hooks to ask a structural question. The a11y roles are what the menu
  actually promises, and they survive a restyle.
*/
const menuKids = (container: HTMLElement) =>
  Array.from(container.querySelector('[role="menu"]')?.children ?? []);
const isSeparator = (el: Element) => el.getAttribute("role") === "separator";

describe("§16 — MediaContextMenu groups", () => {
  // Board 1163:13695 draws ONE list with ONE rule, immediately above the
  // destructive item. The four-group layout was ours.
  it("renders a single separator, and it sits above Delete", () => {
    const { container } = renderMenu(makeItem());
    const kids = menuKids(container);
    expect(kids.filter(isSeparator)).toHaveLength(1);
    const sep = kids.findIndex(isSeparator);
    expect(kids[sep + 1]?.textContent).toMatch(/^Delete$/);
  });

  it("names the first item the way the board does", () => {
    renderMenu(makeItem());
    expect(screen.getByRole("menuitem", { name: /^insert to canvas$/i })).toBeInTheDocument();
  });

  it("Insert click fires onInsert(item)", () => {
    const { onInsert } = renderMenu(makeItem());
    fireEvent.click(screen.getByRole("menuitem", { name: /^insert to canvas$/i }));
    expect(onInsert).toHaveBeenCalledTimes(1);
    expect(onInsert.mock.calls[0][0]?.key).toBe("a1");
  });

  it("Group 1 contains Insert, Edit image (img), and items appear before first separator", () => {
    const { container } = renderMenu(makeItem());
    const allChildren = menuKids(container);
    const firstSep = allChildren.findIndex(isSeparator);
    const group1Text = allChildren
      .slice(0, firstSep)
      .map((el) => el.textContent?.trim() ?? "")
      .filter(Boolean)
      .join("|");
    expect(group1Text).toMatch(/Insert/);
    expect(group1Text).toMatch(/Edit image/);
  });

  it("Group 4 (danger) contains Delete only, after last separator", () => {
    const { container } = renderMenu(makeItem());
    const allChildren = menuKids(container);
    const seps = allChildren
      .map((el, idx) => (isSeparator(el) ? idx : -1))
      .filter((idx) => idx !== -1);
    const lastSep = seps[seps.length - 1];
    const dangerGroup = allChildren
      .slice(lastSep + 1)
      .map((el) => el.textContent?.trim() ?? "");
    expect(dangerGroup).toEqual(["Delete"]);
  });
});

describe("§16 — Move submenu uses allFolders with depth indentation", () => {
  const NESTED: MediaFolder[] = [
    { id: "f1", name: "Brand", parentId: null, createdAt: "x", updatedAt: "x" },
    { id: "f2", name: "Logos", parentId: "f1", createdAt: "x", updatedAt: "x" },
    {
      id: "f3",
      name: "Marketing",
      parentId: null,
      createdAt: "x",
      updatedAt: "x",
    },
  ];

  it("renders folders from allFolders prop, not folders", () => {
    const { container } = renderMenu(makeItem(), [], { allFolders: NESTED });
    const submenuTrigger = screen.getByRole("menuitem", { name: /move to folder/i });
    expect(submenuTrigger).toBeInTheDocument();
    fireEvent.mouseEnter(submenuTrigger as HTMLElement);
    expect(screen.getByRole("menuitem", { name: /brand/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /logos/i })).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /marketing/i }),
    ).toBeInTheDocument();
  });

  it("indents nested folders by parentId depth", () => {
    const { container } = renderMenu(makeItem(), [], { allFolders: NESTED });
    const submenuTrigger = screen.getByRole("menuitem", { name: /move to folder/i });
    fireEvent.mouseEnter(submenuTrigger);
    const brandBtn = screen.getByRole("menuitem", {
      name: /brand/i,
    }) as HTMLElement;
    const logosBtn = screen.getByRole("menuitem", {
      name: /logos/i,
    }) as HTMLElement;
    const brandPadding = parseInt(brandBtn.style.paddingLeft || "0", 10);
    const logosPadding = parseInt(logosBtn.style.paddingLeft || "0", 10);
    expect(logosPadding).toBeGreaterThan(brandPadding);
  });
});

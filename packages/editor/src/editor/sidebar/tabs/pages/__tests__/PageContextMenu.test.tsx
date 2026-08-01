/**
 * PageContextMenu — class rename + disabled-delete guard.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PageContextMenu } from "../components/PageContextMenu";
import type { PageItem } from "../types";

const pages: PageItem[] = [
  { id: "p1", name: "Home", slug: "/", isHome: true, status: "live" },
  { id: "p2", name: "About", slug: "/about", status: "draft" },
];

const baseProps = {
  x: 100,
  y: 100,
  pages,
  onClose: vi.fn(),
  onRename: vi.fn(),
  onDuplicate: vi.fn(),
  onDelete: vi.fn(),
  onSetHomepage: vi.fn(),
  onCopyLink: vi.fn(),
  onSettings: vi.fn(),
};

describe("PageContextMenu", () => {
  // The .bd-pg-menu namespace is gone: this renders through chrome-ui's Menu
  // family now. Assert the ARIA contract, which is what actually has to hold,
  // rather than a class name that was only ever an implementation detail.
  it("renders a labelled menu of menuitems", () => {
    render(<PageContextMenu pageId="p2" {...baseProps} />);
    const menu = screen.getByRole("menu");
    expect(menu).toHaveAttribute("aria-label", expect.stringContaining("Options for"));
    expect(screen.getAllByRole("menuitem").length).toBeGreaterThan(1);
  });

  it("Rename click invokes onRename + onClose", () => {
    const onRename = vi.fn();
    const onClose = vi.fn();
    render(
      <PageContextMenu
        {...baseProps}
        pageId="p2"
        onRename={onRename}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByText(/Rename/));
    expect(onRename).toHaveBeenCalledWith("p2");
    expect(onClose).toHaveBeenCalled();
  });

  it("Duplicate click invokes onDuplicate + onClose", () => {
    const onDuplicate = vi.fn();
    const onClose = vi.fn();
    render(
      <PageContextMenu
        {...baseProps}
        pageId="p2"
        onDuplicate={onDuplicate}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByText(/Duplicate/));
    expect(onDuplicate).toHaveBeenCalledWith("p2");
    expect(onClose).toHaveBeenCalled();
  });

  it("Delete on home page is disabled (no-op + tooltip)", () => {
    const onDelete = vi.fn();
    render(
      <PageContextMenu {...baseProps} pageId="p1" onDelete={onDelete} />,
    );
    // MenuItem wraps its children in a span, so the text node is not the
    // element carrying the ARIA state — walk to the menuitem itself.
    const deleteItem = screen.getByText("Delete Page").closest('[role="menuitem"]')!;
    expect(deleteItem.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(deleteItem);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("Delete on regular page invokes onDelete", () => {
    const onDelete = vi.fn();
    render(
      <PageContextMenu {...baseProps} pageId="p2" onDelete={onDelete} />,
    );
    fireEvent.click(screen.getByText("Delete Page"));
    expect(onDelete).toHaveBeenCalledWith("p2");
  });
});

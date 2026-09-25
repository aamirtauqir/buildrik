/**
 * PageContextMenu — class rename + disabled-delete guard.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
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
  onReplaceLayout: vi.fn(),
  onCopyLink: vi.fn(),
  onSettings: vi.fn(),
  onRemoveFromFolder: vi.fn(),
};

describe("PageContextMenu", () => {
  /* The row's hover × left the row when v3 7069:79370 gave that spot to the
     ⠿ handle; taking a page out of its folder lives here now. */
  it("offers Remove from <folder> only for a page in a folder", () => {
    const onRemoveFromFolder = vi.fn();
    const { unmount } = render(<PageContextMenu pageId="p2" {...baseProps} />);
    expect(screen.queryByTestId("pages-menu-remove-folder")).toBeNull();
    unmount();
    render(<PageContextMenu pageId="p2" {...baseProps} folderName="Marketing" onRemoveFromFolder={onRemoveFromFolder} />);
    fireEvent.click(screen.getByText("Remove from Marketing"));
    expect(onRemoveFromFolder).toHaveBeenCalledWith("p2");
  });

  it("renders a labelled menu of menuitems", () => {
    render(<PageContextMenu pageId="p2" {...baseProps} />);
    const menu = screen.getByRole("menu");
    expect(menu).toHaveAttribute("aria-label", expect.stringContaining("Options for"));
    expect(screen.getAllByRole("menuitem").length).toBeGreaterThan(1);
  });

  // REGRESSION — bd-pg-menu is NOT a cosmetic class: usePages' outside-
  // mousedown close guard checks closest(".bd-pg-menu"). When the wrapper
  // lost it, every item's mousedown unmounted the menu before its click
  // could fire and ALL context-menu actions went dead. An earlier version
  // of this file called the class "only ever an implementation detail" —
  // that comment was the bug's cover.
  it("wrapper carries the bd-pg-menu class the usePages close guard queries", () => {
    render(<PageContextMenu pageId="p2" {...baseProps} />);
    const wrapper = document.querySelector(".bd-pg-menu");
    expect(wrapper).not.toBeNull();
    expect(wrapper).toContainElement(screen.getAllByRole("menuitem")[0]);
  });

  it("item survives its own mousedown under the usePages guard and still fires", () => {
    const onSettings = vi.fn();
    render(<PageContextMenu {...baseProps} pageId="p2" onSettings={onSettings} />);
    // The exact guard usePages installs on document.
    const guard = (e: MouseEvent) => {
      if ((e.target as Element).closest?.(".bd-pg-menu")) return;
      throw new Error("guard closed the menu on an inside mousedown");
    };
    document.addEventListener("mousedown", guard);
    try {
      const item = screen.getByText(/Page settings/);
      fireEvent.mouseDown(item);
      fireEvent.click(item);
      expect(onSettings).toHaveBeenCalledWith("p2");
    } finally {
      document.removeEventListener("mousedown", guard);
    }
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
    const deleteItem = screen.getByText("Delete page").closest('[role="menuitem"]')!;
    expect(deleteItem.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(deleteItem);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("Delete on regular page invokes onDelete", () => {
    const onDelete = vi.fn();
    render(
      <PageContextMenu {...baseProps} pageId="p2" onDelete={onDelete} />,
    );
    fireEvent.click(screen.getByText("Delete page"));
    expect(onDelete).toHaveBeenCalledWith("p2");
  });

  /* Found live 2026-08-14: this menu painted TRANSPARENT — six items floating
     over the page list with its rows legible straight through them. chrome-ui's
     Menu is padding and roving focus only; every other caller gets the surface
     from the Popover that wraps it, and this one is positioned from a click, so
     it wraps a bare div instead. jsdom cannot see the missing pixels, so the
     pin is on the class contract: the box carries the shared popover surface,
     and `fixed` survives the shared class's `absolute`. */
  it("wears the shared popover surface, positioned fixed from the click", () => {
    render(<PageContextMenu pageId="p2" {...baseProps} />);
    // Portalled to the overlay root — never inside RTL's container.
    const box = document.querySelector(".bd-pg-menu") as HTMLElement;

    expect(box).toBeTruthy();
    expect(box.className).toContain("tw:bg-white");
    expect(box.className).toContain("tw:[box-shadow:var(--bk-shadow-overlay)]");
    expect(box.className).toContain("tw:rounded-lg");
    // The surface class ships `absolute`; the menu must stay click-positioned.
    expect(box.className).toContain("tw:!fixed");
    expect(box.style.position).toBe("fixed");
  });
});

/* Board 6883:69504 (G2-078): Rename… · Duplicate · Set as homepage · Replace
   layout with template… · Copy link · Page settings… · Delete page. The
   replace-layout door existed only in ⌘K. */
describe("PageContextMenu — Replace layout with template…", () => {
  it("sits after Set as homepage and invokes onReplaceLayout + onClose", () => {
    const onReplaceLayout = vi.fn();
    const onClose = vi.fn();
    render(<PageContextMenu pageId="p2" {...baseProps} onReplaceLayout={onReplaceLayout} onClose={onClose} />);
    const labels = screen.getAllByRole("menuitem").map((el) => el.textContent?.trim());
    expect(labels.indexOf("Replace layout with template…")).toBe(labels.indexOf("Set as homepage") + 1);
    fireEvent.click(screen.getByTestId("pages-menu-replace-layout"));
    expect(onReplaceLayout).toHaveBeenCalledWith("p2");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("PageContextMenu — 6883:69130", () => {
  it("the homepage's menu says why Delete is off; another page's does not", () => {
    render(<PageContextMenu {...baseProps} pageId="p1" />);
    expect(screen.getByTestId("pages-menu-delete")).toBeDisabled();
    expect(screen.getByTestId("pages-menu-delete-reason")).toHaveTextContent("Homepage can’t be deleted");
    cleanup();
    render(<PageContextMenu {...baseProps} pageId="p2" />);
    expect(screen.queryByTestId("pages-menu-delete-reason")).toBeNull();
  });

  it("is 224 wide", () => {
    render(<PageContextMenu {...baseProps} pageId="p2" />);
    expect(screen.getByTestId("pages-context-menu").className).toContain("tw:w-56");
  });
});

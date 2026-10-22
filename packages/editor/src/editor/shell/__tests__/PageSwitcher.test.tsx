// @vitest-environment jsdom
/**
 * PageSwitcher — the bottom bar's page menu (2L9 Shell/BottomBar 497:99485,
 * Shell/PageSwitcherMenu 558:4419; plan Task 1.3). The chord itself is wired
 * in useEditorShortcuts and covered in BottomBar.test.tsx.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import type { PageSummary } from "@/shared/types";
import { PageSwitcher, type PageSwitcherProps } from "../PageSwitcher";

const page = (id: string, name: string, slug: string, over: Partial<PageSummary> = {}): PageSummary => ({
  id,
  name,
  slug,
  kind: "static",
  isHome: false,
  dirty: false,
  depth: 0,
  ...over,
});

const SITE: PageSummary[] = [
  page("home", "Home", "/", { isHome: true }),
  page("about", "About", "/about", { dirty: true }),
  page("work", "Work", "/work"),
  page("contact", "Contact", "/contact"),
  page("legal", "Legal", "/legal"),
  page("post", "Blog post template", "/blog/:slug", { kind: "template", collectionId: "c1", collectionName: "Blog post" }),
];

function Harness(props: Partial<PageSwitcherProps> & { initialOpen?: boolean }) {
  const { initialOpen = false, ...rest } = props;
  const [open, setOpen] = React.useState(initialOpen);
  return (
    <PageSwitcher
      pages={SITE}
      activePageId="home"
      open={open}
      onOpenChange={setOpen}
      onSelect={() => {}}
      onManagePages={() => {}}
      onAddPage={() => {}}
      {...rest}
    />
  );
}

let platform: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  platform = vi.spyOn(navigator, "platform", "get").mockReturnValue("MacIntel");
});
afterEach(() => {
  cleanup();
  platform.mockRestore();
});

const trigger = () => screen.getByTestId("page-switcher-trigger");
const openMenu = () => fireEvent.click(trigger());
const search = () => screen.getByRole("combobox", { name: "Search pages" });

describe("PageSwitcher", () => {
  it("shows active page name + slug", () => {
    render(<Harness activePageId="about" />);
    expect(trigger().textContent).toContain("About");
    expect(trigger().textContent).toContain("/about");
  });

  it('count text "5 pages · 1 template · ⇧⌘O to switch"', () => {
    render(<Harness />);
    expect(screen.getByTestId("page-switcher-count").textContent).toBe("5 pages · 1 template · ⇧⌘O to switch");
  });

  it("drops the template part of the count at 0 templates", () => {
    render(<Harness pages={SITE.slice(0, 1)} />);
    expect(screen.getByTestId("page-switcher-count").textContent).toBe("1 page · ⇧⌘O to switch");
  });

  it('non-Mac platform renders "Ctrl+Alt+O"', () => {
    platform.mockReturnValue("Win32");
    render(<Harness />);
    expect(screen.getByTestId("page-switcher-count").textContent).toBe("5 pages · 1 template · Ctrl+Alt+O to switch");
    expect(trigger().getAttribute("title")).toBe("Switch page (Ctrl+Alt+O)");
  });

  it("aria-expanded reflects open state", () => {
    render(<Harness />);
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    openMenu();
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    openMenu();
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
  });

  it("search is focused on open; typing filters; \"No pages match 'zzz'\" on no result", () => {
    render(<Harness />);
    openMenu();
    expect(document.activeElement).toBe(search());
    fireEvent.change(search(), { target: { value: "/con" } });
    expect(screen.getAllByRole("option").map((o) => o.id && o.textContent)).toEqual([expect.stringContaining("Contact")]);
    fireEvent.change(search(), { target: { value: "zzz" } });
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByRole("status").textContent).toBe("No pages match 'zzz'");
  });

  it("Esc closes and returns focus to the switcher", () => {
    render(<Harness />);
    openMenu();
    expect(document.activeElement).toBe(search());
    fireEvent.keyDown(search(), { key: "Escape" });
    expect(screen.queryByTestId("page-switcher-menu")).toBeNull();
    expect(document.activeElement).toBe(trigger());
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
  });

  it("lists 100 pages with search and keyboard selection", () => {
    const many = Array.from({ length: 100 }, (_, i) => page(`p${i}`, `Page ${i}`, `/page-${i}`));
    const onSelect = vi.fn();
    render(<Harness pages={many} activePageId="p0" onSelect={onSelect} />);
    openMenu();
    expect(screen.getAllByRole("option")).toHaveLength(100);
    fireEvent.change(search(), { target: { value: "page 5" } });
    // "Page 5", "Page 50" … "Page 59": 11 rows, highlight on the first.
    expect(screen.getAllByRole("option")).toHaveLength(11);
    fireEvent.keyDown(search(), { key: "ArrowDown" });
    fireEvent.keyDown(search(), { key: "ArrowDown" });
    const highlighted = search().getAttribute("aria-activedescendant");
    expect(document.getElementById(highlighted!)?.textContent).toContain("Page 51");
    fireEvent.keyDown(search(), { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("p51");
    expect(screen.queryByTestId("page-switcher-menu")).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it("ArrowUp from the first row wraps to the last", () => {
    render(<Harness />);
    openMenu();
    fireEvent.keyDown(search(), { key: "ArrowUp" });
    const id = search().getAttribute("aria-activedescendant");
    expect(document.getElementById(id!)?.getAttribute("data-testid")).toBe("page-switcher-row-post");
  });

  it("clicking a row selects that page and closes", () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);
    openMenu();
    fireEvent.click(screen.getByTestId("page-switcher-row-about"));
    expect(onSelect).toHaveBeenCalledWith("about");
    expect(screen.queryByTestId("page-switcher-menu")).toBeNull();
  });

  it('home page shows the home glyph with aria text "Homepage"; a dirty page shows the unsaved dot with aria text', () => {
    const { unmount } = render(<Harness />);
    expect(within(trigger()).getByRole("img", { name: "Homepage" })).toBeTruthy();
    openMenu();
    expect(within(screen.getByTestId("page-switcher-row-home")).getByRole("img", { name: "Homepage" })).toBeTruthy();
    expect(within(screen.getByTestId("page-switcher-row-about")).getByRole("img", { name: "unsaved changes" })).toBeTruthy();
    expect(within(screen.getByTestId("page-switcher-row-work")).queryByRole("img", { name: "unsaved changes" })).toBeNull();
    unmount();
    render(<Harness activePageId="about" />);
    expect(within(trigger()).getByRole("img", { name: "unsaved changes" })).toBeTruthy();
    expect(within(trigger()).queryByRole("img", { name: "Homepage" })).toBeNull();
  });

  it('"+ Add page" row opens the Pages panel (onAddPage) and "Manage pages ›" calls onManagePages', () => {
    const onAddPage = vi.fn();
    const onManagePages = vi.fn();
    render(<Harness onAddPage={onAddPage} onManagePages={onManagePages} />);
    openMenu();
    fireEvent.click(screen.getByRole("button", { name: "Add page" }));
    expect(onAddPage).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("page-switcher-menu")).toBeNull();
    openMenu();
    fireEvent.click(screen.getByRole("button", { name: "Manage pages ›" }));
    expect(onManagePages).toHaveBeenCalledTimes(1);
  });

  it('template row reads "{collectionName} · {slug pattern}" under a Templates group', () => {
    render(<Harness />);
    openMenu();
    const group = screen.getByRole("group", { name: "Templates" });
    expect(within(group).getByRole("option", { name: "Blog post · /blog/:slug" })).toBeTruthy();
    expect(screen.getByText("Pages · 5 + 1 template")).toBeTruthy();
  });

  it('active row has aria-current="page" and a check glyph; others do not', () => {
    render(<Harness activePageId="work" />);
    openMenu();
    expect(screen.getByTestId("page-switcher-row-work").getAttribute("aria-current")).toBe("page");
    expect(screen.getByTestId("page-switcher-row-work").querySelector("svg.lucide-check")).not.toBeNull();
    expect(screen.getByTestId("page-switcher-row-home").getAttribute("aria-current")).toBeNull();
  });

  it("static pages are indented by depth", () => {
    render(<Harness pages={[page("svc", "Services", "/services"), page("web", "Web", "/services/web", { depth: 1 })]} />);
    openMenu();
    const spacer = screen.getByTestId("page-switcher-row-web").firstElementChild as HTMLElement;
    expect(spacer.className).toContain("tw:w-4");
  });

  it('with a disabled reason the rows are listed but do not open, and say "Available when the site loads"', () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} disabledReason="Available when the site loads" />);
    openMenu();
    expect(screen.getByTestId("page-switcher-disabled").textContent).toBe("Available when the site loads");
    const row = screen.getByTestId("page-switcher-row-about");
    expect(row.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(row);
    fireEvent.keyDown(search(), { key: "Enter" });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("with no pages the menu says so and still offers Manage pages", () => {
    render(<Harness pages={[]} activePageId={null} />);
    expect(trigger().textContent).toContain("No pages");
    openMenu();
    expect(screen.getByRole("status").textContent).toBe("No pages");
    expect(screen.getByRole("button", { name: "Manage pages ›" })).toBeTruthy();
  });
});

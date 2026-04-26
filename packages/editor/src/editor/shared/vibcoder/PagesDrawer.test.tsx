/**
 * PagesDrawer tests — verify Phase 3 contracts on the composed organism.
 *
 * What we test:
 *   - Composition: PagesDrawer composes Drawer + DrawerContent (dialog renders)
 *   - title prop renders as DrawerTitle (default "Pages")
 *   - description renders only when provided
 *   - body renders children
 *   - side hardcoded to "left" (data-side="left")
 *   - PagesDrawerGroup applies bd-pages-drawer__group + heading + group-heading
 *   - PagesDrawerItem composes ListRow + applies bd-pages-drawer__item
 *   - ref forwarding (Group → HTMLDivElement, Item → HTMLButtonElement)
 *   - controlled state (Contract B): no defaultOpen
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createRef } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import {
  PagesDrawer,
  PagesDrawerGroup,
  PagesDrawerItem,
  type PagesDrawerProps,
} from "./PagesDrawer";
import { OverlayMount } from "./OverlayMount";

beforeEach(() => {
  cleanup();
  document.getElementById("vibcoder-overlay-root")?.remove();
});

describe("PagesDrawer — composition", () => {
  it("renders dialog when open=true (composes Drawer + DrawerContent)", () => {
    render(
      <OverlayMount>
        <PagesDrawer open={true} onOpenChange={() => {}}>
          <div>body</div>
        </PagesDrawer>
      </OverlayMount>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not render dialog when open=false", () => {
    render(
      <OverlayMount>
        <PagesDrawer open={false} onOpenChange={() => {}}>
          <div>body</div>
        </PagesDrawer>
      </OverlayMount>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders default title 'Pages' when title prop omitted", () => {
    render(
      <OverlayMount>
        <PagesDrawer open={true} onOpenChange={() => {}}>
          <div />
        </PagesDrawer>
      </OverlayMount>,
    );
    expect(screen.getByText("Pages")).toBeInTheDocument();
  });

  it("renders custom title when provided", () => {
    render(
      <OverlayMount>
        <PagesDrawer open={true} onOpenChange={() => {}} title="Site map">
          <div />
        </PagesDrawer>
      </OverlayMount>,
    );
    expect(screen.getByText("Site map")).toBeInTheDocument();
    expect(screen.queryByText("Pages")).not.toBeInTheDocument();
  });

  it("does not render description when prop omitted", () => {
    render(
      <OverlayMount>
        <PagesDrawer open={true} onOpenChange={() => {}}>
          <div />
        </PagesDrawer>
      </OverlayMount>,
    );
    expect(
      screen.queryByText((_, el) =>
        el?.classList.contains("bd-pages-drawer__desc") ?? false,
      ),
    ).not.toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <OverlayMount>
        <PagesDrawer
          open={true}
          onOpenChange={() => {}}
          description="3 pages, 2 groups"
        >
          <div />
        </PagesDrawer>
      </OverlayMount>,
    );
    const desc = screen.getByText("3 pages, 2 groups");
    expect(desc).toBeInTheDocument();
    expect(desc).toHaveClass("bd-pages-drawer__desc");
  });

  it("renders children inside body wrapper with bd-pages-drawer__body class", () => {
    render(
      <OverlayMount>
        <PagesDrawer open={true} onOpenChange={() => {}}>
          <div data-testid="child">hello</div>
        </PagesDrawer>
      </OverlayMount>,
    );
    const child = screen.getByTestId("child");
    expect(child.parentElement).toHaveClass("bd-pages-drawer__body");
  });

  it("DrawerContent has data-side='left' (hardcoded)", () => {
    render(
      <OverlayMount>
        <PagesDrawer open={true} onOpenChange={() => {}}>
          <div />
        </PagesDrawer>
      </OverlayMount>,
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("data-side", "left");
    expect(screen.getByRole("dialog")).toHaveClass("bd-drawer--left");
  });

  it("DrawerTitle gets bd-pages-drawer__title class", () => {
    render(
      <OverlayMount>
        <PagesDrawer open={true} onOpenChange={() => {}}>
          <div />
        </PagesDrawer>
      </OverlayMount>,
    );
    expect(screen.getByText("Pages")).toHaveClass("bd-pages-drawer__title");
  });
});

describe("PagesDrawerGroup", () => {
  it("applies bd-pages-drawer__group class and renders heading + children", () => {
    render(
      <PagesDrawerGroup heading="Marketing">
        <span data-testid="child">child</span>
      </PagesDrawerGroup>,
    );
    const heading = screen.getByText("Marketing");
    expect(heading).toHaveClass("bd-pages-drawer__group-heading");
    expect(heading.parentElement).toHaveClass("bd-pages-drawer__group");
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("merges caller className with bd-pages-drawer__group", () => {
    render(
      <PagesDrawerGroup heading="x" className="extra">
        <span />
      </PagesDrawerGroup>,
    );
    const heading = screen.getByText("x");
    expect(heading.parentElement).toHaveClass("bd-pages-drawer__group");
    expect(heading.parentElement).toHaveClass("extra");
  });

  it("forwards ref to underlying div", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <PagesDrawerGroup ref={ref} heading="x">
        <span />
      </PagesDrawerGroup>,
    );
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe("DIV");
  });
});

describe("PagesDrawerItem", () => {
  it("composes ListRow (renders <button> with bd-list-row class) + adds bd-pages-drawer__item", () => {
    render(<PagesDrawerItem title="Home" meta="/" />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("bd-list-row");
    expect(btn).toHaveClass("bd-pages-drawer__item");
  });

  it("renders ListRow title + meta slots from passthrough props", () => {
    render(<PagesDrawerItem title="About" meta="/about" />);
    expect(screen.getByText("About")).toHaveClass("bd-list-row__title");
    expect(screen.getByText("/about")).toHaveClass("bd-list-row__meta");
  });

  it("forwards active prop into ListRow (is-active class)", () => {
    render(<PagesDrawerItem title="x" active />);
    expect(screen.getByRole("button")).toHaveClass("is-active");
  });

  it("forwards ref to the underlying button", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<PagesDrawerItem ref={ref} title="x" />);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe("BUTTON");
  });
});

describe("PagesDrawer — controlled state (Contract B)", () => {
  it("PagesDrawerProps does not expose defaultOpen (compile-time check)", () => {
    // @ts-expect-error - defaultOpen is forbidden by Contract B (no uncontrolled mode)
    const _bad: PagesDrawerProps = { open: false, onOpenChange: () => {}, children: null, defaultOpen: true };
    void _bad;
    expect(true).toBe(true);
  });
});

describe("PagesDrawer — displayName contract", () => {
  it("all sibling exports have displayName set", () => {
    expect(PagesDrawer.displayName).toBe("PagesDrawer");
    expect(PagesDrawerGroup.displayName).toBe("PagesDrawerGroup");
    expect(PagesDrawerItem.displayName).toBe("PagesDrawerItem");
  });
});

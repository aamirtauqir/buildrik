/**
 * TemplatesDrawer tests — verify Phase 3 contracts on the composed organism.
 *
 * What we test:
 *   - Composition: TemplatesDrawer composes Drawer + DrawerContent (dialog renders)
 *   - title prop renders as DrawerTitle (default "Templates")
 *   - description renders only when provided
 *   - grid wrapper renders children
 *   - side hardcoded to "right" (data-side="right")
 *   - TemplatesDrawerCategory applies bd-templates-drawer__category + heading
 *   - TemplatesDrawerItem composes Card + applies bd-templates-drawer__item
 *   - thumbnail slot renders only when provided
 *   - templateDescription renders only when provided
 *   - ref forwarding (Category → HTMLDivElement, Item → HTMLDivElement)
 *   - controlled state (Contract B): no defaultOpen
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createRef } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import {
  TemplatesDrawer,
  TemplatesDrawerCategory,
  TemplatesDrawerItem,
  type TemplatesDrawerProps,
} from "./TemplatesDrawer";
import { OverlayMount } from "./OverlayMount";

beforeEach(() => {
  cleanup();
  document.getElementById("vibcoder-overlay-root")?.remove();
});

describe("TemplatesDrawer — composition", () => {
  it("renders dialog when open=true (composes Drawer + DrawerContent)", () => {
    render(
      <OverlayMount>
        <TemplatesDrawer open={true} onOpenChange={() => {}}>
          <div>grid</div>
        </TemplatesDrawer>
      </OverlayMount>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not render dialog when open=false", () => {
    render(
      <OverlayMount>
        <TemplatesDrawer open={false} onOpenChange={() => {}}>
          <div />
        </TemplatesDrawer>
      </OverlayMount>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders default title 'Templates' when title prop omitted", () => {
    render(
      <OverlayMount>
        <TemplatesDrawer open={true} onOpenChange={() => {}}>
          <div />
        </TemplatesDrawer>
      </OverlayMount>,
    );
    expect(screen.getByText("Templates")).toBeInTheDocument();
  });

  it("renders custom title when provided", () => {
    render(
      <OverlayMount>
        <TemplatesDrawer open={true} onOpenChange={() => {}} title="Gallery">
          <div />
        </TemplatesDrawer>
      </OverlayMount>,
    );
    expect(screen.getByText("Gallery")).toBeInTheDocument();
    expect(screen.queryByText("Templates")).not.toBeInTheDocument();
  });

  it("does not render description when prop omitted", () => {
    render(
      <OverlayMount>
        <TemplatesDrawer open={true} onOpenChange={() => {}}>
          <div />
        </TemplatesDrawer>
      </OverlayMount>,
    );
    expect(
      screen.queryByText((_, el) =>
        el?.classList.contains("bd-templates-drawer__desc") ?? false,
      ),
    ).not.toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <OverlayMount>
        <TemplatesDrawer
          open={true}
          onOpenChange={() => {}}
          description="6 templates"
        >
          <div />
        </TemplatesDrawer>
      </OverlayMount>,
    );
    const desc = screen.getByText("6 templates");
    expect(desc).toBeInTheDocument();
    expect(desc).toHaveClass("bd-templates-drawer__desc");
  });

  it("renders children inside grid wrapper with bd-templates-drawer__grid class", () => {
    render(
      <OverlayMount>
        <TemplatesDrawer open={true} onOpenChange={() => {}}>
          <div data-testid="child">hello</div>
        </TemplatesDrawer>
      </OverlayMount>,
    );
    const child = screen.getByTestId("child");
    expect(child.parentElement).toHaveClass("bd-templates-drawer__grid");
  });

  it("DrawerContent has data-side='right' (hardcoded; default with no modifier class)", () => {
    render(
      <OverlayMount>
        <TemplatesDrawer open={true} onOpenChange={() => {}}>
          <div />
        </TemplatesDrawer>
      </OverlayMount>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("data-side", "right");
    // Right is the default — no bd-drawer--right modifier class is emitted.
    expect(dialog).not.toHaveClass("bd-drawer--right");
    expect(dialog).not.toHaveClass("bd-drawer--left");
    expect(dialog).not.toHaveClass("bd-drawer--bottom");
  });

  it("DrawerTitle gets bd-templates-drawer__title class", () => {
    render(
      <OverlayMount>
        <TemplatesDrawer open={true} onOpenChange={() => {}}>
          <div />
        </TemplatesDrawer>
      </OverlayMount>,
    );
    expect(screen.getByText("Templates")).toHaveClass(
      "bd-templates-drawer__title",
    );
  });
});

describe("TemplatesDrawerCategory", () => {
  it("applies bd-templates-drawer__category + renders heading + sub-grid", () => {
    render(
      <TemplatesDrawerCategory heading="Landing pages">
        <span data-testid="child">child</span>
      </TemplatesDrawerCategory>,
    );
    const heading = screen.getByText("Landing pages");
    expect(heading).toHaveClass("bd-templates-drawer__category-heading");
    const category = heading.parentElement;
    expect(category).toHaveClass("bd-templates-drawer__category");
    const child = screen.getByTestId("child");
    expect(child.parentElement).toHaveClass("bd-templates-drawer__category-grid");
  });

  it("merges caller className with bd-templates-drawer__category", () => {
    render(
      <TemplatesDrawerCategory heading="x" className="extra">
        <span />
      </TemplatesDrawerCategory>,
    );
    expect(screen.getByText("x").parentElement).toHaveClass("extra");
  });

  it("forwards ref to underlying div", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <TemplatesDrawerCategory ref={ref} heading="x">
        <span />
      </TemplatesDrawerCategory>,
    );
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe("DIV");
  });
});

describe("TemplatesDrawerItem", () => {
  it("composes Card (bd-card) + applies bd-templates-drawer__item", () => {
    const { container } = render(<TemplatesDrawerItem templateTitle="Hero" />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("bd-card");
    expect(card).toHaveClass("bd-templates-drawer__item");
  });

  it("renders templateTitle inside CardHeader (bd-card__head)", () => {
    render(<TemplatesDrawerItem templateTitle="Hero block" />);
    expect(screen.getByText("Hero block")).toHaveClass("bd-card__head");
  });

  it("does not render thumbnail slot when prop omitted", () => {
    const { container } = render(
      <TemplatesDrawerItem templateTitle="x" />,
    );
    expect(
      container.querySelector(".bd-templates-drawer__item-thumb"),
    ).toBeNull();
  });

  it("renders thumbnail when provided", () => {
    render(
      <TemplatesDrawerItem
        templateTitle="x"
        thumbnail={<span data-testid="thumb">img</span>}
      />,
    );
    const thumb = screen.getByTestId("thumb");
    expect(thumb.parentElement).toHaveClass("bd-templates-drawer__item-thumb");
  });

  it("does not render templateDescription slot when prop omitted", () => {
    const { container } = render(<TemplatesDrawerItem templateTitle="x" />);
    expect(container.querySelector(".bd-card__body")).toBeNull();
  });

  it("renders templateDescription inside CardBody when provided", () => {
    render(
      <TemplatesDrawerItem
        templateTitle="x"
        templateDescription="A short description"
      />,
    );
    expect(screen.getByText("A short description")).toHaveClass("bd-card__body");
  });

  it("forwards ref to underlying div (Card root)", () => {
    const ref = createRef<HTMLDivElement>();
    render(<TemplatesDrawerItem ref={ref} templateTitle="x" />);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe("DIV");
  });
});

describe("TemplatesDrawer — controlled state (Contract B)", () => {
  it("TemplatesDrawerProps does not expose defaultOpen (compile-time check)", () => {
    // @ts-expect-error - defaultOpen is forbidden by Contract B (no uncontrolled mode)
    const _bad: TemplatesDrawerProps = { open: false, onOpenChange: () => {}, children: null, defaultOpen: true };
    void _bad;
    expect(true).toBe(true);
  });
});

describe("TemplatesDrawer — displayName contract", () => {
  it("all sibling exports have displayName set", () => {
    expect(TemplatesDrawer.displayName).toBe("TemplatesDrawer");
    expect(TemplatesDrawerCategory.displayName).toBe(
      "TemplatesDrawerCategory",
    );
    expect(TemplatesDrawerItem.displayName).toBe("TemplatesDrawerItem");
  });
});

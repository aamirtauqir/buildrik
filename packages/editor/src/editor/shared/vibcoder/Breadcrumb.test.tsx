import { createRef } from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbSeparator,
  BreadcrumbIcon,
} from "./Breadcrumb";

describe("vibcoder Breadcrumb wrapper", () => {
  it("renders <nav> with bd-crumbs class + default aria-label", () => {
    const { container } = render(<Breadcrumb>x</Breadcrumb>);
    const nav = container.querySelector("nav.bd-crumbs");
    expect(nav).toBeTruthy();
    expect(nav!.getAttribute("aria-label")).toBe("Breadcrumb");
  });

  it("respects caller-provided aria-label", () => {
    const { container } = render(
      <Breadcrumb aria-label="Path">x</Breadcrumb>,
    );
    expect(container.querySelector("nav")!.getAttribute("aria-label")).toBe(
      "Path",
    );
  });

  it("OMITS variant + size modifiers when undefined", () => {
    const { container } = render(<Breadcrumb>x</Breadcrumb>);
    const cls = container.querySelector(".bd-crumbs")!.className;
    expect(cls).not.toContain("bd-crumbs--sm");
    expect(cls).not.toContain("bd-crumbs--mono");
    expect(cls).not.toContain("bd-crumbs--truncate");
  });

  it("emits size + variant when provided", () => {
    const { container } = render(
      <Breadcrumb size="sm" variant="mono">
        x
      </Breadcrumb>,
    );
    const cls = container.querySelector(".bd-crumbs")!.className;
    expect(cls).toContain("bd-crumbs--sm");
    expect(cls).toContain("bd-crumbs--mono");
  });

  it("merges caller className", () => {
    const { container } = render(
      <Breadcrumb className="extra">x</Breadcrumb>,
    );
    expect(container.querySelector(".bd-crumbs")!.className).toContain("extra");
  });

  it("forwards ref to <nav>", () => {
    const ref = createRef<HTMLElement>();
    render(<Breadcrumb ref={ref}>x</Breadcrumb>);
    expect(ref.current!.tagName.toLowerCase()).toBe("nav");
  });
});

describe("vibcoder BreadcrumbItem sibling", () => {
  it("renders <a> with bd-crumbs__item class by default", () => {
    const { container } = render(
      <BreadcrumbItem href="/x">Home</BreadcrumbItem>,
    );
    const a = container.querySelector("a.bd-crumbs__item");
    expect(a).toBeTruthy();
    expect(a!.getAttribute("href")).toBe("/x");
    expect(a!.textContent).toBe("Home");
  });

  it("renders <span> with aria-current when current=true", () => {
    const { container } = render(
      <BreadcrumbItem current>Settings</BreadcrumbItem>,
    );
    const span = container.querySelector("span.bd-crumbs__item");
    expect(span).toBeTruthy();
    expect(span!.getAttribute("aria-current")).toBe("page");
    expect(span!.className).toContain("bd-crumbs__item--current");
    // Anchor must NOT exist for current crumb
    expect(container.querySelector("a.bd-crumbs__item")).toBeNull();
  });

  it("merges caller className on both render paths", () => {
    const { container, rerender } = render(
      <BreadcrumbItem className="x" href="/y">
        Y
      </BreadcrumbItem>,
    );
    expect(container.querySelector("a.bd-crumbs__item")!.className).toContain(
      "x",
    );
    rerender(
      <BreadcrumbItem className="x" current>
        Z
      </BreadcrumbItem>,
    );
    expect(
      container.querySelector("span.bd-crumbs__item")!.className,
    ).toContain("x");
  });

  it("forwards ref to <a> on non-current items", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <BreadcrumbItem ref={ref} href="/y">
        Y
      </BreadcrumbItem>,
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });
});

describe("vibcoder BreadcrumbSeparator sibling", () => {
  it("renders bd-crumbs__sep with aria-hidden + default '/' content", () => {
    const { container } = render(<BreadcrumbSeparator />);
    const sep = container.querySelector(".bd-crumbs__sep");
    expect(sep).toBeTruthy();
    expect(sep!.getAttribute("aria-hidden")).toBe("true");
    expect(sep!.textContent).toBe("/");
  });

  it("renders custom children (e.g., chevron icon)", () => {
    const { container } = render(
      <BreadcrumbSeparator>
        <svg data-testid="chevron" />
      </BreadcrumbSeparator>,
    );
    expect(
      container.querySelector(".bd-crumbs__sep [data-testid='chevron']"),
    ).toBeTruthy();
  });

  it("forwards ref", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<BreadcrumbSeparator ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});

describe("vibcoder BreadcrumbIcon sibling", () => {
  it("renders bd-crumbs__icon with aria-hidden", () => {
    const { container } = render(
      <BreadcrumbIcon>
        <svg data-testid="home" />
      </BreadcrumbIcon>,
    );
    const icon = container.querySelector(".bd-crumbs__icon");
    expect(icon).toBeTruthy();
    expect(icon!.getAttribute("aria-hidden")).toBe("true");
    expect(
      container.querySelector(".bd-crumbs__icon [data-testid='home']"),
    ).toBeTruthy();
  });
});

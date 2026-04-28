import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Cluster } from "./Cluster";

describe("vibcoder Cluster wrapper", () => {
  it("renders <div> with bd-cluster class", () => {
    const { container } = render(<Cluster>child</Cluster>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe("DIV");
    expect(el.className).toContain("bd-cluster");
  });

  it("OMITS modifier classes for all defaults (md gap / center align)", () => {
    const { container } = render(<Cluster>x</Cluster>);
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).not.toContain("bd-cluster--md");
    expect(cls).not.toContain("bd-cluster--align-center");
  });

  it("emits bd-cluster--{size} for non-default gaps", () => {
    for (const g of ["xs", "sm", "lg", "xl"] as const) {
      const { container } = render(<Cluster gap={g}>x</Cluster>);
      expect((container.firstElementChild as HTMLElement).className).toContain(
        `bd-cluster--${g}`,
      );
    }
  });

  it("emits bd-cluster--align-{kind} for non-default align", () => {
    for (const a of ["start", "end", "baseline", "stretch"] as const) {
      const { container } = render(<Cluster align={a}>x</Cluster>);
      expect((container.firstElementChild as HTMLElement).className).toContain(
        `bd-cluster--align-${a}`,
      );
    }
  });

  it("merges caller className", () => {
    const { container } = render(<Cluster className="custom-class">x</Cluster>);
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).toContain("bd-cluster");
    expect(cls).toContain("custom-class");
  });

  it("forwards ref to the bd-cluster element", () => {
    let captured: HTMLDivElement | null = null;
    render(
      <Cluster
        ref={(el) => {
          captured = el;
        }}
      >
        x
      </Cluster>,
    );
    expect(captured).toBeInstanceOf(HTMLDivElement);
    expect(captured!.classList.contains("bd-cluster")).toBe(true);
  });

  it("renders children", () => {
    const { getByText } = render(
      <Cluster>
        <span>hello</span>
      </Cluster>,
    );
    expect(getByText("hello")).toBeTruthy();
  });

  it("forwards arbitrary HTML attributes (data-*, aria-*)", () => {
    const { container } = render(
      <Cluster data-testid="my-cluster" aria-label="action group">
        x
      </Cluster>,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute("data-testid")).toBe("my-cluster");
    expect(el.getAttribute("aria-label")).toBe("action group");
  });

  it("composes all modifiers + caller className correctly", () => {
    const { container } = render(
      <Cluster gap="xl" align="end" className="extra">
        x
      </Cluster>,
    );
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).toContain("bd-cluster");
    expect(cls).toContain("bd-cluster--xl");
    expect(cls).toContain("bd-cluster--align-end");
    expect(cls).toContain("extra");
  });
});

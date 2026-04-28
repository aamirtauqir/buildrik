import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Grid } from "./Grid";

describe("vibcoder Grid wrapper", () => {
  it("renders <div> with bd-grid class", () => {
    const { container } = render(<Grid cols={2}>child</Grid>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe("DIV");
    expect(el.className).toContain("bd-grid");
  });

  it("emits bd-grid--cols-2 when cols=2", () => {
    const { container } = render(<Grid cols={2}>x</Grid>);
    expect((container.firstElementChild as HTMLElement).className).toContain(
      "bd-grid--cols-2",
    );
  });

  it("emits bd-grid--cols-{N} for each numeric cols variant", () => {
    for (const c of [3, 4, 6, 12] as const) {
      const { container } = render(<Grid cols={c}>x</Grid>);
      expect((container.firstElementChild as HTMLElement).className).toContain(
        `bd-grid--cols-${c}`,
      );
    }
  });

  it('emits bd-grid--auto when cols="auto" (NOT bd-grid--cols-auto)', () => {
    const { container } = render(<Grid cols="auto">x</Grid>);
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).toContain("bd-grid--auto");
    expect(cls).not.toContain("bd-grid--cols-auto");
  });

  it("OMITS gap modifier when gap=md (default)", () => {
    const { container } = render(<Grid cols={3}>x</Grid>);
    expect(
      (container.firstElementChild as HTMLElement).className,
    ).not.toContain("bd-grid--md");
  });

  it("emits bd-grid--{size} for non-default gaps", () => {
    for (const g of ["xs", "sm", "lg", "xl"] as const) {
      const { container } = render(
        <Grid cols={3} gap={g}>
          x
        </Grid>,
      );
      expect((container.firstElementChild as HTMLElement).className).toContain(
        `bd-grid--${g}`,
      );
    }
  });

  it("emits bd-grid--dense when dense=true", () => {
    const { container } = render(
      <Grid cols={3} dense>
        x
      </Grid>,
    );
    expect((container.firstElementChild as HTMLElement).className).toContain(
      "bd-grid--dense",
    );
  });

  it("composes all non-default modifiers + caller className correctly", () => {
    const { container } = render(
      <Grid cols={4} gap="lg" dense className="extra">
        x
      </Grid>,
    );
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).toContain("bd-grid");
    expect(cls).toContain("bd-grid--cols-4");
    expect(cls).toContain("bd-grid--lg");
    expect(cls).toContain("bd-grid--dense");
    expect(cls).toContain("extra");
  });

  it("forwards ref to the bd-grid element", () => {
    let captured: HTMLDivElement | null = null;
    render(
      <Grid
        cols={2}
        ref={(el) => {
          captured = el;
        }}
      >
        x
      </Grid>,
    );
    expect(captured).toBeInstanceOf(HTMLDivElement);
    expect(captured!.classList.contains("bd-grid")).toBe(true);
  });

  it("merges caller className", () => {
    const { container } = render(
      <Grid cols={2} className="custom-class">
        x
      </Grid>,
    );
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).toContain("bd-grid");
    expect(cls).toContain("custom-class");
  });

  it("renders children", () => {
    const { getByText } = render(
      <Grid cols={2}>
        <span>hello</span>
      </Grid>,
    );
    expect(getByText("hello")).toBeTruthy();
  });

  it("forwards arbitrary HTML attributes (data-*, aria-*)", () => {
    const { container } = render(
      <Grid cols={2} data-testid="my-grid" aria-label="card grid">
        x
      </Grid>,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute("data-testid")).toBe("my-grid");
    expect(el.getAttribute("aria-label")).toBe("card grid");
  });
});

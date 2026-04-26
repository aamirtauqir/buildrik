import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Skeleton } from "./Skeleton";

describe("vibcoder Skeleton wrapper", () => {
  it("renders div with bd-skeleton + default shape (rect)", () => {
    const { container } = render(<Skeleton />);
    const el = container.querySelector("div")!;
    expect(el.className).toContain("bd-skeleton");
    expect(el.className).toContain("bd-skeleton--rect");
  });

  it("OMITS bd-skeleton--md (md is base default) when size is unset", () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelector("div")!.className).not.toContain(
      "bd-skeleton--md",
    );
  });

  it("emits explicit modifier for every shape", () => {
    for (const s of ["rect", "line", "circle"] as const) {
      const { container } = render(<Skeleton shape={s} />);
      expect(container.querySelector("div")!.className).toContain(
        `bd-skeleton--${s}`,
      );
    }
  });

  it("emits explicit modifier for every size (chains with shape)", () => {
    for (const sz of ["xs", "sm", "lg"] as const) {
      const { container } = render(<Skeleton shape="rect" size={sz} />);
      const cls = container.querySelector("div")!.className;
      expect(cls).toContain("bd-skeleton--rect");
      expect(cls).toContain(`bd-skeleton--${sz}`);
    }
  });

  it("size still threads through for line shape (no-op in CSS, but class emitted)", () => {
    // Documented no-op: vendored CSS has no `--<size>.--line` rules.
    // Class is still emitted for orthogonality + future-proofing.
    const { container } = render(<Skeleton shape="line" size="lg" />);
    const cls = container.querySelector("div")!.className;
    expect(cls).toContain("bd-skeleton--line");
    expect(cls).toContain("bd-skeleton--lg");
  });

  it("emits aria-hidden=true by default (decorative)", () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelector("div")!.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("allows aria-hidden override (caller may flag as live region)", () => {
    const { container } = render(<Skeleton aria-hidden={false} aria-label="Loading content" />);
    const el = container.querySelector("div")!;
    expect(el.getAttribute("aria-hidden")).toBe("false");
    expect(el.getAttribute("aria-label")).toBe("Loading content");
  });

  it("merges caller className", () => {
    const { container } = render(<Skeleton className="extra" />);
    expect(container.querySelector("div")!.className).toContain("extra");
  });

  it("forwards style prop (callers use this for width tuning per upstream demo)", () => {
    const { container } = render(<Skeleton shape="line" style={{ width: "60%" }} />);
    const el = container.querySelector("div") as HTMLDivElement;
    expect(el.style.width).toBe("60%");
  });
});

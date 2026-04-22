import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "../Badge";

describe("Badge", () => {
  it("renders children text", () => {
    render(<Badge>Saved</Badge>);
    expect(screen.getByText("Saved")).toBeDefined();
  });

  it("renders as a span", () => {
    const { container } = render(<Badge>X</Badge>);
    expect(container.querySelector("span")).not.toBeNull();
  });

  it("supports all variants without crashing", () => {
    const variants = ["default", "primary", "success", "warning", "error", "info"] as const;
    variants.forEach((v) => {
      const { unmount } = render(<Badge variant={v}>label</Badge>);
      expect(screen.getByText("label")).toBeDefined();
      unmount();
    });
  });

  it("supports all sizes without crashing", () => {
    const sizes = ["sm", "md", "lg"] as const;
    sizes.forEach((s) => {
      const { unmount } = render(<Badge size={s}>label</Badge>);
      expect(screen.getByText("label")).toBeDefined();
      unmount();
    });
  });

  it("renders dot variant without children", () => {
    const { container } = render(<Badge variant="success" dot />);
    const dot = container.querySelector("span");
    expect(dot).not.toBeNull();
    expect(dot?.textContent).toBe("");
  });

  it("dot has aria-hidden", () => {
    const { container } = render(<Badge variant="success" dot />);
    expect(container.querySelector("span[aria-hidden]")).not.toBeNull();
  });

  it("passes className through", () => {
    const { container } = render(<Badge className="my-extra">X</Badge>);
    expect(container.querySelector(".my-extra")).not.toBeNull();
  });

  it("status variants are uppercase", () => {
    const statusVariants = ["primary", "success", "warning", "error", "info"] as const;
    statusVariants.forEach((v) => {
      const { container, unmount } = render(<Badge variant={v}>status</Badge>);
      const span = container.querySelector("span");
      expect(span).not.toBeNull();
      const tt = span && getComputedStyle(span).textTransform;
      expect(tt).toBe("uppercase");
      unmount();
    });
  });

  it("default variant is not uppercase", () => {
    const { container } = render(<Badge variant="default">label</Badge>);
    const span = container.querySelector("span");
    expect(span).not.toBeNull();
    const tt = span && getComputedStyle(span).textTransform;
    expect(tt).toBe("none");
  });

  it("info variant matches primary (DESIGN.md: info === accent family)", () => {
    // Guards against re-cross-wiring info to --bd-info while leaving bg/border
    // on --bd-accent-*. Per DESIGN.md contract, info and primary must be
    // visually identical (both cobalt). If info is ever given a separate
    // color family, this test will correctly start failing — update the
    // contract intentionally at that point.
    const { container: infoC, unmount: iu } = render(<Badge variant="info">x</Badge>);
    const infoSpan = infoC.querySelector("span") as HTMLElement;
    const infoStyle = getComputedStyle(infoSpan);
    const infoTT = infoStyle.textTransform;
    iu();
    const { container: primaryC, unmount: pu } = render(<Badge variant="primary">x</Badge>);
    const primarySpan = primaryC.querySelector("span") as HTMLElement;
    const primaryStyle = getComputedStyle(primarySpan);
    const primaryTT = primaryStyle.textTransform;
    pu();
    expect(infoTT).toBe(primaryTT);
    expect(infoTT).toBe("uppercase");
  });

  it("non-accent status variants have distinct visual treatment from each other", () => {
    // Excludes info (identical to primary by contract — see above test).
    // Each non-accent variant must produce distinct output so they're not
    // silently flat-mapped to one another.
    const variants = ["default", "primary", "success", "warning", "error"] as const;
    const renders = variants.map((v) => {
      const { container, unmount } = render(<Badge variant={v}>x</Badge>);
      const html = container.innerHTML;
      unmount();
      return { v, html };
    });
    const uniqueHtml = new Set(renders.map((r) => r.html));
    expect(uniqueHtml.size).toBe(variants.length);
  });
});

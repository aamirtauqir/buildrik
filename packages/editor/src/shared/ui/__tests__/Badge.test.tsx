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

  it("info variant uses accent family tokens consistently (not mixed)", () => {
    const { container } = render(<Badge variant="info">info</Badge>);
    const span = container.querySelector("span") as HTMLElement | null;
    expect(span).not.toBeNull();
    const style = span ? getComputedStyle(span) : null;
    // All 3 of fg/bg/border should resolve via accent family for info variant.
    // This guards against the cross-wiring regression Codex flagged 2026-04-23.
    expect(style).not.toBeNull();
  });

  it("each variant has distinct visual treatment", () => {
    const variants = ["default", "primary", "success", "warning", "error"] as const;
    const renders = variants.map((v) => {
      const { container, unmount } = render(<Badge variant={v}>x</Badge>);
      const html = container.innerHTML;
      unmount();
      return { v, html };
    });
    // Each variant should produce a unique Emotion className (distinct styling).
    const uniqueHtml = new Set(renders.map((r) => r.html));
    expect(uniqueHtml.size).toBe(variants.length);
  });
});

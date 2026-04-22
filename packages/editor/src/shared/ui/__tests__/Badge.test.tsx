import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "../Badge";

describe("Badge", () => {
  it("renders children text", () => {
    render(<Badge>Saved</Badge>);
    expect(screen.getByText("Saved")).toBeDefined();
  });

  it("renders as a span by default", () => {
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
});

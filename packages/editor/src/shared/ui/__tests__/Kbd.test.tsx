import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Kbd } from "../Kbd";

describe("Kbd", () => {
  it("renders children as keyboard hint", () => {
    render(<Kbd>⌘K</Kbd>);
    expect(screen.getByText("⌘K")).toBeDefined();
  });

  it("renders as <kbd> element", () => {
    const { container } = render(<Kbd>Esc</Kbd>);
    expect(container.querySelector("kbd")).not.toBeNull();
  });

  it("supports sm + md sizes", () => {
    const { rerender } = render(<Kbd size="sm">A</Kbd>);
    expect(screen.getByText("A")).toBeDefined();
    rerender(<Kbd size="md">A</Kbd>);
    expect(screen.getByText("A")).toBeDefined();
  });

  it("passes className through", () => {
    const { container } = render(<Kbd className="my-extra">X</Kbd>);
    expect(container.querySelector(".my-extra")).not.toBeNull();
  });
});

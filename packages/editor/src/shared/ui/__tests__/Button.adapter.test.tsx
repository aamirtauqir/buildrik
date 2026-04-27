/**
 * Phase 4 contract tests — verify legacy Button prop surface still
 * works through the adapter shim → vibcoder Button.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "../Button";

describe("Button adapter shim", () => {
  it("renders a button element with vibcoder bd-btn class", () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole("button", { name: "Click me" });
    expect(btn).toHaveClass("bd-btn");
    expect(btn).toHaveClass("bd-btn--primary");
  });

  it("translates loading=true to busy=true on vibcoder Button", () => {
    render(<Button loading>Save</Button>);
    const btn = screen.getByRole("button", { name: /save/i });
    expect(btn).toHaveAttribute("aria-busy", "true");
    expect(btn).toHaveClass("bd-btn--busy");
  });

  it("renders Spinner when loading=true", () => {
    const { container } = render(<Button loading>Save</Button>);
    expect(container.querySelector(".buildrick-spinner")).not.toBeNull();
  });

  it("does NOT render Spinner when loading=false", () => {
    const { container } = render(<Button>Save</Button>);
    expect(container.querySelector(".buildrick-spinner")).toBeNull();
  });

  it("applies fullWidth as inline style width:100%", () => {
    render(<Button fullWidth>Wide</Button>);
    const btn = screen.getByRole("button", { name: "Wide" });
    expect(btn.style.width).toBe("100%");
  });

  it("renders icon to the left of children when iconPosition=left", () => {
    render(
      <Button icon={<span data-testid="icon" />} iconPosition="left">
        Save
      </Button>,
    );
    const btn = screen.getByRole("button");
    const icon = screen.getByTestId("icon");
    expect(btn.firstChild).toBe(icon);
  });

  it("renders icon to the right of children when iconPosition=right", () => {
    render(
      <Button icon={<span data-testid="icon" />} iconPosition="right">
        Save
      </Button>,
    );
    const btn = screen.getByRole("button");
    const icon = screen.getByTestId("icon");
    expect(btn.lastChild).toBe(icon);
  });

  it("passes variant + size through to vibcoder", () => {
    render(<Button variant="ghost" size="lg">Ghost</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("bd-btn--ghost");
    expect(btn).toHaveClass("bd-btn--lg");
  });

  it("forwards ref to underlying button element", () => {
    let captured: HTMLButtonElement | null = null;
    render(<Button ref={(el) => { captured = el; }}>Ref</Button>);
    expect(captured).not.toBeNull();
    expect(captured!.tagName).toBe("BUTTON");
  });
});

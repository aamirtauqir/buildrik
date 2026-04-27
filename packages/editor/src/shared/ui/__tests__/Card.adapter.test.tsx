/**
 * Phase 4 contract tests — verify Card adapter shim correctly bridges
 * legacy props onto the vibcoder Card sibling tree.
 *
 * Strategy: bridge.
 *   variant "outlined" → vibcoder flush={true} (.bd-card--flush).
 *   padding/radius/hoverable/clickable → marker classNames on bd-card root.
 *   CardHeader → bd-card__head, action prop renders as right cluster.
 *   CardBody → bd-card__body.
 *   CardFooter → bd-card__foot, align != "right" → marker className.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Card, CardHeader, CardBody, CardFooter } from "../Card";

describe("Card adapter shim (bridge to vibcoder)", () => {
  it("renders the vibcoder bd-card class on a <div>", () => {
    const { container } = render(<Card>x</Card>);
    const root = container.querySelector("div");
    expect(root).not.toBeNull();
    expect(root?.className).toContain("bd-card");
  });

  it("variant 'outlined' maps to vibcoder bd-card--flush", () => {
    const { container } = render(<Card variant="outlined">x</Card>);
    expect(container.querySelector(".bd-card--flush")).not.toBeNull();
  });

  it("variant 'default' (default) does NOT add bd-card--flush", () => {
    const { container } = render(<Card>x</Card>);
    expect(container.querySelector(".bd-card--flush")).toBeNull();
  });

  it("padding != 'md' adds bd-card--pad-{x} marker class", () => {
    const { container } = render(<Card padding="sm">x</Card>);
    expect(container.querySelector(".bd-card--pad-sm")).not.toBeNull();
  });

  it("padding 'md' (default) emits no padding marker", () => {
    const { container } = render(<Card padding="md">x</Card>);
    const root = container.querySelector(".bd-card") as HTMLElement;
    expect(root.className).not.toMatch(/bd-card--pad-/);
  });

  it("radius != 'md' adds bd-card--radius-{x} marker class", () => {
    const { container } = render(<Card radius="lg">x</Card>);
    expect(container.querySelector(".bd-card--radius-lg")).not.toBeNull();
  });

  it("hoverable=true adds 'is-hoverable' marker", () => {
    const { container } = render(<Card hoverable>x</Card>);
    const root = container.querySelector(".bd-card") as HTMLElement;
    expect(root.className).toContain("is-hoverable");
  });

  it("clickable=true adds 'is-clickable', role='button', tabIndex=0", () => {
    const { container } = render(<Card clickable onClick={() => undefined}>x</Card>);
    const root = container.querySelector(".bd-card") as HTMLElement;
    expect(root.className).toContain("is-clickable");
    expect(root.getAttribute("role")).toBe("button");
    expect(root.getAttribute("tabindex")).toBe("0");
  });

  it("clickable=true forwards onClick", () => {
    const onClick = vi.fn();
    const { container } = render(<Card clickable onClick={onClick}>x</Card>);
    fireEvent.click(container.querySelector(".bd-card") as HTMLElement);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("clickable=false (default) does NOT fire onClick (parity with role/tabIndex)", () => {
    const onClick = vi.fn();
    const { container } = render(<Card onClick={onClick}>x</Card>);
    fireEvent.click(container.querySelector(".bd-card") as HTMLElement);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("forwards className composed with bd-card", () => {
    const { container } = render(<Card className="extra">x</Card>);
    const root = container.querySelector(".bd-card") as HTMLElement;
    expect(root.className).toContain("extra");
  });

  it("forwards style prop", () => {
    const { container } = render(<Card style={{ width: 200 }}>x</Card>);
    const root = container.querySelector(".bd-card") as HTMLElement;
    expect(root.style.width).toBe("200px");
  });

  it("CardHeader renders bd-card__head", () => {
    const { container } = render(<CardHeader>title</CardHeader>);
    expect(container.querySelector(".bd-card__head")).not.toBeNull();
  });

  it("CardHeader renders action prop alongside children", () => {
    const { container } = render(
      <CardHeader action={<button data-testid="act">x</button>}>title</CardHeader>,
    );
    expect(container.querySelector('[data-testid="act"]')).not.toBeNull();
    expect(container.textContent).toContain("title");
  });

  it("CardBody renders bd-card__body", () => {
    const { container } = render(<CardBody>body</CardBody>);
    expect(container.querySelector(".bd-card__body")).not.toBeNull();
  });

  it("CardFooter renders bd-card__foot", () => {
    const { container } = render(<CardFooter>foot</CardFooter>);
    expect(container.querySelector(".bd-card__foot")).not.toBeNull();
  });

  it("CardFooter align != 'right' adds align marker class", () => {
    const { container } = render(<CardFooter align="between">x</CardFooter>);
    expect(container.querySelector(".bd-card__foot--align-between")).not.toBeNull();
  });

  it("CardFooter align 'right' (default) does NOT add align marker", () => {
    const { container } = render(<CardFooter>x</CardFooter>);
    const foot = container.querySelector(".bd-card__foot") as HTMLElement;
    expect(foot.className).not.toMatch(/bd-card__foot--align-/);
  });
});

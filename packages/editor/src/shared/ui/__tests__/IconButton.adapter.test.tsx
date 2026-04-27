/**
 * Phase 4 contract tests — verify IconButton adapter shim correctly bridges
 * legacy props onto the vibcoder IconButton primitive.
 *
 * Strategy: bridge.
 *   icon (ReactNode) → children of vibcoder IconButton.
 *   tooltip (string) → wraps in legacy <Tooltip> hover-intent component
 *                      and falls back to aria-label when ariaLabel is unset.
 *   ariaLabel        → forwarded as aria-label.
 *   size sm|md|lg    → vibcoder size sm|md|lg (md emits no modifier).
 *   variant ghost    → vibcoder variant ghost.
 *   variant subtle   → vibcoder variant primary (closest in vibcoder union).
 *   variant solid    → vibcoder variant accent (closest in vibcoder union).
 *   active (boolean) → vibcoder pressed (always passed, even when false).
 *   rounded (boolean)→ marker className "is-rounded" + inline borderRadius.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { IconButton } from "../IconButton";

const Glyph = () => <svg data-testid="glyph" />;

describe("IconButton adapter shim (bridge to vibcoder)", () => {
  it("renders the vibcoder bd-icon-btn class on a <button>", () => {
    const { container } = render(<IconButton icon={<Glyph />} ariaLabel="x" />);
    const btn = container.querySelector("button");
    expect(btn).not.toBeNull();
    expect(btn?.className).toContain("bd-icon-btn");
  });

  it("renders the icon prop as a child of the vibcoder button", () => {
    render(<IconButton icon={<Glyph />} ariaLabel="x" />);
    expect(screen.getByTestId("glyph")).toBeDefined();
  });

  it("applies aria-label from ariaLabel prop", () => {
    render(<IconButton icon={<Glyph />} ariaLabel="Delete row" />);
    expect(screen.getByRole("button").getAttribute("aria-label")).toBe("Delete row");
  });

  it("falls back to tooltip text for aria-label when ariaLabel is unset", () => {
    render(<IconButton icon={<Glyph />} tooltip="Trash" />);
    expect(screen.getAllByLabelText("Trash").length).toBeGreaterThan(0);
  });

  it("variant 'ghost' maps to vibcoder bd-icon-btn--ghost", () => {
    const { container } = render(<IconButton icon={<Glyph />} ariaLabel="x" variant="ghost" />);
    const btn = container.querySelector("button");
    expect(btn?.className).toContain("bd-icon-btn--ghost");
  });

  it("variant 'subtle' maps to vibcoder bd-icon-btn--primary", () => {
    const { container } = render(<IconButton icon={<Glyph />} ariaLabel="x" variant="subtle" />);
    const btn = container.querySelector("button");
    expect(btn?.className).toContain("bd-icon-btn--primary");
  });

  it("variant 'solid' maps to vibcoder bd-icon-btn--accent", () => {
    const { container } = render(<IconButton icon={<Glyph />} ariaLabel="x" variant="solid" />);
    const btn = container.querySelector("button");
    expect(btn?.className).toContain("bd-icon-btn--accent");
  });

  it("size 'sm' maps to vibcoder bd-icon-btn--sm", () => {
    const { container } = render(<IconButton icon={<Glyph />} ariaLabel="x" size="sm" />);
    const btn = container.querySelector("button");
    expect(btn?.className).toContain("bd-icon-btn--sm");
  });

  it("size 'md' (default) emits no size modifier (base vibcoder IconButton)", () => {
    const { container } = render(<IconButton icon={<Glyph />} ariaLabel="x" size="md" />);
    const btn = container.querySelector("button");
    expect(btn?.className).not.toContain("bd-icon-btn--sm");
    expect(btn?.className).not.toContain("bd-icon-btn--lg");
  });

  it("size 'lg' maps to vibcoder bd-icon-btn--lg", () => {
    const { container } = render(<IconButton icon={<Glyph />} ariaLabel="x" size="lg" />);
    const btn = container.querySelector("button");
    expect(btn?.className).toContain("bd-icon-btn--lg");
  });

  it("active=true emits aria-pressed=\"true\" via vibcoder pressed", () => {
    render(<IconButton icon={<Glyph />} ariaLabel="x" active />);
    expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe("true");
  });

  it("active=false (default) emits aria-pressed=\"false\" (legacy contract)", () => {
    render(<IconButton icon={<Glyph />} ariaLabel="x" />);
    expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe("false");
  });

  it("active=true adds 'is-on' marker class (vibcoder CSS duplicate of aria-pressed=true)", () => {
    const { container } = render(<IconButton icon={<Glyph />} ariaLabel="x" active />);
    const btn = container.querySelector("button") as HTMLElement;
    expect(btn.className).toContain("is-on");
  });

  it("rounded=true adds 'is-rounded' marker class + inline borderRadius", () => {
    const { container } = render(<IconButton icon={<Glyph />} ariaLabel="x" rounded />);
    const btn = container.querySelector("button") as HTMLElement;
    expect(btn.className).toContain("is-rounded");
    expect(btn.style.borderRadius).toBeTruthy();
  });

  it("rounded=false (default) does NOT add 'is-rounded' marker", () => {
    const { container } = render(<IconButton icon={<Glyph />} ariaLabel="x" />);
    const btn = container.querySelector("button") as HTMLElement;
    expect(btn.className).not.toContain("is-rounded");
  });

  it("fires onClick", () => {
    const onClick = vi.fn();
    render(<IconButton icon={<Glyph />} ariaLabel="x" onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("forwards ref to the underlying <button>", () => {
    let captured: HTMLButtonElement | null = null;
    render(
      <IconButton
        icon={<Glyph />}
        ariaLabel="x"
        ref={(el) => {
          captured = el;
        }}
      />,
    );
    expect(captured).not.toBeNull();
    expect(captured!.tagName).toBe("BUTTON");
  });
});

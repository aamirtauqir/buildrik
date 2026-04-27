/**
 * Phase 4 contract tests — verify IconButton adapter shim still honors the
 * legacy prop surface (icon + tooltip + ariaLabel + variant + active).
 *
 * IconButton is a "keep legacy implementation" shim during Phase 4.
 * Vibcoder IconButton has a different variant union (`ghost|primary|accent|danger`
 * vs legacy's `ghost|subtle|solid`) and uses `children` instead of an
 * `icon` prop. Translation deferred to Phase 5.
 *
 * The deeper IconButton test (variant/active/rounded distinctness) lives
 * in IconButton.test.tsx. These five tests verify the canonical-import
 * route still resolves and basic semantics hold.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { IconButton } from "../IconButton";

const Glyph = () => <svg data-testid="glyph" />;

describe("IconButton adapter shim (legacy implementation, Phase 4)", () => {
  it("renders icon as a child of a <button>", () => {
    const { container } = render(<IconButton icon={<Glyph />} ariaLabel="x" />);
    expect(container.querySelector("button")).not.toBeNull();
    expect(screen.getByTestId("glyph")).toBeDefined();
  });

  it("applies aria-label from ariaLabel prop", () => {
    render(<IconButton icon={<Glyph />} ariaLabel="Delete row" />);
    expect(screen.getByRole("button").getAttribute("aria-label")).toBe("Delete row");
  });

  it("falls back to tooltip for aria-label", () => {
    render(<IconButton icon={<Glyph />} tooltip="Trash" />);
    expect(screen.getAllByLabelText("Trash").length).toBeGreaterThan(0);
  });

  it("fires onClick", () => {
    const onClick = vi.fn();
    render(<IconButton icon={<Glyph />} ariaLabel="x" onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("applies aria-pressed=true when active", () => {
    render(<IconButton icon={<Glyph />} ariaLabel="x" active />);
    expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe("true");
  });
});

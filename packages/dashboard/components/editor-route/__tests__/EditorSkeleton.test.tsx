/**
 * Unification spec §550 — EditorSkeleton structural assertions.
 * Mirrors the SSR skeleton shape so the dynamic-import swap is invisible.
 * Asserts: topbar height, rail width, panel width, accessible label.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EditorSkeleton } from "../EditorSkeleton";

describe("EditorSkeleton", () => {
  it("has accessible aria-label", () => {
    render(<EditorSkeleton />);
    expect(screen.getByLabelText("Loading editor")).toBeInTheDocument();
  });

  it("renders full-viewport vertical flex column", () => {
    const { container } = render(<EditorSkeleton />);
    const root = container.firstChild as HTMLElement;
    expect(root.style.height).toBe("100vh");
    expect(root.style.display).toBe("flex");
    expect(root.style.flexDirection).toBe("column");
  });

  it("includes 48px topbar bar + main horizontal flex row", () => {
    const { container } = render(<EditorSkeleton />);
    const root = container.firstChild as HTMLElement;
    const children = Array.from(root.children) as HTMLElement[];
    // topbar + horizontal row at minimum
    expect(children.length).toBeGreaterThanOrEqual(2);
    const topbar = children[0];
    expect(topbar.style.height).toBe("48px");
    const row = children[1];
    expect(row.style.flexGrow).toBe("1");
    expect(row.style.display).toBe("flex");
  });

  it("row contains 40px rail + 320px panel placeholders", () => {
    const { container } = render(<EditorSkeleton />);
    const row = (container.firstChild as HTMLElement).children[1] as HTMLElement;
    const cells = Array.from(row.children) as HTMLElement[];
    // rail (40), panel (320), canvas (flex:1), inspector (...) — at minimum 3
    expect(cells.length).toBeGreaterThanOrEqual(3);
    expect(cells[0].style.width).toBe("40px");
    expect(cells[1].style.width).toBe("320px");
  });
});

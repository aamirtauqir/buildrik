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
    expect(topbar.style.height).toBe("56px"); // --bk-size-topbar
    const row = children[1];
    expect(row.style.flexGrow).toBe("1");
    expect(row.style.display).toBe("flex");
  });

  /* The skeleton is a promise about the shape that is coming, so every column
     has to be the width the editor actually mounts at. It was wrong in FOUR
     places at once — rail 40 (ships 60), topbar 48 (ships 56), drawer 320
     (ships 280), inspector 280 (ships 300) — so the user watched all four snap
     on every load. This test pinned two of those wrong numbers, which is why
     they survived.

     The numbers below are the generated chrome tokens (--bk-size-rail,
     --bk-size-drawer, --bk-size-inspector). If a token moves, this fails, and
     it should: a skeleton that disagrees with the shell is a small lie the user
     watches get corrected. */
  it("draws each column at the width the editor actually mounts at", () => {
    const { container } = render(<EditorSkeleton />);
    const row = (container.firstChild as HTMLElement).children[1] as HTMLElement;
    const cells = Array.from(row.children) as HTMLElement[];
    // rail, drawer, canvas (flex:1), inspector
    expect(cells.length).toBeGreaterThanOrEqual(3);
    expect(cells[0].style.width).toBe("60px");   // --bk-size-rail
    expect(cells[1].style.width).toBe("280px");  // --bk-size-drawer
    expect(cells[cells.length - 1].style.width).toBe("300px"); // --bk-size-inspector
  });
});

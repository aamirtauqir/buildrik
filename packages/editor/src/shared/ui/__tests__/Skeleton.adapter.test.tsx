/**
 * Phase 4 contract tests — verify Skeleton adapter shim correctly bridges
 * the primary `Skeleton` legacy props onto the vibcoder Skeleton primitive,
 * AND that compound exports (kept-legacy carve-out) still resolve.
 *
 * Strategy:
 *   primary Skeleton: bridge.
 *     width/height (number|string) → inline style with px conversion.
 *     radius (none|sm|md|lg|full)  → inline style borderRadius.
 *     animation 'pulse' (default)  → vibcoder default (vendored CSS).
 *     animation 'none'             → inline style { animation: 'none' }.
 *     animation 'wave'             → throws at render (no vibcoder mapping).
 *     a11y: legacy role="status" + aria-label="Loading..." preserved by
 *           overriding vibcoder's default aria-hidden="true".
 *
 *   compound (StudioSkeleton, SkeletonText, SkeletonAvatar, SkeletonCard,
 *   SkeletonListItem, SkeletonTable, LoadingOverlay): kept legacy. They
 *   internally render the bridged primary `Skeleton`, so they inherit
 *   the vibcoder bd-skeleton class through that path.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
} from "../Skeleton";

describe("Skeleton adapter shim (primary = bridge to vibcoder)", () => {
  it("renders the vibcoder bd-skeleton class", () => {
    const { container } = render(<Skeleton width={100} height={20} />);
    const node = container.querySelector(".bd-skeleton");
    expect(node).not.toBeNull();
  });

  it("default shape is rect (vibcoder bd-skeleton--rect)", () => {
    const { container } = render(<Skeleton />);
    const node = container.querySelector(".bd-skeleton");
    expect(node?.className).toContain("bd-skeleton--rect");
  });

  it("numeric width + height map to inline style with px units", () => {
    const { container } = render(<Skeleton width={120} height={32} />);
    const node = container.querySelector(".bd-skeleton") as HTMLElement;
    expect(node.style.width).toBe("120px");
    expect(node.style.height).toBe("32px");
  });

  it("string width passes through unchanged", () => {
    const { container } = render(<Skeleton width="60%" />);
    const node = container.querySelector(".bd-skeleton") as HTMLElement;
    expect(node.style.width).toBe("60%");
  });

  it("radius 'full' maps to inline borderRadius 9999px", () => {
    const { container } = render(<Skeleton radius="full" />);
    const node = container.querySelector(".bd-skeleton") as HTMLElement;
    expect(node.style.borderRadius).toBe("9999px");
  });

  it("radius 'none' maps to inline borderRadius 0", () => {
    const { container } = render(<Skeleton radius="none" />);
    const node = container.querySelector(".bd-skeleton") as HTMLElement;
    // jsdom serializes 0 borderRadius as empty or "0px" depending on version;
    // either is acceptable as long as it's not a token.
    expect(["", "0px", "0"].includes(node.style.borderRadius)).toBe(true);
  });

  it("animation 'pulse' (default) emits NO inline animation override", () => {
    const { container } = render(<Skeleton animation="pulse" />);
    const node = container.querySelector(".bd-skeleton") as HTMLElement;
    // pulse is the vibcoder default; no inline-style override is applied.
    expect(node.style.animation).toBe("");
  });

  it("animation 'none' emits inline style { animation: 'none' }", () => {
    const { container } = render(<Skeleton animation="none" />);
    const node = container.querySelector(".bd-skeleton") as HTMLElement;
    expect(node.style.animation).toBe("none");
  });

  it("animation 'wave' throws at render (no vibcoder mapping)", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Skeleton animation="wave" />)).toThrow(/wave/);
    spy.mockRestore();
  });

  it("preserves legacy role + aria-label (overrides vibcoder aria-hidden)", () => {
    const { container } = render(<Skeleton width={100} />);
    const node = container.querySelector(".bd-skeleton");
    expect(node?.getAttribute("role")).toBe("status");
    expect(node?.getAttribute("aria-label")).toBe("Loading...");
    expect(node?.getAttribute("aria-hidden")).toBe("false");
  });

  it("forwards className alongside vibcoder classes", () => {
    const { container } = render(<Skeleton className="custom-x" />);
    const node = container.querySelector(".bd-skeleton");
    expect(node?.className).toContain("custom-x");
  });
});

describe("Skeleton compound exports (kept-legacy carve-out)", () => {
  it("SkeletonText renders multiple bridged Skeletons", () => {
    const { container } = render(<SkeletonText lines={3} />);
    const all = container.querySelectorAll(".bd-skeleton");
    expect(all.length).toBe(3);
  });

  it("SkeletonAvatar renders a single bridged Skeleton", () => {
    const { container } = render(<SkeletonAvatar size={48} />);
    expect(container.querySelector(".bd-skeleton")).not.toBeNull();
  });
});

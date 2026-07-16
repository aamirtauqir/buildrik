/**
 * SkeletonCompounds tests — SkeletonListItem slot combinations and the
 * StudioSkeleton boot screen (incl. reduced-motion spin gating).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { SkeletonListItem, StudioSkeleton } from "../SkeletonCompounds";

afterEach(cleanup);

/** SkeletonListItem marks each Skeleton slot aria-hidden. */
const countSkeletons = (container: HTMLElement) =>
  container.querySelectorAll('[aria-hidden="true"]').length;

describe("SkeletonListItem", () => {
  it("default: avatar + two text lines (3 skeleton slots)", () => {
    const { container } = render(<SkeletonListItem />);
    expect(countSkeletons(container)).toBe(3);
  });

  it("hasAvatar=false drops the avatar slot", () => {
    const { container } = render(<SkeletonListItem hasAvatar={false} />);
    expect(countSkeletons(container)).toBe(2);
  });

  it("textLines=1 drops the secondary line", () => {
    const { container } = render(<SkeletonListItem textLines={1} />);
    expect(countSkeletons(container)).toBe(2);
  });

  it("hasAction adds a trailing action slot", () => {
    const { container } = render(<SkeletonListItem hasAction />);
    expect(countSkeletons(container)).toBe(4);
  });

  it("avatarSize controls the avatar dimensions", () => {
    const { container } = render(<SkeletonListItem avatarSize={24} />);
    const avatar = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(avatar.style.width).toBe("24px");
    expect(avatar.style.height).toBe("24px");
  });
});

describe("StudioSkeleton", () => {
  it("renders the engine boot message", () => {
    render(<StudioSkeleton />);
    expect(screen.getByText("INITIALIZING ENGINE")).toBeInTheDocument();
  });

  it("spins the loader when reduced motion is NOT preferred (test-setup matchMedia → false)", () => {
    const { container } = render(<StudioSkeleton />);
    const spinner = Array.from(container.querySelectorAll("div")).find((el) =>
      el.style.animation.includes("bd-skeleton-spin")
    );
    expect(spinner).toBeDefined();
  });

  it("declares the bd-skeleton-spin keyframes inline (self-contained)", () => {
    const { container } = render(<StudioSkeleton />);
    const styleTag = container.querySelector("style");
    expect(styleTag?.textContent).toContain("@keyframes bd-skeleton-spin");
  });
});

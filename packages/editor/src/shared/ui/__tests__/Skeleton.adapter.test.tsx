/**
 * Phase 4 contract tests — verify Skeleton adapter shim still honors the
 * legacy prop surface (width + height + radius + animation) consumers
 * depend on, AND the compound exports (SkeletonText, etc.) still resolve.
 *
 * Skeleton is a "keep legacy implementation" shim during Phase 4.
 * Translation to vibcoder Skeleton lands in Phase 5.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
} from "../Skeleton";

describe("Skeleton adapter shim (legacy implementation, Phase 4)", () => {
  it("renders a div with buildrick-skeleton class", () => {
    const { container } = render(<Skeleton width={100} height={20} />);
    const div = container.querySelector("div.buildrick-skeleton");
    expect(div).not.toBeNull();
  });

  it("respects numeric width + height", () => {
    const { container } = render(<Skeleton width={120} height={32} />);
    const div = container.querySelector("div") as HTMLDivElement;
    expect(div.style.width).toBe("120px");
    expect(div.style.height).toBe("32px");
  });

  it("respects string width", () => {
    const { container } = render(<Skeleton width="60%" />);
    const div = container.querySelector("div") as HTMLDivElement;
    expect(div.style.width).toBe("60%");
  });

  it("compound: SkeletonText renders multiple Skeletons", () => {
    const { container } = render(<SkeletonText lines={3} />);
    const all = container.querySelectorAll(".buildrick-skeleton");
    expect(all.length).toBe(3);
  });

  it("compound: SkeletonAvatar renders a single Skeleton", () => {
    const { container } = render(<SkeletonAvatar size={48} />);
    expect(container.querySelector(".buildrick-skeleton")).not.toBeNull();
  });
});

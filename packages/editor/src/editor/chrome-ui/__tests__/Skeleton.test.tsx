/**
 * Skeleton compounds — contract tests.
 *
 * Moved from `editor/ui/__tests__/molecules.test.tsx` (flowbite big-bang:
 * SkeletonListItem/StudioSkeleton relocated to chrome-ui/Skeleton.tsx).
 * `.bk-skeleton`/`.bk-skeleton--circle` are now vestigial marker classNames
 * (no CSS rule backs them — the pulse comes from `tw:animate-pulse`), kept
 * so these selectors still resolve; the boot spinner is asserted via
 * flowbite's own `[data-testid="flowbite-spinner"]`... no such testid
 * exists on `Spinner`, so it's queried by `role="status"` instead.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SkeletonListItem, StudioSkeleton } from "../index";

describe("SkeletonCompounds", () => {
  it("SkeletonListItem hides its blocks from assistive tech and honours the flags", () => {
    const { container } = render(<SkeletonListItem hasAvatar avatarSize={24} textLines={1} hasAction />);
    const blocks = container.querySelectorAll(".bk-skeleton");
    expect(blocks.length).toBe(3); // avatar + one line + action
    blocks.forEach((b) => expect(b.getAttribute("aria-hidden")).toBe("true"));
    expect(container.querySelector(".bk-skeleton--circle")).toBeTruthy();
  });

  it("StudioSkeleton renders the boot screen with its loading label and a spinning status icon", () => {
    render(<StudioSkeleton />);
    expect(screen.getByText("INITIALIZING ENGINE")).toBeTruthy();
    const spinner = screen.getByRole("status");
    expect(spinner.querySelector("svg")?.getAttribute("class")).toMatch(/tw:animate-spin/);
  });
});

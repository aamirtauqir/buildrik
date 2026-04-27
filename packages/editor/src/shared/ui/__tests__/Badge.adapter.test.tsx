/**
 * Phase 4 contract tests — verify Badge adapter shim still honors the
 * legacy variant union (`default|primary|success|warning|error|info`).
 *
 * Badge is a "keep legacy implementation" shim during Phase 4. Vibcoder
 * Badge has a different chrome-specific variant union
 * (`published|draft|issues|...`); existing consumers in `src/ai/` and
 * `src/templates/` use the legacy semantic palette. Translation deferred
 * to Phase 5.
 *
 * Deeper Badge tests live in Badge.test.tsx — these three verify the
 * canonical-import route still resolves and basic semantics hold.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Badge } from "../Badge";

describe("Badge adapter shim (legacy implementation, Phase 4)", () => {
  it("renders a <span> with children", () => {
    const { container } = render(<Badge variant="default">Hello</Badge>);
    const span = container.querySelector("span");
    expect(span).not.toBeNull();
    expect(span?.textContent).toBe("Hello");
  });

  it("supports the legacy variant union without crashing", () => {
    const variants = ["default", "primary", "success", "warning", "error", "info"] as const;
    variants.forEach((v) => {
      const { container, unmount } = render(<Badge variant={v}>x</Badge>);
      expect(container.querySelector("span")).not.toBeNull();
      unmount();
    });
  });

  it("renders a standalone dot when dot=true with no children", () => {
    const { container } = render(<Badge variant="success" dot />);
    expect(container.querySelector("span")).not.toBeNull();
  });
});

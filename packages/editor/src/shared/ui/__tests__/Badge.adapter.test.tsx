/**
 * Phase 4 contract tests — verify Badge shim renders correctly under the
 * keep-legacy strategy.
 *
 * Strategy: keep-legacy (NOT a vibcoder bridge). The legacy semantic palette
 * (`default | primary | success | warning | error | info`) is disjoint from
 * the vibcoder chrome-state palette (`published | draft | issues | unsaved
 * | syncing | new | premium | count`). Throws-at-render would brick
 * consumers in `src/ai/` + `src/templates/`. See Badge.tsx top-of-file
 * JSDoc for full reasoning + Phase 5 handoff requirements.
 *
 * Deeper Badge tests live in Badge.test.tsx — these verify the canonical-
 * import route still resolves and basic semantics hold.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Badge } from "../Badge";

describe("Badge shim (keep-legacy strategy)", () => {
  it("renders a <span> with children", () => {
    const { container } = render(<Badge variant="default">Hello</Badge>);
    const span = container.querySelector("span");
    expect(span).not.toBeNull();
    expect(span?.textContent).toBe("Hello");
  });

  it("supports the legacy semantic variant union without crashing", () => {
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

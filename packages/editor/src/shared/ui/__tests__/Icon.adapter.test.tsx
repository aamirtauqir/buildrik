/**
 * Phase 4 contract tests — verify Icon shim renders correctly under the
 * keep-legacy strategy.
 *
 * Strategy: keep-legacy (NOT a vibcoder bridge). The legacy Lucide-name
 * union (~1000 names) has no 1:1 mapping to vibcoder's 41-glyph sprite,
 * and throws-at-render would brick every consumer. See Icon.tsx top-of-file
 * JSDoc for full reasoning + Phase 5 handoff requirements.
 *
 * These tests verify the canonical-import route resolves and that the
 * legacy lucide-name path still renders.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Icon } from "../Icon";

describe("Icon shim (keep-legacy strategy)", () => {
  it("renders an svg with buildrick-icon class", () => {
    const { container } = render(<Icon name="Search" />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("class") ?? "").toContain("buildrick-icon");
  });

  it("respects size preset", () => {
    const { container } = render(<Icon name="Search" size="lg" />);
    expect(container.querySelector("svg")?.getAttribute("width")).toBe("20");
  });

  it("respects numeric size", () => {
    const { container } = render(<Icon name="Search" size={28} />);
    expect(container.querySelector("svg")?.getAttribute("width")).toBe("28");
  });

  it("returns null for unknown lucide name (devWarn path)", () => {
    // @ts-expect-error — intentional unknown name for the dev-warn branch.
    const { container } = render(<Icon name="DefinitelyNotAnIconName" />);
    expect(container.querySelector("svg")).toBeNull();
  });
});

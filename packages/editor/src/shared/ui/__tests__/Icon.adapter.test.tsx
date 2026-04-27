/**
 * Phase 4 contract tests — verify Icon adapter shim still honors the
 * legacy Lucide-name prop surface.
 *
 * Icon is a "keep legacy implementation" shim during Phase 4. Vibcoder
 * Icon takes a sprite-id union; legacy Icon takes a Lucide-library name.
 * Translation deferred to Phase 5.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Icon } from "../Icon";

describe("Icon adapter shim (legacy implementation, Phase 4)", () => {
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

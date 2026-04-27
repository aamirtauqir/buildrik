/**
 * Phase 4 contract tests — verify Spinner adapter shim still honors the
 * legacy prop surface (size + color + thickness) consumers depend on.
 *
 * Spinner is a "keep legacy implementation" shim during Phase 4: vibcoder
 * Spinner has a smaller prop surface (size: "sm" | "lg" only, no color or
 * thickness) and existing consumers — notably `Button.tsx` — pass
 * `color="currentColor"` for inline-button-color spinning. Translation
 * deferred to Phase 5.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Spinner } from "../Spinner";

describe("Spinner adapter shim (legacy implementation, Phase 4)", () => {
  it("renders an svg with buildrick-spinner class", () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector("svg.buildrick-spinner");
    expect(svg).not.toBeNull();
  });

  it("respects numeric size", () => {
    const { container } = render(<Spinner size={32} />);
    const svg = container.querySelector("svg") as SVGSVGElement;
    expect(svg.getAttribute("width")).toBe("32");
    expect(svg.getAttribute("height")).toBe("32");
  });

  it("respects preset size 'sm'", () => {
    const { container } = render(<Spinner size="sm" />);
    expect(container.querySelector("svg")?.getAttribute("width")).toBe("16");
  });

  it("respects preset size 'lg'", () => {
    const { container } = render(<Spinner size="lg" />);
    expect(container.querySelector("svg")?.getAttribute("width")).toBe("40");
  });

  it("passes color through to the inner stroke", () => {
    const { container } = render(<Spinner color="currentColor" />);
    const circle = container.querySelector("circle");
    expect(circle?.getAttribute("stroke")).toBe("currentColor");
  });
});

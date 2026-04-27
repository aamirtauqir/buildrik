/**
 * Phase 4 contract tests — verify Spinner adapter shim correctly bridges
 * legacy props onto the vibcoder Spinner primitive.
 *
 * Strategy: bridge. Legacy `size` ("sm"|"md"|"lg"|number) translates onto
 * vibcoder's narrower size union ("sm"|"lg"|undefined) plus inline-style
 * pixel override for numeric inputs. Legacy `color` cascades through
 * `style={{ color }}` (vibcoder CSS uses `currentColor`). Legacy
 * `thickness` has no vibcoder equivalent — throws at render.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { Spinner } from "../Spinner";

describe("Spinner adapter shim (bridge to vibcoder)", () => {
  it("renders the vibcoder bd-spinner class", () => {
    const { container } = render(<Spinner />);
    const node = container.querySelector(".bd-spinner");
    expect(node).not.toBeNull();
  });

  it("size 'sm' maps to vibcoder bd-spinner--sm modifier", () => {
    const { container } = render(<Spinner size="sm" />);
    const node = container.querySelector(".bd-spinner");
    expect(node?.className).toContain("bd-spinner--sm");
  });

  it("size 'md' (default) emits no size modifier (base vibcoder Spinner)", () => {
    const { container } = render(<Spinner size="md" />);
    const node = container.querySelector(".bd-spinner");
    expect(node?.className).not.toContain("bd-spinner--sm");
    expect(node?.className).not.toContain("bd-spinner--lg");
  });

  it("size 'lg' maps to vibcoder bd-spinner--lg modifier", () => {
    const { container } = render(<Spinner size="lg" />);
    const node = container.querySelector(".bd-spinner");
    expect(node?.className).toContain("bd-spinner--lg");
  });

  it("numeric size emits inline-style width + height in pixels", () => {
    const { container } = render(<Spinner size={32} />);
    const node = container.querySelector(".bd-spinner") as HTMLElement;
    expect(node.style.width).toBe("32px");
    expect(node.style.height).toBe("32px");
    // Numeric size means "no size modifier" — pixel override is the truth.
    expect(node.className).not.toContain("bd-spinner--sm");
    expect(node.className).not.toContain("bd-spinner--lg");
  });

  it("color prop cascades via style={{ color }}", () => {
    const { container } = render(<Spinner color="currentColor" />);
    const node = container.querySelector(".bd-spinner") as HTMLElement;
    // jsdom normalizes color values to lowercase — compare case-insensitively.
    expect(node.style.color.toLowerCase()).toBe("currentcolor");
  });

  it("thickness prop throws at render (no vibcoder mapping)", () => {
    // Suppress React's expected error logging for clean test output.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Spinner thickness={4} />)).toThrow(/thickness/);
    spy.mockRestore();
  });
});

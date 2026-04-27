/**
 * Phase 4 contract tests — verify Kbd adapter shim still honors the legacy
 * prop surface (children + size).
 *
 * Kbd is a "keep legacy implementation" shim during Phase 4. Vibcoder Kbd
 * has a different size union (`xs` only, with `bare`/`inverted` variants);
 * legacy uses `sm`/`md`. Translation deferred to Phase 5.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Kbd } from "../Kbd";

describe("Kbd adapter shim (legacy implementation, Phase 4)", () => {
  it("renders a <kbd> element with the children glyph", () => {
    const { container } = render(<Kbd>⌘K</Kbd>);
    const node = container.querySelector("kbd");
    expect(node).not.toBeNull();
    expect(node?.textContent).toBe("⌘K");
  });

  it("supports the legacy size prop without crashing", () => {
    const sm = render(<Kbd size="sm">A</Kbd>).container.querySelector("kbd");
    const md = render(<Kbd size="md">A</Kbd>).container.querySelector("kbd");
    expect(sm).not.toBeNull();
    expect(md).not.toBeNull();
  });

  it("forwards className", () => {
    const { container } = render(<Kbd className="custom-x">A</Kbd>);
    expect(container.querySelector("kbd")?.className).toContain("custom-x");
  });
});

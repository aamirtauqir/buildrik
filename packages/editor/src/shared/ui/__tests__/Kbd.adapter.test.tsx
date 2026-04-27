/**
 * Phase 4 contract tests — verify Kbd adapter shim correctly bridges
 * legacy props onto the vibcoder Kbd primitive.
 *
 * Strategy: bridge. Legacy `size` ("sm"|"md") translates onto vibcoder's
 * size union ("xs"|undefined): sm→xs (cmd-palette/rail), md→base (no
 * modifier). HTMLAttributes spread to the underlying `<kbd>` element.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Kbd } from "../Kbd";

describe("Kbd adapter shim (bridge to vibcoder)", () => {
  it("renders the vibcoder bd-kbd class on a <kbd> element", () => {
    const { container } = render(<Kbd>⌘K</Kbd>);
    const node = container.querySelector("kbd");
    expect(node).not.toBeNull();
    expect(node?.className).toContain("bd-kbd");
    expect(node?.textContent).toBe("⌘K");
  });

  it("size 'sm' maps to vibcoder bd-kbd--xs modifier", () => {
    const { container } = render(<Kbd size="sm">A</Kbd>);
    const node = container.querySelector("kbd");
    expect(node?.className).toContain("bd-kbd--xs");
  });

  it("size 'md' (default) emits no size modifier (base vibcoder Kbd)", () => {
    const { container } = render(<Kbd size="md">A</Kbd>);
    const node = container.querySelector("kbd");
    expect(node?.className).not.toContain("bd-kbd--xs");
  });

  it("forwards className through to the vibcoder element", () => {
    const { container } = render(<Kbd className="custom-x">A</Kbd>);
    const node = container.querySelector("kbd");
    expect(node?.className).toContain("custom-x");
    expect(node?.className).toContain("bd-kbd");
  });

  it("spreads ...rest (style, aria-*, data-*) onto the <kbd> element", () => {
    const { container } = render(
      <Kbd style={{ marginLeft: 4 }} aria-label="Command K" data-shortcut="cmd-k">
        ⌘K
      </Kbd>,
    );
    const node = container.querySelector("kbd") as HTMLElement;
    expect(node.style.marginLeft).toBe("4px");
    expect(node.getAttribute("aria-label")).toBe("Command K");
    expect(node.getAttribute("data-shortcut")).toBe("cmd-k");
  });
});

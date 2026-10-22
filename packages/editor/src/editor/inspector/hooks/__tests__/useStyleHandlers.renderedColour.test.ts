/**
 * REA #18: an unset colour row shows the colour the element renders.
 *
 * Live: an H2 with no colour of its own computed rgb(51,65,85) on the canvas
 * (the site's Text token) while the Colour field read 1a1a1a — the type
 * default, a colour nothing rendered. Colours were skipped when the panel
 * learned to read unset rows off the canvas, because the computed value is
 * rgb() and the colour controls speak hex.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import type { Composer } from "@/engine";
import { useStyleHandlers } from "../useStyleHandlers";

const SELECTED = { id: "h1", type: "heading", tagName: "h2" } as never;

function mountCanvasNode(color: string) {
  const node = document.createElement("h2");
  node.setAttribute("data-buildrick-id", "h1");
  node.style.color = color;
  document.body.appendChild(node);
}

/* Built once per test: a new composer per render re-runs the load effect forever. */
function composerWith(styles: Record<string, string>) {
  const el = { getId: () => "h1", getStyles: () => styles, setStyle: () => {}, removeStyle: () => {} };
  return {
    device: "desktop",
    beginTransaction: () => {},
    endTransaction: () => {},
    elements: { getElement: () => el },
    styles: { getBreakpointStyle: () => ({}), getRule: () => undefined },
  } as unknown as Composer;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("useStyleHandlers — an unset colour shows what renders (REA #18)", () => {
  /* Not the seed Text colour: that is also the type default now, and would
     pass without reading the canvas at all. */
  it("reads the canvas colour as hex", () => {
    mountCanvasNode("rgb(17, 24, 39)");
    const composer = composerWith({});
    const { result } = renderHook(() => useStyleHandlers(SELECTED, composer, "desktop", "normal"));
    expect(result.current.styles.color?.toLowerCase()).toBe("#111827");
  });

  it("keeps an authored colour", () => {
    mountCanvasNode("rgb(51, 65, 85)");
    const composer = composerWith({ color: "#c81e1e" });
    const { result } = renderHook(() => useStyleHandlers(SELECTED, composer, "desktop", "normal"));
    expect(result.current.styles.color).toBe("#c81e1e");
  });
});

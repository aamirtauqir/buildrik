/**
 * L2-018: on Tablet / Mobile and in a pseudo-state, a row the element does not
 * set shows what the canvas renders — the value cascading from the base — not
 * the element TYPE's default. Live: a heading read "24 px" line-height on
 * Desktop and "1.2 ×" on Tablet with no override on either.
 *
 * The canvas re-emits the active device's breakpoint rules (StyleEngine
 * `editorDevicePreviewCSS`), so its computed style describes the breakpoint
 * being edited whenever the canvas device and the Inspector breakpoint agree.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import type { Composer } from "@/engine";
import { useStyleHandlers } from "../useStyleHandlers";

/* Hoisted: a fresh selection object per render re-runs the load effect forever. */
const SELECTED = { id: "h1", type: "heading" } as never;

function mountCanvasNode() {
  const node = document.createElement("h2");
  node.setAttribute("data-buildrick-id", "h1");
  node.style.lineHeight = "24px";
  document.body.appendChild(node);
  return node;
}

function composerOn(device: string) {
  const el = { getId: () => "h1", getStyles: () => ({}), setStyle: () => {}, removeStyle: () => {} };
  return {
    device,
    beginTransaction: () => {},
    endTransaction: () => {},
    elements: { getElement: () => el },
    styles: { getBreakpointStyle: () => ({}), getRule: () => undefined },
  } as unknown as Composer;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("useStyleHandlers — unset rows off desktop show the rendered value (L2-018)", () => {
  it("Desktop reads the canvas (the existing behaviour)", () => {
    mountCanvasNode();
    const composer = composerOn("desktop");
    const { result } = renderHook(() => useStyleHandlers(SELECTED, composer, "desktop", "normal"));
    expect(result.current.styles["line-height"]).toBe("24px");
  });

  it("Tablet, with the canvas on Tablet, reads the canvas instead of the type default", () => {
    mountCanvasNode();
    const composer = composerOn("tablet");
    const { result } = renderHook(() => useStyleHandlers(SELECTED, composer, "tablet", "normal"));
    expect(result.current.styles["line-height"]).toBe("24px");
  });

  it("a pseudo-state shows the normal state's rendered value for rows the state rule does not set", () => {
    mountCanvasNode();
    const composer = composerOn("mobile");
    const { result } = renderHook(() => useStyleHandlers(SELECTED, composer, "mobile", "hover"));
    expect(result.current.styles["line-height"]).toBe("24px");
  });

  it("does not read a canvas that shows another breakpoint", () => {
    mountCanvasNode();
    const composer = composerOn("desktop");
    const { result } = renderHook(() => useStyleHandlers(SELECTED, composer, "tablet", "normal"));
    expect(result.current.styles["line-height"]).toBe("1.2");
  });
});

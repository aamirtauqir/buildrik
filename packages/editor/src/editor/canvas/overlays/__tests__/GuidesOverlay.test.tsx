/**
 * GuidesOverlay draws inside the zoomed canvas, so a guide sits at its
 * position in canvas units — not position × zoom (which, scaled again by the
 * canvas, put a 200 guide at the ruler's ~120 at 61%). Walked live, 2026-10-30.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import * as React from "react";
import { GuidesOverlay } from "../GuidesOverlay";

describe("GuidesOverlay — canvas units", () => {
  it("places a vertical guide at its position and keeps the line 1px on screen", () => {
    const { container } = render(
      <GuidesOverlay
        guides={[{ id: "v", type: "vertical", position: 200, locked: false }]}
        zoom={50}
        onDragGuide={() => {}}
        onRemoveGuide={() => {}}
      />,
    );
    const hit = container.querySelector<HTMLElement>("[style*='ew-resize']")!;
    const line = hit.firstElementChild as HTMLElement;
    /* hit area 8px on screen = 16 canvas units at 50%; centred on 200. */
    expect(hit.style.left).toBe("192px");
    expect(hit.style.width).toBe("16px");
    expect(line.style.width).toBe("2px");
  });

  it("places a horizontal guide by top", () => {
    const { container } = render(
      <GuidesOverlay
        guides={[{ id: "h", type: "horizontal", position: 120, locked: false }]}
        zoom={100}
        onDragGuide={() => {}}
        onRemoveGuide={() => {}}
      />,
    );
    const hit = container.querySelector<HTMLElement>("[style*='ns-resize']")!;
    expect(hit.style.top).toBe("116px");
  });
});

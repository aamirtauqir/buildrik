/**
 * G2-050 — a right-click on a selected element's padding strip opens that
 * element's menu: the strip forwards the event to the element and stops its
 * own, which the canvas would otherwise read as "no element" and close on.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import type { SpacingIndicator } from "../../../../shared/types/canvas";
import { CanvasSpotSpacing } from "../CanvasSpotSpacing";

describe("CanvasSpotSpacing — right-click", () => {
  it("forwards the contextmenu to the element and stops its own", () => {
    const el = document.createElement("section");
    el.setAttribute("data-buildrick-id", "hero");
    document.body.appendChild(el);
    const onElement = vi.fn();
    el.addEventListener("contextmenu", onElement);
    const outer = vi.fn();
    const indicator = { type: "padding", side: "top", value: 80, position: { x: 0, y: 0, width: 100, height: 80 } } as unknown as SpacingIndicator;
    const { container } = render(
      <div onContextMenu={outer}>
        <CanvasSpotSpacing composer={null} elementId="hero" indicators={[indicator]} />
      </div>
    );
    fireEvent.contextMenu(container.querySelector(".bd-spacing-indicator")!, { clientX: 40, clientY: 20 });
    expect(onElement).toHaveBeenCalledTimes(1);
    expect(onElement.mock.calls[0][0]).toMatchObject({ clientX: 40, clientY: 20 });
    expect(outer).not.toHaveBeenCalled();
  });
});

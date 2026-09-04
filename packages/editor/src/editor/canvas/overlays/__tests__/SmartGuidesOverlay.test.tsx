/**
 * SmartGuidesOverlay — board 815:4608's colour split. Alignment guides
 * (scenarios 1-2, no `kind`) stay magenta; spacing indicators (scenarios 3-4,
 * `kind` set) render red with their value label. Geometry itself is
 * useCanvasSnapping's contract (useCanvasSnapping.test.ts) — this only
 * checks what the overlay does with the lines it is handed.
 *
 * @license BSD-3-Clause
 */

import { render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect } from "vitest";
import { SmartGuidesOverlay } from "../SmartGuidesOverlay";
import type { SnapLine } from "../../hooks/useCanvasSnapping";

describe("SmartGuidesOverlay — alignment guides vs spacing indicators", () => {
  it("renders nothing when there are no lines", () => {
    const { container } = render(<SmartGuidesOverlay snapLines={[]} zoom={100} />);
    expect(container.firstChild).toBeNull();
  });

  it("paints a plain alignment guide magenta, with no value label", () => {
    const lines: SnapLine[] = [
      { orientation: "vertical", position: 50, start: 0, end: 100 },
    ];
    const { container } = render(<SmartGuidesOverlay snapLines={lines} zoom={100} />);
    // container > wrapper div > line div — the wrapper carries no
    // backgroundColor, so the line is the second div in document order.
    const line = container.querySelectorAll("div")[1] as HTMLElement;
    expect(line.style.backgroundColor).toBe("rgb(255, 0, 255)");
    expect(screen.queryByText(/^\d+$/)).toBeNull();
  });

  it("paints an equal-gap spacing indicator red, with its value label", () => {
    const lines: SnapLine[] = [
      {
        orientation: "horizontal",
        position: 40,
        start: 10,
        end: 70,
        kind: "equal-gap",
        value: 60,
      },
    ];
    const { container } = render(<SmartGuidesOverlay snapLines={lines} zoom={100} />);
    // container > wrapper div > line div — the wrapper carries no
    // backgroundColor, so the line is the second div in document order.
    const line = container.querySelectorAll("div")[1] as HTMLElement;
    expect(line.style.backgroundColor).toBe("rgb(255, 68, 68)");
    expect(screen.getByText("60")).toBeTruthy();
  });

  it("paints a parent-padding spacing indicator red, with its value label", () => {
    const lines: SnapLine[] = [
      {
        orientation: "horizontal",
        position: 275,
        start: 50,
        end: 200,
        kind: "parent-padding",
        value: 150,
      },
    ];
    render(<SmartGuidesOverlay snapLines={lines} zoom={100} />);
    const label = screen.getByText("150");
    expect(label.style.color).toBe("rgb(255, 68, 68)");
  });
});

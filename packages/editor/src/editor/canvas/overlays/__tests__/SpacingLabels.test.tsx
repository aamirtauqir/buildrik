/**
 * SpacingLabels — the label position math (left/top per margin/padding edge)
 * and the >0 render guard. Colors/visual styling are not asserted.
 *
 * @license BSD-3-Clause
 */

import { render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect } from "vitest";
import { SpacingLabels } from "../SpacingLabels";
import type { BoxSpacing } from "../../utils/elementInfo";

const rect = { left: 100, top: 200, width: 50, height: 40 } as DOMRect;
const box = (v: Partial<BoxSpacing>): BoxSpacing =>
  ({ top: 0, right: 0, bottom: 0, left: 0, ...v }) as BoxSpacing;

describe("SpacingLabels — positioning math", () => {
  it("places the margin-top label centered above the element", () => {
    render(<SpacingLabels rect={rect} margin={box({ top: 20 })} padding={box({})} />);
    const label = screen.getByText("20");
    // left = rect.left + rect.width/2 = 100 + 25
    expect(label.style.left).toBe("125px");
    // top = rect.top - margin.top/2 - 6 = 200 - 10 - 6
    expect(label.style.top).toBe("184px");
  });

  it("places the margin-bottom label below the element", () => {
    render(<SpacingLabels rect={rect} margin={box({ bottom: 10 })} padding={box({})} />);
    const label = screen.getByText("10");
    expect(label.style.left).toBe("125px");
    // top = rect.top + rect.height + margin.bottom/2 - 6 = 200 + 40 + 5 - 6
    expect(label.style.top).toBe("239px");
  });

  it("places the padding-top label just inside the top edge", () => {
    render(<SpacingLabels rect={rect} margin={box({})} padding={box({ top: 8 })} />);
    const label = screen.getByText("8");
    // top = rect.top + padding.top/2 - 6 = 200 + 4 - 6
    expect(label.style.top).toBe("198px");
  });
});

describe("SpacingLabels — render guard", () => {
  it("renders no labels when every spacing value is zero", () => {
    const { container } = render(
      <SpacingLabels rect={rect} margin={box({})} padding={box({})} />
    );
    expect(container.textContent).toBe("");
  });

  it("omits an edge whose value is zero while showing a non-zero sibling", () => {
    render(<SpacingLabels rect={rect} margin={box({ top: 12, bottom: 0 })} padding={box({})} />);
    expect(screen.getByText("12")).toBeInTheDocument();
    // bottom is 0 → not rendered; no stray "0" label
    expect(screen.queryByText("0")).toBeNull();
  });
});

/**
 * RulersOverlay — a ruler click places a guide under the pointer (G2-033).
 * Live: the rulers inherited the overlay group's pointer-events:none, so no
 * click ever reached them; and the axes were crossed.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { RulersOverlay } from "../RulersOverlay";

HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as HTMLCanvasElement["getContext"];

const rulers = (onCreateGuide = vi.fn()) => {
  const { container } = render(
    <div style={{ pointerEvents: "none" }}>
      <RulersOverlay zoom={100} canvasSize={{ width: 800, height: 600 }} onCreateGuide={onCreateGuide} />
    </div>
  );
  const [top, left] = Array.from(container.querySelectorAll("canvas"));
  for (const c of [top, left]) {
    c.getBoundingClientRect = () => ({ left: 20, top: 20, right: 0, bottom: 0, width: 0, height: 0, x: 20, y: 20, toJSON: () => ({}) }) as DOMRect;
  }
  return { top, left, onCreateGuide };
};

describe("RulersOverlay", () => {
  it("rulers take pointer events inside a pointer-events:none overlay", () => {
    const { top, left } = rulers();
    expect(top.style.pointerEvents).toBe("auto");
    expect(left.style.pointerEvents).toBe("auto");
  });

  it("the top ruler places a vertical guide at the click, the left ruler a horizontal one", () => {
    const { top, left, onCreateGuide } = rulers();
    fireEvent.click(top, { clientX: 220, clientY: 30 });
    expect(onCreateGuide).toHaveBeenLastCalledWith("vertical", 220);
    fireEvent.click(left, { clientX: 30, clientY: 320 });
    expect(onCreateGuide).toHaveBeenLastCalledWith("horizontal", 320);
  });
});

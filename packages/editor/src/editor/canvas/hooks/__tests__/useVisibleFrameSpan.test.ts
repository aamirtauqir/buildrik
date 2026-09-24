/**
 * measureVisibleFrameSpan — the empty-page CTA centres on what is visible,
 * not on a frame wider than its scroll viewport (QA, integration 5e0d47902:
 * "Start blank" cut off under the inspector at 1440x900).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { measureVisibleFrameSpan } from "../useVisibleFrameSpan";

const el = (left: number, right: number, offsetWidth = right - left) =>
  ({
    getBoundingClientRect: () => ({ left, right, width: right - left }) as DOMRect,
    offsetWidth,
  }) as unknown as HTMLElement;

describe("measureVisibleFrameSpan", () => {
  it("clips a 1024 frame to the 776 viewport it overflows (the measured case)", () => {
    // Measured live: scroll viewport 340..1116, frame 364..1388.
    expect(measureVisibleFrameSpan(el(340, 1116), el(364, 1388))).toEqual({ left: 0, width: 752 });
  });

  it("follows horizontal scroll: a frame scrolled 200 left shows from frame x=176", () => {
    expect(measureVisibleFrameSpan(el(340, 1116), el(164, 1188))).toEqual({ left: 176, width: 776 });
  });

  it("a frame narrower than the viewport is visible whole", () => {
    expect(measureVisibleFrameSpan(el(340, 1116), el(540, 915))).toEqual({ left: 0, width: 375 });
  });

  it("undoes the zoom: at 50% a 1024 frame is 512 on screen and fully visible", () => {
    expect(measureVisibleFrameSpan(el(340, 1116), el(400, 912, 1024))).toEqual({ left: 0, width: 1024 });
  });
});

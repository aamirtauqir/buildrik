/**
 * Composer.setZoom — the unit contract.
 *
 * Zoom is a PERCENT everywhere: THRESHOLDS.ZOOM_MIN/MAX are 10 and 500, the
 * canvas ZoomControls step by ±10, and every readout renders
 * `{Math.round(zoom)}%`. Canvas's fit-to-screen was passing a FRACTION
 * (`Math.round(scale * 100) / 100`, so 0.85 for an 85% fit), which clamped
 * straight to ZOOM_MIN — Fit to screen snapped the canvas to 10% instead of
 * fitting it.
 *
 * These lock the unit at the boundary, so the next caller that reaches for
 * `setZoom` cannot quietly reintroduce a fraction, and nobody "fixes" a
 * fraction caller by widening the clamp.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Composer } from "../Composer";
import { THRESHOLDS } from "../../shared/constants";

describe("Composer.setZoom — percent, not fraction", () => {
  /* Composer.initialize touches a 2d canvas context, which jsdom does not
     implement — same polyfill Composer.test.ts installs. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let originalGetContext: any;
  beforeAll(() => {
    originalGetContext = HTMLCanvasElement.prototype.getContext;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement): any {
      return {
        fillStyle: "", strokeStyle: "", lineWidth: 1, canvas: this,
        getImageData: () => ({ data: new Uint8ClampedArray(4) }),
        putImageData: () => {}, drawImage: () => {}, fillRect: () => {},
        clearRect: () => {}, strokeRect: () => {}, beginPath: () => {},
        closePath: () => {}, moveTo: () => {}, lineTo: () => {},
        stroke: () => {}, fill: () => {}, arc: () => {}, rect: () => {},
        save: () => {}, restore: () => {}, translate: () => {}, scale: () => {},
      };
    };
  });
  afterAll(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  it("takes a percent", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const composer = new Composer({} as any);
    composer.setZoom(85);
    expect(composer.getState().zoom).toBe(85);
  });

  it("clamps a fraction to the minimum — which is the fit-to-screen bug", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const composer = new Composer({} as any);
    composer.setZoom(0.85);
    expect(composer.getState().zoom).toBe(THRESHOLDS.ZOOM_MIN);
  });

  it("clamps above the maximum", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const composer = new Composer({} as any);
    composer.setZoom(9000);
    expect(composer.getState().zoom).toBe(THRESHOLDS.ZOOM_MAX);
  });

  it("steps by ZOOM_STEP the way the zoom commands do", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const composer = new Composer({} as any);
    composer.setZoom(100);
    composer.setZoom(composer.getState().zoom + THRESHOLDS.ZOOM_STEP);
    expect(composer.getState().zoom).toBe(100 + THRESHOLDS.ZOOM_STEP);
    composer.setZoom(composer.getState().zoom - THRESHOLDS.ZOOM_STEP);
    expect(composer.getState().zoom).toBe(100);
  });
});

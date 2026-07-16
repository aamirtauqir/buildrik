/**
 * engine/media/ImageProcessorHelpers — CSS filter/adjustment strings,
 * export-dimension math, MIME mapping, and dataURL→Blob.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import type { ImageFilters, ImageAdjustments } from "../../../shared/types/media";
import {
  buildFilterString,
  buildAdjustmentString,
  calculateExportDimensions,
  getMimeType,
  dataURLToBlob,
} from "../ImageProcessorHelpers";

const filters = (over: Partial<ImageFilters> = {}): ImageFilters => ({
  grayscale: 0,
  sepia: 0,
  blur: 0,
  sharpen: 0,
  invert: false,
  ...over,
});

const adjustments = (over: Partial<ImageAdjustments> = {}): ImageAdjustments => ({
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  temperature: 0,
  tint: 0,
  vibrance: 0,
  ...over,
});

describe("buildFilterString", () => {
  it("returns 'none' when nothing is applied", () => {
    expect(buildFilterString(filters())).toBe("none");
  });
  it("emits only the active filters, space-joined", () => {
    expect(buildFilterString(filters({ grayscale: 50, blur: 3, invert: true }))).toBe(
      "grayscale(50%) blur(3px) invert(100%)"
    );
    expect(buildFilterString(filters({ sepia: 20 }))).toBe("sepia(20%)");
  });
});

describe("buildAdjustmentString", () => {
  it("returns 'none' at all-zero", () => {
    expect(buildAdjustmentString(adjustments())).toBe("none");
  });
  it("maps -100..100 into 0..200% for brightness/contrast/saturation", () => {
    expect(buildAdjustmentString(adjustments({ brightness: 20 }))).toBe("brightness(120%)");
    expect(buildAdjustmentString(adjustments({ contrast: -50 }))).toBe("contrast(50%)");
    expect(buildAdjustmentString(adjustments({ saturation: 100 }))).toBe("saturate(200%)");
  });
  it("emits hue-rotate in degrees", () => {
    expect(buildAdjustmentString(adjustments({ hue: 90 }))).toBe("hue-rotate(90deg)");
  });
  it("combines multiple active adjustments", () => {
    expect(buildAdjustmentString(adjustments({ brightness: 10, hue: 45 }))).toBe(
      "brightness(110%) hue-rotate(45deg)"
    );
  });
});

describe("calculateExportDimensions", () => {
  it("uses exact width+height when both provided", () => {
    expect(
      calculateExportDimensions(800, 600, { format: "png", quality: 1, width: 100, height: 50 })
    ).toEqual({ width: 100, height: 50 });
  });

  it("clamps to maxWidth preserving aspect ratio", () => {
    expect(
      calculateExportDimensions(800, 400, { format: "png", quality: 1, maxWidth: 400 })
    ).toEqual({ width: 400, height: 200 });
  });

  it("clamps to maxHeight preserving aspect ratio", () => {
    expect(
      calculateExportDimensions(400, 800, { format: "png", quality: 1, maxHeight: 400 })
    ).toEqual({ width: 200, height: 400 });
  });

  it("returns the original size when no constraints apply", () => {
    expect(calculateExportDimensions(320, 240, { format: "png", quality: 1 })).toEqual({
      width: 320,
      height: 240,
    });
  });
});

describe("getMimeType", () => {
  it("maps known formats and defaults to png", () => {
    expect(getMimeType("jpeg")).toBe("image/jpeg");
    expect(getMimeType("png")).toBe("image/png");
    expect(getMimeType("webp")).toBe("image/webp");
    expect(getMimeType("avif")).toBe("image/avif");
    expect(getMimeType("bmp")).toBe("image/png");
  });
});

describe("dataURLToBlob", () => {
  it("converts a base64 data URL to a typed Blob", async () => {
    const blob = await dataURLToBlob("data:image/png;base64,aGVsbG8="); // "hello"
    expect(blob.type).toBe("image/png");
    expect(blob.size).toBe(5);
  });

  it("rejects a malformed data URL", async () => {
    await expect(dataURLToBlob("not-a-data-url")).rejects.toThrow();
  });
});

/**
 * The image editor's draft model — Clone 3397:39917 (S3.6 · media ·
 * image-editor) and the QA contract 3697:20354: "positive whole pixels only;
 * reject zero, negative, nonnumeric and values above the configured
 * processing limit. Limit value must come from backend capability."
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it } from "vitest";
import { MAX_IMAGE_EDIT_DIMENSION } from "@shared/constants/media";
import {
  INITIAL_DRAFT,
  buildCssFilter,
  describeEdits,
  isDraftDirty,
  outputSize,
  savingsPercent,
  snapshotEdits,
  sourceFormatOf,
  statusLine,
  validateResize,
} from "../imageEdits";

const CROP = { width: 1600, height: 1200 };

describe("validateResize — QA contract 3697:20354", () => {
  it("accepts positive whole pixels up to the cap", () => {
    expect(validateResize("1600", "1200")).toEqual({ ok: true, width: 1600, height: 1200 });
    expect(validateResize(String(MAX_IMAGE_EDIT_DIMENSION), "1")).toEqual({
      ok: true,
      width: MAX_IMAGE_EDIT_DIMENSION,
      height: 1,
    });
  });

  it("rejects values above the cap with the board's line, naming the code's number (3695:43624)", () => {
    expect(validateResize("12000", "9000")).toEqual({
      ok: false,
      message: `Maximum is ${MAX_IMAGE_EDIT_DIMENSION} × ${MAX_IMAGE_EDIT_DIMENSION} px. Enter a smaller size to continue.`,
    });
    expect(validateResize("100", String(MAX_IMAGE_EDIT_DIMENSION + 1)).ok).toBe(false);
  });

  it("rejects zero, negative and non-numeric entries, each with its own line", () => {
    expect(validateResize("0", "1200")).toEqual({ ok: false, message: "Width and height must be at least 1 px." });
    expect(validateResize("-5", "1200")).toEqual({ ok: false, message: "Width and height cannot be negative." });
    expect(validateResize("abc", "1200")).toEqual({
      ok: false,
      message: "Enter whole pixel values for width and height.",
    });
    expect(validateResize("12.5", "1200").ok).toBe(false);
    expect(validateResize("", "1200").ok).toBe(false);
  });

  it("the cap is the code's constant, not the board's 8000 sample", () => {
    expect(MAX_IMAGE_EDIT_DIMENSION).toBe(8192);
  });
});

describe("outputSize + statusLine — the preview's mono status", () => {
  it("follows the crop while the resize fields are untouched", () => {
    expect(outputSize(INITIAL_DRAFT, CROP)).toEqual(CROP);
    expect(statusLine(INITIAL_DRAFT, CROP)).toBe("1600 × 1200 · Free · WebP");
  });

  it("prints a valid resize, the aspect chip and the output format", () => {
    const draft = { ...INITIAL_DRAFT, width: "800", height: "600", aspect: "16:9" as const, format: "jpeg" as const };
    expect(statusLine(draft, CROP)).toBe("800 × 600 · 16:9 · JPEG");
  });

  it("keeps the crop size while the resize is invalid", () => {
    expect(outputSize({ ...INITIAL_DRAFT, width: "0", height: "600" }, CROP)).toEqual(CROP);
  });
});

describe("buildCssFilter", () => {
  it("is 'none' for the untouched draft and layers the preset after the sliders", () => {
    expect(buildCssFilter(INITIAL_DRAFT)).toBe("none");
    expect(buildCssFilter({ ...INITIAL_DRAFT, brightness: 50, blur: 4, preset: "bw" })).toBe(
      "brightness(1.5) blur(4px) grayscale(1)",
    );
  });
});

describe("snapshotEdits + describeEdits — the Saved summary (3681:20026)", () => {
  it("prints 'Original' where nothing was touched", () => {
    const snap = snapshotEdits(INITIAL_DRAFT, { width: 2400, height: 1600 }, "webp");
    expect(snap).toEqual({
      width: 2400,
      height: 1600,
      crop: "Original",
      preset: "Original",
      format: "Original",
      transform: "Original",
      brightness: 0,
      contrast: 0,
      saturation: 0,
      blur: 0,
    });
    expect(describeEdits(snap)).toEqual([
      "Width: 2400",
      "Height: 1600",
      "Crop: Original",
      "Preset: Original",
      "Format: Original",
      "Transform: Original",
      "Brightness: 0 · Contrast: 0 · Saturation: 0 · Blur: 0",
    ]);
  });

  it("names the crop chip, preset, output format and transform once touched", () => {
    const snap = snapshotEdits(
      { ...INITIAL_DRAFT, aspect: "1:1", preset: "sepia", rotation: 90, flipH: true, brightness: -10, blur: 8 },
      { width: 1200, height: 1200 },
      "jpeg",
    );
    expect(snap.crop).toBe("1:1");
    expect(snap.preset).toBe("Sepia");
    expect(snap.format).toBe("WebP");
    expect(snap.transform).toBe("Rotate 90° · Flip horizontal");
    expect(describeEdits(snap).at(-1)).toBe("Brightness: -10 · Contrast: 0 · Saturation: 0 · Blur: 8");
  });

  it("a zoomed or repositioned Free crop is a crop, not Original", () => {
    expect(snapshotEdits({ ...INITIAL_DRAFT, zoom: 1.5 }, CROP, "webp").crop).toBe("Free");
    expect(snapshotEdits({ ...INITIAL_DRAFT, crop: { x: 10, y: 0 } }, CROP, "webp").crop).toBe("Free");
  });

  it("format reads Original only when the output matches the source's format", () => {
    expect(snapshotEdits({ ...INITIAL_DRAFT, format: "jpeg" }, CROP, "jpeg").format).toBe("Original");
    expect(snapshotEdits({ ...INITIAL_DRAFT, format: "jpeg" }, CROP, null).format).toBe("JPEG");
  });
});

describe("sourceFormatOf", () => {
  it("reads the library name's extension first, then the data URL's mime", () => {
    expect(sourceFormatOf("hero-dark.jpg", "blob:x")).toBe("jpeg");
    expect(sourceFormatOf("logo.PNG", "blob:x")).toBe("png");
    expect(sourceFormatOf(undefined, "data:image/webp;base64,AA")).toBe("webp");
    expect(sourceFormatOf("scan.tiff", "blob:x")).toBeNull();
  });
});

describe("isDraftDirty + savingsPercent", () => {
  it("compares every field including the crop position", () => {
    expect(isDraftDirty(INITIAL_DRAFT, { ...INITIAL_DRAFT })).toBe(false);
    expect(isDraftDirty(INITIAL_DRAFT, { ...INITIAL_DRAFT, crop: { x: 1, y: 0 } })).toBe(true);
    expect(isDraftDirty(INITIAL_DRAFT, { ...INITIAL_DRAFT, quality: 60 })).toBe(true);
  });

  it("savings is the rounded percent smaller, null without an original size", () => {
    expect(savingsPercent(840_000, 492_000)).toBe(-41);
    expect(savingsPercent(100, 130)).toBe(30);
    expect(savingsPercent(0, 10)).toBeNull();
  });
});

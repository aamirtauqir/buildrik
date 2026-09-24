/**
 * The image editor's draft — Clone 3397:39917 "S3.6 · media · image-editor"
 * and its outcomes (section 4184:26629): one record every tab edits, the
 * validation the QA contract 3697:20354 spells out, and the `EditsSnapshot`
 * a saved version carries so the Saved state (3681:20026) and the versions
 * cards can print the same summary.
 *
 * Pure: no React, no canvas. `renderImageEdits.ts` turns a draft into bytes.
 *
 * @license BSD-3-Clause
 */

import { MAX_IMAGE_EDIT_DIMENSION } from "@shared/constants/media";

export type ImageEditorTab = "crop" | "adjust" | "resize" | "optimise";
export type AspectId = "free" | "1:1" | "4:3" | "3:2" | "16:9";
export type PresetId = "none" | "bw" | "sepia" | "cool" | "warm" | "vibrant";
export type OutputFormat = "webp" | "jpeg" | "png";

export const EDITOR_TABS: ReadonlyArray<{ id: ImageEditorTab; label: string }> = [
  { id: "crop", label: "Crop" },
  { id: "adjust", label: "Adjust" },
  { id: "resize", label: "Resize" },
  { id: "optimise", label: "Optimise" },
];

/** The Crop tab's chips, in the board's order. `ratio` undefined = free. */
export const ASPECT_CHIPS: ReadonlyArray<{ id: AspectId; label: string; ratio?: number }> = [
  { id: "free", label: "Free" },
  { id: "1:1", label: "1:1", ratio: 1 },
  { id: "4:3", label: "4:3", ratio: 4 / 3 },
  { id: "3:2", label: "3:2", ratio: 3 / 2 },
  { id: "16:9", label: "16:9", ratio: 16 / 9 },
];

/** Layered AFTER the brightness / contrast / saturation / blur sliders. */
export const PRESET_CHIPS: ReadonlyArray<{ id: PresetId; label: string; cssFilter: string }> = [
  { id: "none", label: "None", cssFilter: "" },
  { id: "bw", label: "B&W", cssFilter: "grayscale(1)" },
  { id: "sepia", label: "Sepia", cssFilter: "sepia(0.85) saturate(1.1)" },
  { id: "cool", label: "Cool", cssFilter: "hue-rotate(-15deg) saturate(1.1) brightness(1.02)" },
  { id: "warm", label: "Warm", cssFilter: "hue-rotate(15deg) saturate(1.15) brightness(1.05)" },
  { id: "vibrant", label: "Vibrant", cssFilter: "saturate(1.4) contrast(1.1)" },
];

export const FORMAT_CHIPS: ReadonlyArray<{ id: OutputFormat; label: string; mime: string }> = [
  { id: "webp", label: "WebP", mime: "image/webp" },
  { id: "jpeg", label: "JPEG", mime: "image/jpeg" },
  { id: "png", label: "PNG", mime: "image/png" },
];

export const SCALE_CHIPS = [25, 50, 75, 100] as const;

/* Slider ranges. Zoom tops out at 200%: board 3707:20536 draws 150% at the
   middle of the track. Rotation is the full turn either way; ↺ / ↻ step it
   by 90 and wrap. */
export const ADJUST_RANGE = 100;
export const BLUR_MAX = 20;
export const QUALITY_MIN = 10;

export interface ImageDraft {
  aspect: AspectId;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  zoom: number;
  /** react-easy-crop's pan position. */
  crop: { x: number; y: number };
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  preset: PresetId;
  /** As typed in the Resize fields — `""` means "follow the crop". */
  width: string;
  height: string;
  aspectLocked: boolean;
  format: OutputFormat;
  quality: number;
}

export const INITIAL_DRAFT: ImageDraft = {
  aspect: "free",
  rotation: 0,
  flipH: false,
  flipV: false,
  zoom: 1,
  crop: { x: 0, y: 0 },
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
  preset: "none",
  width: "",
  height: "",
  aspectLocked: true,
  format: "webp",
  quality: 85,
};

export interface OutputSize {
  width: number;
  height: number;
}

/** What a saved version records — printed by the Saved state and the versions cards. */
export interface EditsSnapshot {
  width: number;
  height: number;
  /** The aspect chip, or "Original" when the crop was never touched. */
  crop: string;
  /** The preset label, or "Original" for none. */
  preset: string;
  /** The output format label, or "Original" when it matches the source file's. */
  format: string;
  /** `Rotate 90° · Flip horizontal`, or "Original". */
  transform: string;
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
}

const UNTOUCHED = "Original";

export function buildCssFilter(d: ImageDraft): string {
  const parts: string[] = [];
  if (d.brightness !== 0) parts.push(`brightness(${1 + d.brightness / 100})`);
  if (d.contrast !== 0) parts.push(`contrast(${1 + d.contrast / 100})`);
  if (d.saturation !== 0) parts.push(`saturate(${1 + d.saturation / 100})`);
  if (d.blur > 0) parts.push(`blur(${d.blur}px)`);
  const preset = PRESET_CHIPS.find((p) => p.id === d.preset)?.cssFilter;
  if (preset) parts.push(preset);
  return parts.length > 0 ? parts.join(" ") : "none";
}

export type ResizeVerdict = { ok: true; width: number; height: number } | { ok: false; message: string };

/**
 * QA contract 3697:20354: positive whole pixels only. One line per reason, so
 * the person is told what to fix rather than that something is wrong. The
 * fields are text inputs on purpose — a `type="number"` field silently drops
 * "abc" and "-" and the non-numeric branch could never be reached.
 */
export function validateResize(width: string, height: string, cap = MAX_IMAGE_EDIT_DIMENSION): ResizeVerdict {
  const values = [width.trim(), height.trim()];
  if (values.some((v) => /^-\d+(\.\d+)?$/.test(v))) {
    return { ok: false, message: "Width and height cannot be negative." };
  }
  if (values.some((v) => !/^\d+$/.test(v))) {
    return { ok: false, message: "Enter whole pixel values for width and height." };
  }
  const [w, h] = values.map(Number);
  if (w === 0 || h === 0) {
    return { ok: false, message: "Width and height must be at least 1 px." };
  }
  if (w > cap || h > cap) {
    return { ok: false, message: `Maximum is ${cap} × ${cap} px. Enter a smaller size to continue.` };
  }
  return { ok: true, width: w, height: h };
}

/** The size the version will be encoded at: a valid resize, else the crop. */
export function outputSize(d: ImageDraft, crop: OutputSize): OutputSize {
  if (d.width === "" && d.height === "") return crop;
  const verdict = validateResize(d.width, d.height);
  return verdict.ok ? { width: verdict.width, height: verdict.height } : crop;
}

const aspectLabel = (d: ImageDraft) => ASPECT_CHIPS.find((a) => a.id === d.aspect)?.label ?? "Free";
const formatLabel = (f: OutputFormat) => FORMAT_CHIPS.find((c) => c.id === f)?.label ?? f;

/** `1600 × 1200 · Free · WebP` — the mono line under the preview. */
export function statusLine(d: ImageDraft, crop: OutputSize): string {
  const out = outputSize(d, crop);
  return `${out.width} × ${out.height} · ${aspectLabel(d)} · ${formatLabel(d.format)}`;
}

/** 4418:149321's info block under the preview: `Crop: Free` · `Preset: None`
 *  · `Format: Original` and the two tone lines. */
export function previewInfo(d: ImageDraft, sourceFormat: OutputFormat | null): string[] {
  return [
    `Crop: ${aspectLabel(d)}`,
    `Preset: ${PRESET_CHIPS.find((p) => p.id === d.preset)?.label ?? d.preset}`,
    `Format: ${d.format === sourceFormat ? UNTOUCHED : formatLabel(d.format)}`,
    `Brightness: ${d.brightness} · Contrast: ${d.contrast}`,
    `Saturation: ${d.saturation} · Blur: ${d.blur}`,
  ];
}

/** Rotation dropdown (4418:149321): quarter turns plus 15° steps, so the
 *  quarter-turn buttons and most of the old ±180 slider live in one list. */
export const ROTATION_OPTIONS: readonly number[] = [0, 15, 30, 45, 90, 180, -90, -45, -30, -15];
/** Zoom dropdown (4418:149321); the preview's wheel/pinch still zooms finely. */
export const ZOOM_OPTIONS: readonly number[] = [1, 1.25, 1.5, 1.75, 2];

/**
 * The source file's format, so a save that keeps it prints "Format: Original".
 * The library name is authoritative (a blob: URL says nothing); a data URL's
 * mime is the fallback for callers that pass no name.
 */
export function sourceFormatOf(fileName: string | undefined, src: string): OutputFormat | null {
  const ext = fileName?.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  const mime = src.startsWith("data:") ? src.slice(5, src.indexOf(";")).toLowerCase() : "";
  const key = ext ?? mime.replace("image/", "");
  if (key === "jpg" || key === "jpeg") return "jpeg";
  if (key === "png") return "png";
  if (key === "webp") return "webp";
  return null;
}

export function snapshotEdits(d: ImageDraft, output: OutputSize, sourceFormat: OutputFormat | null): EditsSnapshot {
  const cropTouched = d.aspect !== "free" || d.zoom !== 1 || d.crop.x !== 0 || d.crop.y !== 0;
  const transform: string[] = [];
  if (d.rotation !== 0) transform.push(`Rotate ${d.rotation}°`);
  if (d.flipH) transform.push("Flip horizontal");
  if (d.flipV) transform.push("Flip vertical");
  return {
    width: output.width,
    height: output.height,
    crop: cropTouched ? aspectLabel(d) : UNTOUCHED,
    preset: d.preset === "none" ? UNTOUCHED : (PRESET_CHIPS.find((p) => p.id === d.preset)?.label ?? d.preset),
    format: d.format === sourceFormat ? UNTOUCHED : formatLabel(d.format),
    transform: transform.length > 0 ? transform.join(" · ") : UNTOUCHED,
    brightness: d.brightness,
    contrast: d.contrast,
    saturation: d.saturation,
    blur: d.blur,
  };
}

/** The Saved state's list (3681:20026), one string per line. */
export function describeEdits(s: EditsSnapshot): string[] {
  return [
    `Width: ${s.width}`,
    `Height: ${s.height}`,
    `Crop: ${s.crop}`,
    `Preset: ${s.preset}`,
    `Format: ${s.format}`,
    `Transform: ${s.transform}`,
    `Brightness: ${s.brightness} · Contrast: ${s.contrast} · Saturation: ${s.saturation} · Blur: ${s.blur}`,
  ];
}

export function isDraftDirty(a: ImageDraft, b: ImageDraft): boolean {
  return (Object.keys(a) as Array<keyof ImageDraft>).some((k) =>
    k === "crop" ? a.crop.x !== b.crop.x || a.crop.y !== b.crop.y : a[k] !== b[k],
  );
}

/** `-41` for a file 41% smaller, `+30` bigger; null until the original's size is known. */
export function savingsPercent(originalBytes: number, estimatedBytes: number): number | null {
  if (originalBytes <= 0) return null;
  return Math.round((estimatedBytes / originalBytes - 1) * 100);
}

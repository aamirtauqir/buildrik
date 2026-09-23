/**
 * Turns an image-editor draft into the bytes a version is made of.
 *
 * Two canvases, the way react-easy-crop's own reference does it: the source
 * is drawn rotated, flipped and filtered onto a canvas the size of its
 * rotated bounding box, and the crop rectangle — which the cropper reports in
 * THAT rotated pixel space — is then cut out of it at the output size. The
 * one-canvas version this replaces rotated the crop after cutting it, so any
 * rotation other than 0 saved a different region than the preview showed.
 *
 * The same function feeds the Optimise tab's estimate (encoded at the chosen
 * format and quality, measured, discarded) and the Save — so the estimate is
 * an estimate only in the sense that the upload may still fail.
 *
 * @license BSD-3-Clause
 */

import type { Area } from "react-easy-crop";
import { loadImage } from "@/engine/media/MediaOptimizerHelpers";
import { FORMAT_CHIPS, buildCssFilter, outputSize, type ImageDraft } from "./imageEdits";

export async function renderImageEdits(imageSrc: string, draft: ImageDraft, cropPixels: Area): Promise<string> {
  const image = await loadImage(imageSrc);
  const out = outputSize(draft, { width: Math.round(cropPixels.width), height: Math.round(cropPixels.height) });

  const radians = (draft.rotation * Math.PI) / 180;
  const bboxWidth = Math.abs(Math.cos(radians) * image.width) + Math.abs(Math.sin(radians) * image.height);
  const bboxHeight = Math.abs(Math.sin(radians) * image.width) + Math.abs(Math.cos(radians) * image.height);

  const stage = document.createElement("canvas");
  stage.width = Math.round(bboxWidth);
  stage.height = Math.round(bboxHeight);
  const stageCtx = stage.getContext("2d");
  if (!stageCtx) throw new Error("Canvas is unavailable");
  stageCtx.filter = buildCssFilter(draft);
  stageCtx.translate(stage.width / 2, stage.height / 2);
  stageCtx.rotate(radians);
  stageCtx.scale(draft.flipH ? -1 : 1, draft.flipV ? -1 : 1);
  stageCtx.translate(-image.width / 2, -image.height / 2);
  stageCtx.drawImage(image, 0, 0);

  const canvas = document.createElement("canvas");
  canvas.width = out.width;
  canvas.height = out.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable");
  if (draft.format === "jpeg") {
    // JPEG has no alpha; without a fill, transparent pixels encode black.
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, out.width, out.height);
  }
  ctx.drawImage(
    stage,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    out.width,
    out.height,
  );

  const mime = FORMAT_CHIPS.find((f) => f.id === draft.format)?.mime ?? "image/webp";
  return canvas.toDataURL(mime, draft.quality / 100);
}

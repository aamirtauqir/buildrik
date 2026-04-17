/**
 * thumbnailKey — pick a deterministic gradient class for the row thumbnail
 * placeholder. Real thumbnail snapshots are a separate feature; until then,
 * the class is chosen by page shape so the same page always looks the same.
 *
 * @license BSD-3-Clause
 */

import type { PageItem } from "../types";

const PALETTE = ["t-hero", "t-about", "t-blog", "t-contact", "t-pricing", "t-ext"] as const;
export type ThumbClass = typeof PALETTE[number];

export function thumbnailKey(page: PageItem): ThumbClass {
  if (page.status === "external") return "t-ext";
  if (page.isHome) return "t-hero";
  // Deterministic pick for the remaining pages — stable across renders.
  let h = 0;
  for (let i = 0; i < page.id.length; i++) h = (h * 31 + page.id.charCodeAt(i)) | 0;
  const bucket = PALETTE.slice(1, PALETTE.length - 1); // exclude t-hero, t-ext
  return bucket[Math.abs(h) % bucket.length];
}

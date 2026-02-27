/**
 * Media Tab Static Data
 * TYPE_PILLS, SORT_OPTIONS, GRID_OPTIONS, MEDIA_TIPS, EMPTY_MSGS, labels
 * @license BSD-3-Clause
 */

import type { MediaTypeFilter, MediaSortBy } from "./mediaTypes";

// --- Type pills ---

export interface TypePillDef {
  type: MediaTypeFilter;
  label: string;
  icon: string; // text/unicode — no JSX dependency
}

export const TYPE_PILLS: TypePillDef[] = [
  { type: "all", label: "All", icon: "◈" },
  { type: "img", label: "Images", icon: "🖼" },
  { type: "vid", label: "Videos", icon: "▶" },
  { type: "ico", label: "Icons", icon: "◉" },
  { type: "fnt", label: "Fonts", icon: "T" },
];

// --- Sort options ---

export interface SortOptionDef {
  by: MediaSortBy;
  label: string;
}

export const SORT_OPTIONS: SortOptionDef[] = [
  { by: "date", label: "Date added" },
  { by: "name", label: "Name" },
  { by: "size", label: "File size" },
  { by: "type", label: "Type" },
];

// --- Grid column options ---

export interface GridOptionDef {
  n: 2 | 3 | 4;
  label: string;
}

export const GRID_OPTIONS: GridOptionDef[] = [
  { n: 2, label: "2 columns" },
  { n: 3, label: "3 columns" },
  { n: 4, label: "4 columns" },
];

// --- Storage ---

/** 1 GB storage limit (in bytes) */
export const STORAGE_TOTAL_BYTES = 1_073_741_824;

// --- Tips ---

export interface MediaTip {
  id: string;
  text: string;
}

export const MEDIA_TIPS: MediaTip[] = [
  {
    id: "drag-drop",
    text: "Drag files directly onto the canvas to upload and insert them at once.",
  },
  {
    id: "bulk-select",
    text: "Hold Shift and click items to select multiple files for bulk actions.",
  },
  {
    id: "discovery",
    text: "Switch to Discovery to browse free stock photos, videos, icons, and fonts.",
  },
  {
    id: "rename",
    text: "Click a file name in the detail view to rename it inline.",
  },
  {
    id: "formats",
    text: "Upload JPG, PNG, WebP, GIF, SVG, MP4, WebM, TTF, or OTF files.",
  },
];

// --- Empty state messages ---

export interface EmptyMsg {
  title: string;
  sub: string;
}

export const EMPTY_MSGS: Record<MediaTypeFilter, EmptyMsg> = {
  all: {
    title: "No files yet",
    sub: "Upload images, videos, icons, or fonts to get started.",
  },
  img: {
    title: "No images",
    sub: "Upload JPG, PNG, WebP, GIF, or SVG files.",
  },
  vid: {
    title: "No videos",
    sub: "Upload MP4 or WebM files.",
  },
  ico: {
    title: "No icons",
    sub: "Upload SVG files to use as icons.",
  },
  fnt: {
    title: "No fonts",
    sub: "Upload TTF or OTF font files.",
  },
};

// --- Discovery section labels ---

export const DISC_SECTION_LABELS: Record<"img" | "vid" | "ico" | "fnt", string> = {
  img: "Stock Photos",
  vid: "Stock Videos",
  ico: "Icon Library",
  fnt: "Google Fonts",
};

// --- Format filter options per type ---

export const FORMAT_OPTIONS: Record<"img" | "vid" | "ico" | "fnt", string[]> = {
  img: ["jpeg", "png", "webp", "gif", "svg"],
  vid: ["mp4", "webm"],
  ico: ["svg"],
  fnt: ["ttf", "otf", "woff", "woff2"],
};

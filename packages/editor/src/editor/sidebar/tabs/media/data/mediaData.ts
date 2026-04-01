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
  lucideIcon: string; // Lucide icon component name
}

export const TYPE_PILLS: TypePillDef[] = [
  { type: "all", label: "All", lucideIcon: "LayoutGrid" },
  { type: "img", label: "Images", lucideIcon: "Image" },
  { type: "vid", label: "Videos", lucideIcon: "Video" },
  { type: "ico", label: "Icons", lucideIcon: "Shapes" },
  { type: "fnt", label: "Fonts", lucideIcon: "Type" },
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

// --- Tips ---

export const MEDIA_TIP_TEXT =
  "Click any file to insert it on the canvas, or drag it directly from the panel.";

// --- Empty state messages ---

export interface EmptyMsg {
  title: string;
  sub: string;
}

export const EMPTY_MSGS: Record<MediaTypeFilter, EmptyMsg> = {
  all: {
    title: "Your media library is empty",
    sub: "Drag files here or click Upload. Supports PNG, JPG, SVG, MP4, WebM, TTF, OTF \u2014 max 10 MB each.",
  },
  img: {
    title: "No images",
    sub: "Drag or upload JPG, PNG, WebP, GIF, or SVG \u2014 max 10 MB.",
  },
  vid: {
    title: "No videos",
    sub: "Drag or upload MP4 or WebM \u2014 max 10 MB.",
  },
  ico: {
    title: "No icons",
    sub: "Drag or upload SVG files to use as icons.",
  },
  fnt: {
    title: "No fonts",
    sub: "Drag or upload TTF, OTF, WOFF, or WOFF2 font files.",
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

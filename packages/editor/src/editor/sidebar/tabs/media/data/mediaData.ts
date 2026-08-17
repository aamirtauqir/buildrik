/**
 * Media Tab Static Data
 * TYPE_PILLS, GRID_OPTIONS, MEDIA_TIPS, labels.
 *
 * SORT_OPTIONS, EMPTY_MSGS and FORMAT_OPTIONS lived here for `LibraryView`,
 * the media tab's unreachable fullpage branch; they went with it. The live
 * manager (`editor/media/`) declares its own sort list locally.
 * @license BSD-3-Clause
 */

import type { MediaTypeFilter, MediaSortBy } from "./mediaTypes";

// --- Type pills ---

export interface TypePillDef {
  type: MediaTypeFilter;
  label: string;
  lucideIcon: string; // Lucide icon component name
}

const TYPE_PILLS: TypePillDef[] = [
  { type: "all", label: "All", lucideIcon: "LayoutGrid" },
  { type: "img", label: "Images", lucideIcon: "Image" },
  { type: "vid", label: "Videos", lucideIcon: "Video" },
  { type: "ico", label: "Icons", lucideIcon: "Shapes" },
  { type: "fnt", label: "Fonts", lucideIcon: "Type" },
];

// --- Sort options ---


// --- Grid column options ---

export interface GridOptionDef {
  n: 2 | 3 | 4;
  label: string;
}

const GRID_OPTIONS: GridOptionDef[] = [
  { n: 2, label: "2 columns" },
  { n: 3, label: "3 columns" },
  { n: 4, label: "4 columns" },
];

// --- Tips ---
// --- Empty state messages ---


// --- Discovery section labels ---
// --- Format filter options per type ---


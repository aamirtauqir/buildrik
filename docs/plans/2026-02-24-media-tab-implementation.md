# Media Tab Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the existing 13-file media tab with a clean 11-file flat module implementing the two-view (My Library / Discovery) architecture.

**Architecture:** Flat module in `src/editor/sidebar/tabs/media/`. All state in `useMediaState.ts`. `MediaTab.tsx` composes typed-slice children — no pass-through wrappers, no SSOT violations. Engine gets 3 new stub methods + `"font"` added to `MediaAssetType`.

**Tech Stack:** React 18 + TypeScript strict, CSS vars (`--aqb-*`, `--media-*`), composer.media engine API, MEDIA_EVENTS constants.

**Design Spec:** `docs/plans/2026-02-24-media-tab-redesign.md` — read this before implementing.

**Reference Prototype:** `/Users/shahg/Downloads/media_tab_v20.html` — visual source of truth for CSS classes and layout.

---

## Pre-Flight: Key Files

```
READ BEFORE STARTING:
  src/shared/types/media.ts                   — MediaAssetType, UploadProgress, MediaSortBy
  src/shared/constants/media.ts               — MEDIA_EVENTS constants
  src/engine/media/MediaManager.ts            — existing API (getAssets, uploadFile, deleteAsset, etc.)
  src/editor/sidebar/tabs/PagesTab.tsx        — pattern reference for composer wiring
  src/editor/sidebar/LeftSidebar.css          — where --media-* vars go
  src/editor/sidebar/TabRouter.tsx            — imports MediaTab (line 21: tabs/MediaTab)
  src/editor/sidebar/tabs/MediaTab.tsx        — OLD top-level shell (will be DELETED)
  src/editor/sidebar/tabs/media/              — OLD 13-file folder (ALL DELETED)
```

---

## Task 1: Engine — Add `"font"` to MediaAssetType + 3 Discovery Stubs

**Files:**

- Modify: `src/shared/types/media.ts` (line 16)
- Modify: `src/engine/media/MediaManager.ts` (add 3 methods at end of class)

**Step 1: Add `"font"` to MediaAssetType**

In `src/shared/types/media.ts`, line 16:

```typescript
// Before:
export type MediaAssetType = "image" | "video" | "audio" | "icon" | "svg";
// After:
export type MediaAssetType = "image" | "video" | "audio" | "icon" | "svg" | "font";
```

**Step 2: Add Discovery stub interfaces at top of MediaManager.ts** (after existing imports)

```typescript
// --- Discovery stub types ---
export interface StockPhoto {
  id: string;
  url: string;
  thumb: string;
  alt: string;
  author: string;
  authorUrl: string;
  width: number;
  height: number;
  source: "unsplash";
}

export interface StockVideo {
  id: string;
  url: string;
  thumb: string;
  duration: number;
  author: string;
  source: "pexels";
}

export interface DiscIcon {
  id: string;
  name: string;
  category: string;
  svgDataUrl: string; // data:image/svg+xml;base64,... — safe to use in <img src>
}

export interface DiscFont {
  id: string;
  family: string;
  category: "serif" | "sans-serif" | "monospace" | "display" | "handwriting";
  variants: string[];
  previewUrl?: string;
}
```

Note: `DiscIcon.svgDataUrl` is a base64 data URL so it can be safely rendered via `<img src>` without XSS risk.

**Step 3: Add 3 stub methods at end of MediaManager class** (before closing `}`)

```typescript
// --- Discovery Stubs (wire to real APIs later) ---

/**
 * Search stock photos (Unsplash) or videos (Pexels).
 * Stub returns empty array until API is wired.
 */
async searchStock(
  _type: "img" | "vid",
  _query: string
): Promise<StockPhoto[] | StockVideo[]> {
  return [];
}

/**
 * Get built-in icon library, optionally filtered by category.
 * Stub returns empty array until icon data is loaded.
 */
getIcons(_category?: string): DiscIcon[] {
  return [];
}

/**
 * Get Google Fonts list, optionally filtered by query.
 * Stub returns empty array until API is wired.
 */
async getFonts(_query?: string): Promise<DiscFont[]> {
  return [];
}
```

**Step 4: Verify TypeScript**

```bash
cd /Users/shahg/Desktop/aquibra-opencode/packages/new-editor-l2
npx tsc --noEmit 2>&1 | head -20
```

Expected: 0 errors (or same errors as before the change — do NOT introduce new ones).

**Step 5: Commit**

```bash
git add src/shared/types/media.ts src/engine/media/MediaManager.ts
git commit -m "feat(engine): add font to MediaAssetType + Discovery stub methods"
```

---

## Task 2: `mediaTypes.ts` — New UI Type Definitions

**Files:**

- Create: `src/editor/sidebar/tabs/media/mediaTypes.ts`

**Step 1: Write the file**

```typescript
/**
 * Media Tab UI Types
 * @license BSD-3-Clause
 */

import type { MediaSortBy, SortDirection, UploadProgress } from "../../../../shared/types/media";
import type { MediaAsset } from "../../../../shared/types/media";
import type {
  StockPhoto,
  StockVideo,
  DiscIcon,
  DiscFont,
} from "../../../../engine/media/MediaManager";

export type { MediaSortBy, SortDirection, UploadProgress, MediaAsset };
export type { StockPhoto, StockVideo, DiscIcon, DiscFont };

// --- Nav ---

export type MediaSource = "mine" | "disc";
export type MediaTypeFilter = "all" | "img" | "vid" | "ico" | "fnt";

// --- Library ---

/** Count per type — shown in TypePill badges */
export interface TypeCounts {
  all: number;
  img: number;
  vid: number;
  ico: number;
  fnt: number;
}

/** A library item (maps MediaAsset to display-ready shape) */
export interface LibraryItem {
  key: string;
  name: string;
  type: "img" | "vid" | "ico" | "fnt";
  src: string;
  thumb?: string;
  size: number; // bytes
  duration?: number; // seconds, video only
  width?: number;
  height?: number;
  createdAt: string;
  mimeType: string;
}

// --- Overlays ---

export interface CtxMenuState {
  x: number;
  y: number;
  item: LibraryItem;
}

// --- State result (returned by useMediaState) ---

export interface MediaStateResult {
  // Navigation
  source: MediaSource;
  activeType: MediaTypeFilter;
  setSource(src: MediaSource): void;
  setType(t: MediaTypeFilter): void;

  // Library
  libraryItems: LibraryItem[];
  uploadQueue: UploadProgress[];
  counts: TypeCounts;
  sort: MediaSortBy;
  sortDir: SortDirection;
  gridN: 2 | 3 | 4;
  fmtFilter: string;
  selMode: boolean;
  selectedKeys: Set<string>;
  setSort(by: MediaSortBy, dir: SortDirection): void;
  setGridN(n: 2 | 3 | 4): void;
  setFmtFilter(f: string): void;
  toggleSelMode(): void;
  toggleSelect(key: string): void;
  selectAll(): void;
  upload(files: File[]): void;
  deleteItem(key: string): void;
  bulkDelete(): void;
  insertToCanvas(key: string): void;
  renameItem(key: string, name: string): void;

  // Discovery
  stockPhotos: StockPhoto[];
  stockVideos: StockVideo[];
  discIcons: DiscIcon[];
  discFonts: DiscFont[];
  discLoading: Record<"img" | "vid" | "ico" | "fnt", boolean>;
  discSearchAll(query: string): void;
  loadMoreDisc(type: "img" | "vid"): void;
  saveToLibrary(type: "img" | "vid", item: StockPhoto | StockVideo): void;

  // Shared
  searchQuery: string;
  setSearch(q: string): void;
  storage: { used: number; total: number };

  // Overlays
  ctxMenu: CtxMenuState | null;
  openCtxMenu(e: React.MouseEvent, item: LibraryItem): void;
  closeCtxMenu(): void;
  detailItem: LibraryItem | null;
  openDetail(item: LibraryItem): void;
  closeDetail(): void;

  // Tips
  tipIdx: number;
  tipDismissed: boolean;
  dismissTips(): void;
}

// --- Prop slices ---

export interface TypePillsProps {
  activeType: MediaTypeFilter;
  counts: TypeCounts;
  discMode: boolean;
  onTypeChange(t: MediaTypeFilter): void;
}

export interface LibraryViewProps {
  items: LibraryItem[];
  uploadQueue: UploadProgress[];
  activeType: MediaTypeFilter;
  counts: TypeCounts;
  sort: MediaSortBy;
  sortDir: SortDirection;
  gridN: 2 | 3 | 4;
  fmtFilter: string;
  selMode: boolean;
  selectedKeys: Set<string>;
  searchQuery: string;
  onSort(by: MediaSortBy, dir: SortDirection): void;
  onGridN(n: 2 | 3 | 4): void;
  onFmt(f: string): void;
  onSelToggle(): void;
  onSelect(key: string): void;
  onSelectAll(): void;
  onBulkDelete(): void;
  onDelete(key: string): void;
  onInsert(key: string): void;
  onRename(key: string, name: string): void;
  onCtxMenu(e: React.MouseEvent, item: LibraryItem): void;
  onDetail(item: LibraryItem): void;
}

export interface DiscoveryViewProps {
  activeType: MediaTypeFilter;
  photos: StockPhoto[];
  videos: StockVideo[];
  icons: DiscIcon[];
  fonts: DiscFont[];
  loading: Record<"img" | "vid" | "ico" | "fnt", boolean>;
  searchQuery: string;
  onSearch(q: string): void;
  onLoadMore(type: "img" | "vid"): void;
  onSave(type: "img" | "vid", item: StockPhoto | StockVideo): void;
  onInsert(filename: string): void;
}

export interface UploadZoneProps {
  storage: { used: number; total: number };
  onUpload(files: File[]): void;
  uploadQueue: UploadProgress[];
}
```

**Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add src/editor/sidebar/tabs/media/mediaTypes.ts
git commit -m "feat(media): add mediaTypes.ts — UI type definitions"
```

---

## Task 3: `mediaUtils.ts` — Pure Helpers

**Files:**

- Create: `src/editor/sidebar/tabs/media/mediaUtils.ts`

**Step 1: Write the file**

```typescript
/**
 * Media Tab Pure Utilities
 * fmtSize, fmtDur, extStyle — ONLY defined here, never duplicated.
 * @license BSD-3-Clause
 */

import type { MediaTypeFilter } from "./mediaTypes";
import type { MediaAsset } from "../../../../shared/types/media";
import type { LibraryItem } from "./mediaTypes";

/** Format bytes to human-readable string e.g. "1.2 MB" */
export function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Format seconds to "0:34" or "1:23:45" */
export function fmtDur(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = String(m).padStart(h > 0 ? 2 : 1, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Map file extension to CSS accent class name */
export function extStyle(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "ext--img";
  if (mimeType.startsWith("video/")) return "ext--vid";
  if (mimeType.startsWith("audio/")) return "ext--aud";
  if (mimeType.includes("font")) return "ext--fnt";
  return "ext--doc";
}

/** Map MediaAsset.type to MediaTypeFilter short code */
export function assetTypeToFilter(type: MediaAsset["type"]): LibraryItem["type"] {
  switch (type) {
    case "image":
    case "svg":
      return "img";
    case "video":
      return "vid";
    case "icon":
      return "ico";
    case "font":
      return "fnt";
    default:
      return "img";
  }
}

/** Map MediaAsset to LibraryItem (display-ready) */
export function toLibraryItem(asset: MediaAsset): LibraryItem {
  return {
    key: asset.id,
    name: asset.name,
    type: assetTypeToFilter(asset.type),
    src: asset.src,
    thumb: asset.thumbnailSrc,
    size: asset.size,
    duration: asset.metadata?.duration,
    width: asset.width,
    height: asset.height,
    createdAt: asset.createdAt,
    mimeType: asset.mimeType,
  };
}

/** Filter library items by type pill */
export function filterByType(items: LibraryItem[], activeType: MediaTypeFilter): LibraryItem[] {
  if (activeType === "all") return items;
  return items.filter((i) => i.type === activeType);
}

/** Filter library items by format extension */
export function filterByFmt(items: LibraryItem[], fmt: string): LibraryItem[] {
  if (!fmt) return items;
  return items.filter((i) => i.mimeType.includes(fmt));
}

/** Search library items by name */
export function filterBySearch(items: LibraryItem[], q: string): LibraryItem[] {
  if (!q) return items;
  const lower = q.toLowerCase();
  return items.filter((i) => i.name.toLowerCase().includes(lower));
}

/** Count items per type */
export function countByType(items: LibraryItem[]): {
  all: number;
  img: number;
  vid: number;
  ico: number;
  fnt: number;
} {
  return {
    all: items.length,
    img: items.filter((i) => i.type === "img").length,
    vid: items.filter((i) => i.type === "vid").length,
    ico: items.filter((i) => i.type === "ico").length,
    fnt: items.filter((i) => i.type === "fnt").length,
  };
}
```

**Step 2: TypeScript check + commit**

```bash
npx tsc --noEmit 2>&1 | head -10
git add src/editor/sidebar/tabs/media/mediaUtils.ts
git commit -m "feat(media): add mediaUtils.ts — fmtSize, fmtDur, extStyle, toLibraryItem"
```

---

## Task 4: `mediaData.ts` — Static Data

**Files:**

- Create: `src/editor/sidebar/tabs/media/mediaData.ts`

**Step 1: Write the file**

```typescript
/**
 * Media Tab Static Data
 * Labels, tips, format options, grid presets.
 * @license BSD-3-Clause
 */

import type { MediaTypeFilter } from "./mediaTypes";

// --- Type pill config ---

export interface TypePillConfig {
  id: MediaTypeFilter;
  label: string;
}

export const TYPE_PILLS: TypePillConfig[] = [
  { id: "all", label: "All" },
  { id: "img", label: "Images" },
  { id: "vid", label: "Videos" },
  { id: "ico", label: "Icons" },
  { id: "fnt", label: "Fonts" },
];

// --- Sort options ---

export const SORT_OPTIONS = [
  { value: "date" as const, label: "Date added" },
  { value: "name" as const, label: "Name" },
  { value: "size" as const, label: "File size" },
  { value: "type" as const, label: "Type" },
] as const;

// --- Grid columns ---

export const GRID_OPTIONS: { n: 2 | 3 | 4; label: string }[] = [
  { n: 2, label: "2" },
  { n: 3, label: "3" },
  { n: 4, label: "4" },
];

// --- Storage total ---

export const STORAGE_TOTAL_BYTES = 1024 * 1024 * 1024; // 1 GB

// --- Discovery tips ---

export const MEDIA_TIPS = [
  "Drag any image from Discovery directly onto the canvas.",
  "Save stock photos to My Library for offline use.",
  "Use Select mode to bulk-delete assets.",
  "Type filter applies to both Library and Discovery.",
  "Rename files by double-clicking the name in detail view.",
];

// --- Empty-state messages ---

export const EMPTY_MSGS: Record<MediaTypeFilter, { title: string; sub: string }> = {
  all: { title: "No media yet", sub: "Upload images, videos, icons, or fonts." },
  img: { title: "No images yet", sub: "Upload JPG, PNG, WebP, SVG, or GIF files." },
  vid: { title: "No videos yet", sub: "Upload MP4 or WebM files (max 100 MB)." },
  ico: { title: "No icons yet", sub: "Upload SVG icon files." },
  fnt: { title: "No fonts yet", sub: "Upload TTF, OTF, or WOFF files." },
};

// --- Discovery section labels ---

export const DISC_SECTION_LABELS: Record<"img" | "vid" | "ico" | "fnt", string> = {
  img: "Free Photos — Unsplash",
  vid: "Free Videos — Pexels",
  ico: "Built-in Icons",
  fnt: "Google Fonts",
};
```

**Step 2: TypeScript check + commit**

```bash
npx tsc --noEmit 2>&1 | head -10
git add src/editor/sidebar/tabs/media/mediaData.ts
git commit -m "feat(media): add mediaData.ts — type pills, sort options, empty states"
```

---

## Task 5: `media.css` + `--media-*` vars in LeftSidebar.css

**Files:**

- Create: `src/editor/sidebar/tabs/media/media.css`
- Modify: `src/editor/sidebar/LeftSidebar.css` — add 4 `--media-*` vars

**Step 1: Add `--media-*` vars to LeftSidebar.css**

Find the `:root` or top-level CSS block and add (no hardcoded hex in component CSS):

```css
/* Media type accent colors */
--media-img: #3b82f6;
--media-vid: #f97316;
--media-ico: #f59e0b;
--media-fnt: #10b981;
```

**Step 2: Create media.css**

```css
/* media.css — Media Tab Styles
   Uses: --aqb-* for panel tokens, --media-* for type accents
   NO hardcoded hex values in selectors below this line.
   =================================================================*/

/* -- Container ---------------------------------------------------- */
.media-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--aqb-surface-2);
  overflow: hidden;
}

/* -- Source Bar (My Library | Discovery) -------------------------- */
.source-bar {
  display: flex;
  gap: 4px;
  padding: 8px 10px 0;
  flex-shrink: 0;
}
.source-btn {
  flex: 1;
  height: 28px;
  border: 1px solid transparent;
  border-radius: var(--aqb-radius-sm);
  background: transparent;
  color: var(--aqb-text-secondary);
  font-size: var(--aqb-font-xs);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.12s;
}
.source-btn.active {
  background: var(--aqb-surface-3);
  border-color: var(--aqb-border-active);
  color: var(--aqb-text-primary);
}
.source-btn:hover:not(.active) {
  background: var(--aqb-surface-3);
  color: var(--aqb-text-primary);
}

/* -- Type Pills ---------------------------------------------------- */
.type-pills {
  display: flex;
  gap: 4px;
  padding: 6px 10px;
  overflow-x: auto;
  flex-shrink: 0;
  scrollbar-width: none;
}
.type-pills::-webkit-scrollbar {
  display: none;
}
.tpill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-radius: 20px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--aqb-text-secondary);
  font-size: var(--aqb-font-xs);
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.12s;
  flex-shrink: 0;
}
.tpill.active {
  background: var(--aqb-surface-3);
  border-color: var(--aqb-border-active);
  color: var(--aqb-text-primary);
}
.tpill:hover:not(.active) {
  background: var(--aqb-surface-3);
  color: var(--aqb-text-primary);
}
.tpill-cnt {
  font-size: 10px;
  opacity: 0.6;
}
/* Hide counts in Discovery mode */
.type-pills.disc-mode .tpill-cnt {
  display: none;
}

/* -- Search Bar ---------------------------------------------------- */
.media-search {
  position: relative;
  padding: 0 10px 6px;
  flex-shrink: 0;
}
.media-search-input {
  width: 100%;
  height: 28px;
  padding: 0 8px 0 28px;
  border: 1px solid var(--aqb-border);
  border-radius: var(--aqb-radius-sm);
  background: var(--aqb-surface-3);
  color: var(--aqb-text-primary);
  font-size: var(--aqb-font-xs);
  box-sizing: border-box;
}
.media-search-input::placeholder {
  color: var(--aqb-text-tertiary);
}
.media-search-input:focus {
  outline: none;
  border-color: var(--aqb-border-active);
}
.media-search-icon {
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--aqb-text-tertiary);
  pointer-events: none;
}

/* -- Scroll body --------------------------------------------------- */
.media-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: var(--aqb-border) transparent;
  position: relative;
}

/* -- Library Toolbar ----------------------------------------------- */
.lib-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px 4px;
}
.lib-toolbar-spacer {
  flex: 1;
}
.ltb-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: var(--aqb-radius-sm);
  background: transparent;
  color: var(--aqb-text-secondary);
  cursor: pointer;
  transition: all 0.1s;
  font-size: var(--aqb-font-xs);
}
.ltb-btn:hover {
  background: var(--aqb-surface-3);
  color: var(--aqb-text-primary);
}
.ltb-btn.active {
  background: var(--aqb-surface-3);
  color: var(--aqb-accent-primary);
}
.ltb-select {
  height: 24px;
  padding: 0 6px;
  border: 1px solid var(--aqb-border);
  border-radius: var(--aqb-radius-sm);
  background: var(--aqb-surface-3);
  color: var(--aqb-text-secondary);
  font-size: var(--aqb-font-xs);
  cursor: pointer;
}

/* -- Library Section Header ---------------------------------------- */
.lib-section-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px 4px;
}
.lib-section-label {
  font-size: var(--aqb-font-xs);
  font-weight: 600;
  color: var(--aqb-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.lib-section-count {
  font-size: var(--aqb-font-xs);
  color: var(--aqb-text-tertiary);
}

/* -- Image Grid ---------------------------------------------------- */
.img-grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-n, 3), 1fr);
  gap: 3px;
  padding: 0 10px 8px;
}
.img-card {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--aqb-radius-sm);
  overflow: hidden;
  cursor: pointer;
  background: var(--aqb-surface-3);
}
.img-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.img-card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0);
  display: flex;
  align-items: flex-end;
  padding: 4px;
  transition: background 0.15s;
}
.img-card:hover .img-card-overlay {
  background: rgba(0, 0, 0, 0.35);
}
.img-card-name {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.9);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.15s;
  max-width: 100%;
}
.img-card:hover .img-card-name {
  opacity: 1;
}
.img-card.selected::after {
  content: "";
  position: absolute;
  inset: 0;
  border: 2px solid var(--aqb-accent-primary);
  border-radius: var(--aqb-radius-sm);
  pointer-events: none;
}
.img-card-check {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--aqb-accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  color: white;
}

/* -- Video Grid ---------------------------------------------------- */
.vid-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 10px 8px;
}
.vid-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  border-radius: var(--aqb-radius-sm);
  cursor: pointer;
  transition: background 0.1s;
}
.vid-card:hover {
  background: var(--aqb-surface-3);
}
.vid-thumb {
  width: 56px;
  height: 36px;
  border-radius: 3px;
  background: var(--aqb-surface-3);
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
}
.vid-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.vid-dur {
  position: absolute;
  bottom: 2px;
  right: 3px;
  font-size: 9px;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(0, 0, 0, 0.55);
  padding: 1px 3px;
  border-radius: 2px;
}
.vid-info {
  flex: 1;
  min-width: 0;
}
.vid-name {
  font-size: var(--aqb-font-xs);
  color: var(--aqb-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vid-meta {
  font-size: 10px;
  color: var(--aqb-text-tertiary);
  margin-top: 1px;
}
.vid-type-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--media-vid);
  flex-shrink: 0;
}

/* -- Icon Grid ----------------------------------------------------- */
.ico-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  padding: 0 10px 8px;
}
.ico-card {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  border-radius: var(--aqb-radius-sm);
  cursor: pointer;
  background: var(--aqb-surface-3);
  color: var(--aqb-text-secondary);
  transition: all 0.1s;
}
.ico-card:hover {
  background: var(--aqb-border-active);
  color: var(--aqb-text-primary);
}
.ico-card.selected {
  outline: 2px solid var(--aqb-accent-primary);
}
.ico-card img {
  width: 20px;
  height: 20px;
}

/* -- Font List ----------------------------------------------------- */
.fnt-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 10px 8px;
}
.fnt-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: var(--aqb-radius-sm);
  cursor: pointer;
  transition: background 0.1s;
}
.fnt-row:hover {
  background: var(--aqb-surface-3);
}
.fnt-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--media-fnt);
  flex-shrink: 0;
}
.fnt-name {
  font-size: var(--aqb-font-sm);
  color: var(--aqb-text-primary);
  flex: 1;
}
.fnt-preview {
  font-size: 13px;
  color: var(--aqb-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 80px;
}

/* -- Upload Ghost Card (upload in progress) ------------------------ */
.img-card.uploading {
  background: var(--aqb-surface-3);
  border: 1px dashed var(--aqb-border-active);
}
.upload-ghost-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: var(--aqb-accent-primary);
  transition: width 0.2s;
}

/* -- Bulk Select Bar ----------------------------------------------- */
.bulk-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--aqb-surface-3);
  border-top: 1px solid var(--aqb-border);
  flex-shrink: 0;
}
.bulk-bar-count {
  flex: 1;
  font-size: var(--aqb-font-xs);
  color: var(--aqb-text-secondary);
}
.bulk-btn {
  height: 26px;
  padding: 0 10px;
  border-radius: var(--aqb-radius-sm);
  border: none;
  font-size: var(--aqb-font-xs);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.1s;
}
.bulk-btn--del {
  background: color-mix(in srgb, var(--media-vid) 15%, transparent);
  color: var(--media-vid);
}
.bulk-btn--del:hover {
  background: color-mix(in srgb, var(--media-vid) 25%, transparent);
}
.bulk-btn--cancel {
  background: var(--aqb-surface-2);
  color: var(--aqb-text-secondary);
}

/* -- Upload Zone --------------------------------------------------- */
.upload-zone {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  border-top: 1px solid var(--aqb-border);
  flex-shrink: 0;
}
.upload-btn {
  width: 100%;
  height: 32px;
  border: 1px dashed var(--aqb-border-active);
  border-radius: var(--aqb-radius-sm);
  background: transparent;
  color: var(--aqb-accent-primary);
  font-size: var(--aqb-font-xs);
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.12s;
}
.upload-btn:hover {
  background: color-mix(in srgb, var(--aqb-accent-primary) 8%, transparent);
}
.storage-bar-wrap {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.storage-bar-track {
  height: 3px;
  border-radius: 2px;
  background: var(--aqb-border);
  overflow: hidden;
}
.storage-bar-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--aqb-accent-primary);
  transition: width 0.3s;
}
.storage-bar-label {
  font-size: 10px;
  color: var(--aqb-text-tertiary);
  text-align: right;
}

/* -- Context Menu -------------------------------------------------- */
.media-ctx {
  position: fixed;
  z-index: 9000;
  min-width: 160px;
  padding: 4px;
  background: var(--aqb-surface-2);
  border: 1px solid var(--aqb-border);
  border-radius: var(--aqb-radius-md);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
}
.media-ctx-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: var(--aqb-radius-sm);
  border: none;
  width: 100%;
  background: transparent;
  color: var(--aqb-text-primary);
  font-size: var(--aqb-font-sm);
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
}
.media-ctx-item:hover {
  background: var(--aqb-surface-3);
}
.media-ctx-item--danger {
  color: var(--media-vid);
}
.media-ctx-item--danger:hover {
  background: color-mix(in srgb, var(--media-vid) 10%, transparent);
}
.media-ctx-sep {
  height: 1px;
  background: var(--aqb-border);
  margin: 4px 0;
}

/* -- Detail Overlay ------------------------------------------------ */
.media-detail-overlay {
  position: absolute;
  inset: 0;
  background: var(--aqb-surface-2);
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.media-detail-preview {
  flex-shrink: 0;
  height: 180px;
  background: var(--aqb-surface-3);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.media-detail-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.media-detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}
.media-detail-name-input {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--aqb-border);
  color: var(--aqb-text-primary);
  font-size: var(--aqb-font-md);
  font-weight: 600;
  padding: 4px 0;
  margin-bottom: 12px;
  box-sizing: border-box;
}
.media-detail-name-input:focus {
  outline: none;
  border-color: var(--aqb-accent-primary);
}
.media-detail-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.media-detail-row {
  display: flex;
  justify-content: space-between;
  font-size: var(--aqb-font-xs);
}
.media-detail-label {
  color: var(--aqb-text-tertiary);
}
.media-detail-val {
  color: var(--aqb-text-secondary);
}
.media-detail-insert {
  width: 100%;
  height: 32px;
  margin-top: 12px;
  border-radius: var(--aqb-radius-sm);
  border: none;
  background: var(--aqb-accent-primary);
  color: white;
  font-size: var(--aqb-font-sm);
  font-weight: 500;
  cursor: pointer;
}

/* -- Discovery: header + search ------------------------------------ */
.disc-hdr {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 10px 6px;
  position: sticky;
  top: 0;
  z-index: 8;
  background: var(--aqb-surface-2);
}
.disc-section-label {
  font-size: var(--aqb-font-xs);
  font-weight: 600;
  color: var(--aqb-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  flex: 1;
}
.disc-search {
  flex: 1;
  height: 26px;
  padding: 0 8px;
  border: 1px solid var(--aqb-border);
  border-radius: var(--aqb-radius-sm);
  background: var(--aqb-surface-3);
  color: var(--aqb-text-primary);
  font-size: var(--aqb-font-xs);
}
.disc-search:focus {
  outline: none;
  border-color: var(--aqb-border-active);
}

/* -- Discovery: stock photo grid ----------------------------------- */
.disc-photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3px;
  padding: 0 10px 8px;
}
.disc-photo-card {
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: var(--aqb-radius-sm);
  overflow: hidden;
  cursor: pointer;
  background: var(--aqb-surface-3);
}
.disc-photo-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.disc-img-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0);
  transition: background 0.15s;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 4px;
  gap: 4px;
}
.disc-photo-card:hover .disc-img-overlay {
  background: rgba(0, 0, 0, 0.3);
}

/* Heart save buttons on stock cards */
.imc-save,
.vc-save {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  color: rgba(255, 255, 255, 0.45);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  flex-shrink: 0;
  transition: all 0.12s;
}
.imc-save:hover,
.vc-save:hover {
  background: rgba(239, 64, 96, 0.55);
  color: #fff;
}
.imc-save.saved,
.vc-save.saved {
  background: rgba(239, 64, 96, 0.2);
  color: rgba(239, 64, 96, 0.9);
}

.disc-load-more {
  width: calc(100% - 20px);
  margin: 4px 10px 8px;
  height: 28px;
  border: 1px solid var(--aqb-border);
  border-radius: var(--aqb-radius-sm);
  background: transparent;
  color: var(--aqb-text-secondary);
  font-size: var(--aqb-font-xs);
  cursor: pointer;
  transition: all 0.1s;
}
.disc-load-more:hover {
  background: var(--aqb-surface-3);
  color: var(--aqb-text-primary);
}
.disc-empty {
  padding: 24px 10px;
  text-align: center;
  color: var(--aqb-text-tertiary);
  font-size: var(--aqb-font-xs);
}

/* -- Tip Footer ---------------------------------------------------- */
.media-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-top: 1px solid var(--aqb-border);
  flex-shrink: 0;
}
.media-tip-text {
  flex: 1;
  font-size: 10px;
  color: var(--aqb-text-tertiary);
  line-height: 1.4;
}
.media-tip-dismiss {
  background: none;
  border: none;
  color: var(--aqb-text-tertiary);
  font-size: 12px;
  cursor: pointer;
  padding: 2px;
  flex-shrink: 0;
}

/* -- Empty state --------------------------------------------------- */
.media-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
  gap: 8px;
}
.media-empty-title {
  font-size: var(--aqb-font-sm);
  font-weight: 600;
  color: var(--aqb-text-secondary);
}
.media-empty-sub {
  font-size: var(--aqb-font-xs);
  color: var(--aqb-text-tertiary);
  line-height: 1.5;
}

/* -- Loading ------------------------------------------------------- */
.media-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: var(--aqb-text-tertiary);
  font-size: var(--aqb-font-xs);
}

/* -- Reduced motion ------------------------------------------------ */
@media (prefers-reduced-motion: reduce) {
  .upload-ghost-progress,
  .source-btn,
  .tpill,
  .img-card-overlay {
    transition: none;
  }
}
```

**Step 3: TypeScript check + commit**

```bash
npx tsc --noEmit 2>&1 | head -10
git add src/editor/sidebar/LeftSidebar.css src/editor/sidebar/tabs/media/media.css
git commit -m "feat(media): add media.css + --media-* vars to LeftSidebar.css"
```

---

## Task 6: `useMediaState.ts` — SSOT State Hook

**Files:**

- Create: `src/editor/sidebar/tabs/media/useMediaState.ts`

**Step 1: Write the hook**

This is the ONLY place all state lives. No child calls `composer.media` directly.

```typescript
/**
 * useMediaState — SSOT state hook for Media Tab
 * ALL state and actions live here. Children receive typed prop slices only.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import { MEDIA_EVENTS } from "../../../../shared/constants/media";
import type {
  MediaStateResult,
  MediaSource,
  MediaTypeFilter,
  LibraryItem,
  TypeCounts,
  CtxMenuState,
  StockPhoto,
  StockVideo,
  DiscIcon,
  DiscFont,
} from "./mediaTypes";
import type { MediaSortBy, SortDirection, UploadProgress } from "./mediaTypes";
import {
  toLibraryItem,
  filterByType,
  filterBySearch,
  filterByFmt,
  countByType,
} from "./mediaUtils";
import { STORAGE_TOTAL_BYTES } from "./mediaData";

export function useMediaState(composer: Composer | null): MediaStateResult {
  // --- Navigation ---
  const [source, setSourceRaw] = React.useState<MediaSource>("mine");
  const [activeType, setType] = React.useState<MediaTypeFilter>("all");

  // --- Library ---
  const [rawItems, setRawItems] = React.useState<LibraryItem[]>([]);
  const [uploadQueue, setUploadQueue] = React.useState<UploadProgress[]>([]);
  const [sort, setSortField] = React.useState<MediaSortBy>("date");
  const [sortDir, setSortDir] = React.useState<SortDirection>("desc");
  const [gridN, setGridN] = React.useState<2 | 3 | 4>(3);
  const [fmtFilter, setFmtFilter] = React.useState("");
  const [selMode, setSelMode] = React.useState(false);
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set());
  const [searchQuery, setSearch] = React.useState("");

  // --- Discovery ---
  const [stockPhotos, setStockPhotos] = React.useState<StockPhoto[]>([]);
  const [stockVideos, setStockVideos] = React.useState<StockVideo[]>([]);
  const [discIcons, setDiscIcons] = React.useState<DiscIcon[]>([]);
  const [discFonts, setDiscFonts] = React.useState<DiscFont[]>([]);
  const [discLoading, setDiscLoading] = React.useState<
    Record<"img" | "vid" | "ico" | "fnt", boolean>
  >({ img: false, vid: false, ico: false, fnt: false });

  // --- Overlays ---
  const [ctxMenu, setCtxMenu] = React.useState<CtxMenuState | null>(null);
  const [detailItem, setDetailItem] = React.useState<LibraryItem | null>(null);

  // --- Tips ---
  const [tipIdx] = React.useState(0);
  const [tipDismissed, setTipDismissed] = React.useState(
    () => localStorage.getItem("aqb:media:tips") === "dismissed"
  );

  // --- Load library on mount ---
  React.useEffect(() => {
    if (!composer?.media) return;
    setRawItems(composer.media.getAssets().map(toLibraryItem));

    const refresh = () => setRawItems(composer.media!.getAssets().map(toLibraryItem));
    const onProgress = (p: UploadProgress) => {
      setUploadQueue((q) => {
        const idx = q.findIndex((u) => u.fileName === p.fileName);
        const next = idx >= 0 ? [...q.slice(0, idx), p, ...q.slice(idx + 1)] : [...q, p];
        if (p.status === "complete" || p.status === "error") {
          setTimeout(
            () => setUploadQueue((qq) => qq.filter((u) => u.fileName !== p.fileName)),
            800
          );
        }
        return next;
      });
    };

    composer.media.on(MEDIA_EVENTS.MEDIA_ADDED, refresh);
    composer.media.on(MEDIA_EVENTS.MEDIA_UPDATED, refresh);
    composer.media.on(MEDIA_EVENTS.MEDIA_DELETED, refresh);
    composer.media.on(MEDIA_EVENTS.UPLOAD_PROGRESS, onProgress);

    return () => {
      composer.media!.off(MEDIA_EVENTS.MEDIA_ADDED, refresh);
      composer.media!.off(MEDIA_EVENTS.MEDIA_UPDATED, refresh);
      composer.media!.off(MEDIA_EVENTS.MEDIA_DELETED, refresh);
      composer.media!.off(MEDIA_EVENTS.UPLOAD_PROGRESS, onProgress);
    };
  }, [composer]);

  // --- Derived: filtered library items ---
  const libraryItems = React.useMemo(
    () => filterByFmt(filterBySearch(rawItems, searchQuery), fmtFilter),
    [rawItems, searchQuery, fmtFilter]
  );

  const counts: TypeCounts = React.useMemo(() => countByType(libraryItems), [libraryItems]);

  const storage = React.useMemo(
    () => ({
      used: rawItems.reduce((acc, i) => acc + i.size, 0),
      total: STORAGE_TOTAL_BYTES,
    }),
    [rawItems]
  );

  // --- Actions ---
  const upload = React.useCallback(
    (files: File[]) => {
      if (!composer?.media) return;
      files.forEach((f) => void composer.media!.uploadFile(f));
    },
    [composer]
  );

  const deleteItem = React.useCallback(
    (key: string) => {
      if (!composer?.media) return;
      void composer.media.deleteAsset(key);
    },
    [composer]
  );

  const bulkDelete = React.useCallback(() => {
    if (!composer?.media) return;
    selectedKeys.forEach((k) => void composer.media!.deleteAsset(k));
    setSelectedKeys(new Set());
    setSelMode(false);
  }, [composer, selectedKeys]);

  const insertToCanvas = React.useCallback(
    (key: string) => {
      const item = rawItems.find((i) => i.key === key);
      if (!item || !composer?.elements) return;
      composer.elements.insertMediaAsset?.(key, item.src);
    },
    [composer, rawItems]
  );

  const renameItem = React.useCallback(
    (key: string, name: string) => {
      if (!composer?.media) return;
      void composer.media.updateAsset(key, { name });
    },
    [composer]
  );

  const toggleSelect = React.useCallback((key: string) => {
    setSelectedKeys((s) => {
      const next = new Set(s);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const selectAll = React.useCallback(() => {
    const visible = filterByType(libraryItems, activeType);
    setSelectedKeys(new Set(visible.map((i) => i.key)));
  }, [libraryItems, activeType]);

  const toggleSelMode = React.useCallback(() => {
    setSelMode((v) => !v);
    setSelectedKeys(new Set());
  }, []);

  // --- Discovery actions ---
  const discSearchAll = React.useCallback(
    (query: string) => {
      if (!composer?.media) return;
      setDiscLoading({ img: true, vid: true, ico: true, fnt: true });
      void Promise.all([
        composer.media.searchStock("img", query).then((r) => setStockPhotos(r as StockPhoto[])),
        composer.media.searchStock("vid", query).then((r) => setStockVideos(r as StockVideo[])),
        Promise.resolve(composer.media.getIcons()).then(setDiscIcons),
        composer.media.getFonts(query).then(setDiscFonts),
      ]).finally(() => setDiscLoading({ img: false, vid: false, ico: false, fnt: false }));
    },
    [composer]
  );

  const loadMoreDisc = React.useCallback((_type: "img" | "vid") => {
    // stub — no-op until pagination is wired
  }, []);

  const saveToLibrary = React.useCallback(
    (_type: "img" | "vid", _item: StockPhoto | StockVideo) => {
      // stub — wire to real download + upload flow later
    },
    []
  );

  // --- Source change ---
  const setSource = React.useCallback(
    (src: MediaSource) => {
      setSourceRaw(src);
      setType("all");
      if (src === "disc") discSearchAll(searchQuery);
    },
    [discSearchAll, searchQuery]
  );

  // --- Tips ---
  const dismissTips = React.useCallback(() => {
    localStorage.setItem("aqb:media:tips", "dismissed");
    setTipDismissed(true);
  }, []);

  // --- Context menu ---
  const openCtxMenu = React.useCallback((e: React.MouseEvent, item: LibraryItem) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, item });
  }, []);
  const closeCtxMenu = React.useCallback(() => setCtxMenu(null), []);

  // --- Detail ---
  const openDetail = React.useCallback((item: LibraryItem) => setDetailItem(item), []);
  const closeDetail = React.useCallback(() => setDetailItem(null), []);

  return {
    source,
    activeType,
    setSource,
    setType,
    libraryItems,
    uploadQueue,
    counts,
    sort,
    sortDir,
    gridN,
    fmtFilter,
    selMode,
    selectedKeys,
    setSort: (by, dir) => {
      setSortField(by);
      setSortDir(dir);
    },
    setGridN,
    setFmtFilter,
    toggleSelMode,
    toggleSelect,
    selectAll,
    upload,
    deleteItem,
    bulkDelete,
    insertToCanvas,
    renameItem,
    stockPhotos,
    stockVideos,
    discIcons,
    discFonts,
    discLoading,
    discSearchAll,
    loadMoreDisc,
    saveToLibrary,
    searchQuery,
    setSearch,
    storage,
    ctxMenu,
    openCtxMenu,
    closeCtxMenu,
    detailItem,
    openDetail,
    closeDetail,
    tipIdx,
    tipDismissed,
    dismissTips,
  };
}
```

**Step 2: TypeScript check + commit**

```bash
npx tsc --noEmit 2>&1 | head -20
git add src/editor/sidebar/tabs/media/useMediaState.ts
git commit -m "feat(media): add useMediaState.ts — SSOT hook"
```

---

## Task 7: `TypePills.tsx`

**Files:**

- Create: `src/editor/sidebar/tabs/media/TypePills.tsx`

**Step 1: Write the component**

```typescript
/**
 * TypePills — Shared type filter pills (Library + Discovery)
 * @license BSD-3-Clause
 */

import * as React from "react";
import "./media.css";
import type { TypePillsProps } from "./mediaTypes";
import { TYPE_PILLS } from "./mediaData";

export const TypePills: React.FC<TypePillsProps> = ({
  activeType, counts, discMode, onTypeChange,
}) => (
  <div className={`type-pills${discMode ? " disc-mode" : ""}`}>
    {TYPE_PILLS.map((p) => (
      <button
        key={p.id}
        type="button"
        className={`tpill${activeType === p.id ? " active" : ""}`}
        onClick={() => onTypeChange(p.id)}
      >
        {p.label}
        {counts[p.id] > 0 && (
          <span className="tpill-cnt">{counts[p.id]}</span>
        )}
      </button>
    ))}
  </div>
);
```

**Step 2: Commit**

```bash
npx tsc --noEmit 2>&1 | head -10
git add src/editor/sidebar/tabs/media/TypePills.tsx
git commit -m "feat(media): add TypePills.tsx"
```

---

## Task 8: `UploadZone.tsx`

**Files:**

- Create: `src/editor/sidebar/tabs/media/UploadZone.tsx`

**Step 1: Write the component**

```typescript
/**
 * UploadZone — Upload button + storage bar
 * Visible in Library only (MediaTab hides in Discovery).
 * @license BSD-3-Clause
 */

import * as React from "react";
import "./media.css";
import type { UploadZoneProps } from "./mediaTypes";
import { fmtSize } from "./mediaUtils";
import { STORAGE_TOTAL_BYTES } from "./mediaData";

export const UploadZone: React.FC<UploadZoneProps> = ({ storage, onUpload, uploadQueue }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const pct = Math.min(100, (storage.used / storage.total) * 100);
  const active = uploadQueue.filter((u) => u.status === "uploading" || u.status === "processing");

  return (
    <div className="upload-zone">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.ttf,.otf,.woff,.woff2,.svg"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files) onUpload(Array.from(e.target.files));
          e.target.value = "";
        }}
      />
      <button
        type="button"
        className="upload-btn"
        onClick={() => inputRef.current?.click()}
      >
        ↑ Upload files
        {active.length > 0 && ` (${active.length} uploading…)`}
      </button>

      <div className="storage-bar-wrap">
        <div className="storage-bar-track">
          <div className="storage-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="storage-bar-label">
          {fmtSize(storage.used)} / {fmtSize(STORAGE_TOTAL_BYTES)} used
        </div>
      </div>
    </div>
  );
};
```

**Step 2: Commit**

```bash
npx tsc --noEmit 2>&1 | head -10
git add src/editor/sidebar/tabs/media/UploadZone.tsx
git commit -m "feat(media): add UploadZone.tsx"
```

---

## Task 9: `LibraryView.tsx`

**Files:**

- Create: `src/editor/sidebar/tabs/media/LibraryView.tsx`

The 4 type sections are **inline render functions** inside this file — NOT exported components. This avoids pass-through wrappers (anti-pattern from design spec).

**Step 1: Write the component**

```typescript
/**
 * LibraryView — My Library view
 * 4 sections rendered inline as local functions. None are exported.
 * @license BSD-3-Clause
 */

import * as React from "react";
import "./media.css";
import type { LibraryViewProps, LibraryItem } from "./mediaTypes";
import { filterByType } from "./mediaUtils";
import { fmtSize, fmtDur } from "./mediaUtils";
import { SORT_OPTIONS, GRID_OPTIONS, EMPTY_MSGS } from "./mediaData";

// ---- Internal section renderers (NOT exported) -------------------------

type SectionImgProps = {
  items: LibraryItem[]; gridN: 2|3|4; selMode: boolean; selectedKeys: Set<string>;
  onSelect(k:string):void; onCtxMenu(e:React.MouseEvent,i:LibraryItem):void; onDetail(i:LibraryItem):void;
};
function ImageSection({ items, gridN, selMode, selectedKeys, onSelect, onCtxMenu, onDetail }: SectionImgProps) {
  if (!items.length) return null;
  return (
    <>
      <div className="lib-section-hdr">
        <span className="lib-section-label">Images</span>
        <span className="lib-section-count">{items.length}</span>
      </div>
      <div className="img-grid" style={{ "--grid-n": gridN } as React.CSSProperties}>
        {items.map((item) => (
          <div
            key={item.key}
            className={`img-card${selectedKeys.has(item.key) ? " selected" : ""}`}
            onClick={() => selMode ? onSelect(item.key) : onDetail(item)}
            onContextMenu={(e) => onCtxMenu(e, item)}
            title={item.name}
          >
            <img src={item.thumb ?? item.src} alt={item.name} loading="lazy" />
            <div className="img-card-overlay">
              <span className="img-card-name">{item.name}</span>
            </div>
            {selectedKeys.has(item.key) && <div className="img-card-check">✓</div>}
          </div>
        ))}
      </div>
    </>
  );
}

type SectionVidProps = {
  items: LibraryItem[]; selMode: boolean; selectedKeys: Set<string>;
  onSelect(k:string):void; onCtxMenu(e:React.MouseEvent,i:LibraryItem):void; onDetail(i:LibraryItem):void;
};
function VideoSection({ items, selMode, selectedKeys, onSelect, onCtxMenu, onDetail }: SectionVidProps) {
  if (!items.length) return null;
  return (
    <>
      <div className="lib-section-hdr">
        <span className="lib-section-label">Videos</span>
        <span className="lib-section-count">{items.length}</span>
      </div>
      <div className="vid-grid">
        {items.map((item) => (
          <div
            key={item.key}
            className="vid-card"
            onClick={() => selMode ? onSelect(item.key) : onDetail(item)}
            onContextMenu={(e) => onCtxMenu(e, item)}
          >
            <div className="vid-thumb">
              {item.thumb && <img src={item.thumb} alt={item.name} loading="lazy" />}
              {item.duration != null && <div className="vid-dur">{fmtDur(item.duration)}</div>}
            </div>
            <div className="vid-info">
              <div className="vid-name">{item.name}</div>
              <div className="vid-meta">{fmtSize(item.size)}</div>
            </div>
            <div className="vid-type-dot" />
          </div>
        ))}
      </div>
    </>
  );
}

type SectionIcoProps = {
  items: LibraryItem[]; selMode: boolean; selectedKeys: Set<string>;
  onSelect(k:string):void; onInsert(k:string):void; onCtxMenu(e:React.MouseEvent,i:LibraryItem):void;
};
function IconSection({ items, selMode, selectedKeys, onSelect, onInsert, onCtxMenu }: SectionIcoProps) {
  if (!items.length) return null;
  return (
    <>
      <div className="lib-section-hdr">
        <span className="lib-section-label">Icons</span>
        <span className="lib-section-count">{items.length}</span>
      </div>
      <div className="ico-grid">
        {items.map((item) => (
          <div
            key={item.key}
            className={`ico-card${selectedKeys.has(item.key) ? " selected" : ""}`}
            onClick={() => selMode ? onSelect(item.key) : onInsert(item.key)}
            onContextMenu={(e) => onCtxMenu(e, item)}
            title={item.name}
          >
            {item.src.startsWith("data:image/svg") || item.src.endsWith(".svg") ? (
              <img src={item.src} alt={item.name} />
            ) : (
              <span style={{ fontSize: 16 }}>◆</span>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

type SectionFntProps = {
  items: LibraryItem[];
  onInsert(k:string):void; onCtxMenu(e:React.MouseEvent,i:LibraryItem):void;
};
function FontSection({ items, onInsert, onCtxMenu }: SectionFntProps) {
  if (!items.length) return null;
  return (
    <>
      <div className="lib-section-hdr">
        <span className="lib-section-label">Fonts</span>
        <span className="lib-section-count">{items.length}</span>
      </div>
      <div className="fnt-list">
        {items.map((item) => (
          <div
            key={item.key}
            className="fnt-row"
            onClick={() => onInsert(item.key)}
            onContextMenu={(e) => onCtxMenu(e, item)}
          >
            <div className="fnt-dot" />
            <div className="fnt-name">{item.name}</div>
            <div className="fnt-preview" style={{ fontFamily: item.name }}>Aa</div>
          </div>
        ))}
      </div>
    </>
  );
}

// ---- Exported LibraryView ---------------------------------------------

export function LibraryView({
  items, uploadQueue, activeType, gridN, fmtFilter,
  selMode, selectedKeys, sort, sortDir,
  onSort, onGridN, onFmt, onSelToggle, onSelect, onSelectAll, onBulkDelete,
  onDelete, onInsert, onRename, onCtxMenu, onDetail,
}: LibraryViewProps) {
  const filtered = filterByType(items, activeType);
  const imgItems = filtered.filter((i) => i.type === "img");
  const vidItems = filtered.filter((i) => i.type === "vid");
  const icoItems = filtered.filter((i) => i.type === "ico");
  const fntItems = filtered.filter((i) => i.type === "fnt");
  const isEmpty = filtered.length === 0 && uploadQueue.length === 0;

  // Suppress unused warnings for onDelete / onRename
  void onDelete; void onRename;

  return (
    <>
      {/* Toolbar */}
      <div className="lib-toolbar">
        <select
          className="ltb-select"
          value={`${sort}-${sortDir}`}
          onChange={(e) => {
            const [by, dir] = e.target.value.split("-") as [typeof sort, typeof sortDir];
            onSort(by, dir);
          }}
        >
          {SORT_OPTIONS.map((o) => (
            <React.Fragment key={o.value}>
              <option value={`${o.value}-desc`}>{o.label} ↓</option>
              <option value={`${o.value}-asc`}>{o.label} ↑</option>
            </React.Fragment>
          ))}
        </select>

        {activeType === "img" && (
          <select className="ltb-select" value={fmtFilter} onChange={(e) => onFmt(e.target.value)}>
            <option value="">All formats</option>
            {["jpeg","png","webp","gif","svg","avif"].map((f) => (
              <option key={f} value={f}>{f.toUpperCase()}</option>
            ))}
          </select>
        )}

        <div className="lib-toolbar-spacer" />

        {(activeType === "all" || activeType === "img") && GRID_OPTIONS.map(({ n }) => (
          <button
            key={n}
            type="button"
            className={`ltb-btn${gridN === n ? " active" : ""}`}
            onClick={() => onGridN(n)}
            title={`${n} columns`}
          >
            {n}
          </button>
        ))}

        <button
          type="button"
          className={`ltb-btn${selMode ? " active" : ""}`}
          onClick={onSelToggle}
          title="Select mode"
        >
          ✦
        </button>
      </div>

      {/* Bulk bar */}
      {selMode && (
        <div className="bulk-bar">
          <span className="bulk-bar-count">{selectedKeys.size} selected</span>
          <button type="button" className="ltb-btn" onClick={onSelectAll}>All</button>
          {selectedKeys.size > 0 && (
            <button type="button" className="bulk-btn bulk-btn--del" onClick={onBulkDelete}>
              Delete {selectedKeys.size}
            </button>
          )}
          <button type="button" className="bulk-btn bulk-btn--cancel" onClick={onSelToggle}>
            Cancel
          </button>
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="media-empty">
          <div className="media-empty-title">{EMPTY_MSGS[activeType].title}</div>
          <div className="media-empty-sub">{EMPTY_MSGS[activeType].sub}</div>
        </div>
      )}

      {/* Upload ghosts */}
      {uploadQueue.length > 0 && (
        <div className="img-grid" style={{ "--grid-n": gridN } as React.CSSProperties}>
          {uploadQueue.map((u) => (
            <div key={u.fileName} className="img-card uploading">
              <div className="upload-ghost-progress" style={{ width: `${u.progress}%` }} />
            </div>
          ))}
        </div>
      )}

      <ImageSection
        items={imgItems} gridN={gridN} selMode={selMode} selectedKeys={selectedKeys}
        onSelect={onSelect} onCtxMenu={onCtxMenu} onDetail={onDetail}
      />
      <VideoSection
        items={vidItems} selMode={selMode} selectedKeys={selectedKeys}
        onSelect={onSelect} onCtxMenu={onCtxMenu} onDetail={onDetail}
      />
      <IconSection
        items={icoItems} selMode={selMode} selectedKeys={selectedKeys}
        onSelect={onSelect} onInsert={onInsert} onCtxMenu={onCtxMenu}
      />
      <FontSection items={fntItems} onInsert={onInsert} onCtxMenu={onCtxMenu} />
    </>
  );
}
```

**Step 2: TypeScript check + commit**

```bash
npx tsc --noEmit 2>&1 | head -20
git add src/editor/sidebar/tabs/media/LibraryView.tsx
git commit -m "feat(media): add LibraryView.tsx — 4 inline sections"
```

---

## Task 10: `DiscoveryView.tsx`

**Files:**

- Create: `src/editor/sidebar/tabs/media/DiscoveryView.tsx`

Icons are rendered as `<img src={svgDataUrl}>` — safe, no XSS risk.

**Step 1: Write the component**

```typescript
/**
 * DiscoveryView — Stock media discovery
 * Shows Photos/Videos/Icons/Fonts filtered by activeType.
 * @license BSD-3-Clause
 */

import * as React from "react";
import "./media.css";
import type { DiscoveryViewProps, StockPhoto, StockVideo } from "./mediaTypes";
import { DISC_SECTION_LABELS } from "./mediaData";

export function DiscoveryView({
  activeType, photos, videos, icons, fonts, loading,
  searchQuery, onSearch, onLoadMore, onSave, onInsert,
}: DiscoveryViewProps) {
  const show = (t: "img"|"vid"|"ico"|"fnt") => activeType === "all" || activeType === t;

  return (
    <>
      {/* Search */}
      <div className="disc-hdr">
        <input
          type="text"
          className="disc-search"
          placeholder="Search free media…"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      {/* Photos */}
      {show("img") && (
        <>
          <div className="lib-section-hdr">
            <span className="lib-section-label">{DISC_SECTION_LABELS.img}</span>
          </div>
          {loading.img ? (
            <div className="media-loading">Loading…</div>
          ) : photos.length === 0 ? (
            <div className="disc-empty">Search for free photos above</div>
          ) : (
            <>
              <div className="disc-photo-grid">
                {photos.map((p) => (
                  <div key={p.id} className="disc-photo-card" onClick={() => onInsert(p.url)}>
                    <img src={p.thumb} alt={p.alt} loading="lazy" />
                    <div className="disc-img-overlay">
                      <button
                        type="button"
                        className="imc-save"
                        title="Save to My Library"
                        onClick={(e) => { e.stopPropagation(); onSave("img", p); }}
                      >
                        ♥
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" className="disc-load-more" onClick={() => onLoadMore("img")}>
                Load more photos
              </button>
            </>
          )}
        </>
      )}

      {/* Videos */}
      {show("vid") && (
        <>
          <div className="lib-section-hdr">
            <span className="lib-section-label">{DISC_SECTION_LABELS.vid}</span>
          </div>
          {loading.vid ? (
            <div className="media-loading">Loading…</div>
          ) : videos.length === 0 ? (
            <div className="disc-empty">Search for free videos above</div>
          ) : (
            <>
              <div className="vid-grid" style={{ padding: "0 10px 8px" }}>
                {videos.map((v) => (
                  <div key={v.id} className="vid-card" onClick={() => onInsert(v.url)}>
                    <div className="vid-thumb">
                      <img src={v.thumb} alt="video thumbnail" loading="lazy" />
                    </div>
                    <div className="vid-info">
                      <div className="vid-name">{v.author}</div>
                      <div className="vid-meta">Pexels</div>
                    </div>
                    <button
                      type="button"
                      className="vc-save"
                      title="Save to My Library"
                      onClick={(e) => { e.stopPropagation(); onSave("vid", v); }}
                    >
                      ♥
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="disc-load-more" onClick={() => onLoadMore("vid")}>
                Load more videos
              </button>
            </>
          )}
        </>
      )}

      {/* Icons — rendered as <img src> (safe data URL) */}
      {show("ico") && (
        <>
          <div className="lib-section-hdr">
            <span className="lib-section-label">{DISC_SECTION_LABELS.ico}</span>
          </div>
          {loading.ico ? (
            <div className="media-loading">Loading…</div>
          ) : icons.length === 0 ? (
            <div className="disc-empty">Built-in icon library coming soon</div>
          ) : (
            <div className="ico-grid">
              {icons.map((ico) => (
                <div
                  key={ico.id}
                  className="ico-card"
                  title={ico.name}
                  onClick={() => onInsert(ico.name)}
                >
                  <img src={ico.svgDataUrl} alt={ico.name} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Fonts */}
      {show("fnt") && (
        <>
          <div className="lib-section-hdr">
            <span className="lib-section-label">{DISC_SECTION_LABELS.fnt}</span>
          </div>
          {loading.fnt ? (
            <div className="media-loading">Loading…</div>
          ) : fonts.length === 0 ? (
            <div className="disc-empty">Google Fonts search coming soon</div>
          ) : (
            <div className="fnt-list">
              {fonts.map((f) => (
                <div key={f.id} className="fnt-row" onClick={() => onInsert(f.family)}>
                  <div className="fnt-dot" />
                  <div className="fnt-name">{f.family}</div>
                  <div className="fnt-preview" style={{ fontFamily: f.family }}>Aa</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
```

**Step 2: TypeScript check + commit**

```bash
npx tsc --noEmit 2>&1 | head -10
git add src/editor/sidebar/tabs/media/DiscoveryView.tsx
git commit -m "feat(media): add DiscoveryView.tsx — stock photos/videos/icons/fonts"
```

---

## Task 11: `MediaTab.tsx` — Shell

**Files:**

- Create: `src/editor/sidebar/tabs/media/MediaTab.tsx`

```typescript
/**
 * MediaTab — Media panel shell
 * 5 fixed zones: PanelHeader | SourceBar | TypePills | Body | UploadZone+Tip
 * Layout only — all state from useMediaState.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import { PanelHeader } from "../../shared/PanelHeader";
import { useMediaState } from "./useMediaState";
import { TypePills } from "./TypePills";
import { LibraryView } from "./LibraryView";
import { DiscoveryView } from "./DiscoveryView";
import { UploadZone } from "./UploadZone";
import { MEDIA_TIPS } from "./mediaData";
import { fmtSize } from "./mediaUtils";
import "./media.css";

export interface MediaTabProps {
  composer: Composer | null;
  isPinned?: boolean;
  onPinToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
}

export function MediaTab({ composer, isPinned, onPinToggle, onHelpClick, onClose }: MediaTabProps) {
  const s = useMediaState(composer);

  // Close context menu on outside click
  React.useEffect(() => {
    if (!s.ctxMenu) return;
    const handler = () => s.closeCtxMenu();
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [s.ctxMenu, s.closeCtxMenu]);

  return (
    <div className="media-tab">
      {/* Zone 1: Panel Header */}
      <PanelHeader
        title="Media"
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />

      {/* Zone 2: Source Bar */}
      <div className="source-bar">
        {(["mine", "disc"] as const).map((src) => (
          <button
            key={src}
            type="button"
            className={`source-btn${s.source === src ? " active" : ""}`}
            onClick={() => s.setSource(src)}
          >
            {src === "mine" ? "My Library" : "Discovery"}
          </button>
        ))}
      </div>

      {/* Zone 3: Type Pills */}
      <TypePills
        activeType={s.activeType}
        counts={s.counts}
        discMode={s.source === "disc"}
        onTypeChange={s.setType}
      />

      {/* Shared search */}
      <div className="media-search">
        <span className="media-search-icon">⌕</span>
        <input
          type="text"
          className="media-search-input"
          placeholder={s.source === "mine" ? "Search library…" : "Search stock media…"}
          value={s.searchQuery}
          onChange={(e) => s.setSearch(e.target.value)}
        />
      </div>

      {/* Zone 4: Scrollable Body */}
      <div className="media-body">
        {s.source === "mine" ? (
          <LibraryView
            items={s.libraryItems}
            uploadQueue={s.uploadQueue}
            activeType={s.activeType}
            counts={s.counts}
            sort={s.sort}
            sortDir={s.sortDir}
            gridN={s.gridN}
            fmtFilter={s.fmtFilter}
            selMode={s.selMode}
            selectedKeys={s.selectedKeys}
            searchQuery={s.searchQuery}
            onSort={s.setSort}
            onGridN={s.setGridN}
            onFmt={s.setFmtFilter}
            onSelToggle={s.toggleSelMode}
            onSelect={s.toggleSelect}
            onSelectAll={s.selectAll}
            onBulkDelete={s.bulkDelete}
            onDelete={s.deleteItem}
            onInsert={s.insertToCanvas}
            onRename={s.renameItem}
            onCtxMenu={s.openCtxMenu}
            onDetail={s.openDetail}
          />
        ) : (
          <DiscoveryView
            activeType={s.activeType}
            photos={s.stockPhotos}
            videos={s.stockVideos}
            icons={s.discIcons}
            fonts={s.discFonts}
            loading={s.discLoading}
            searchQuery={s.searchQuery}
            onSearch={s.discSearchAll}
            onLoadMore={s.loadMoreDisc}
            onSave={s.saveToLibrary}
            onInsert={s.insertToCanvas}
          />
        )}

        {/* Detail overlay */}
        {s.detailItem && (
          <div className="media-detail-overlay">
            <PanelHeader title={s.detailItem.name} onClose={s.closeDetail} />
            <div className="media-detail-preview">
              {s.detailItem.type === "img" && (
                <img src={s.detailItem.src} alt={s.detailItem.name} />
              )}
            </div>
            <div className="media-detail-body">
              <input
                className="media-detail-name-input"
                defaultValue={s.detailItem.name}
                onBlur={(e) => s.renameItem(s.detailItem!.key, e.target.value)}
              />
              <div className="media-detail-meta">
                <div className="media-detail-row">
                  <span className="media-detail-label">Size</span>
                  <span className="media-detail-val">{fmtSize(s.detailItem.size)}</span>
                </div>
                {s.detailItem.width != null && (
                  <div className="media-detail-row">
                    <span className="media-detail-label">Dimensions</span>
                    <span className="media-detail-val">
                      {s.detailItem.width} × {s.detailItem.height}
                    </span>
                  </div>
                )}
                <div className="media-detail-row">
                  <span className="media-detail-label">Type</span>
                  <span className="media-detail-val">{s.detailItem.mimeType}</span>
                </div>
              </div>
              <button
                type="button"
                className="media-detail-insert"
                onClick={() => {
                  s.insertToCanvas(s.detailItem!.key);
                  s.closeDetail();
                }}
              >
                Insert to canvas
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Zone 5: Upload Zone (Library only) + Tip */}
      {s.source === "mine" && (
        <UploadZone storage={s.storage} onUpload={s.upload} uploadQueue={s.uploadQueue} />
      )}

      {!s.tipDismissed && (
        <div className="media-tip">
          <span className="media-tip-text">{MEDIA_TIPS[s.tipIdx % MEDIA_TIPS.length]}</span>
          <button type="button" className="media-tip-dismiss" onClick={s.dismissTips}>
            ×
          </button>
        </div>
      )}

      {/* Context menu */}
      {s.ctxMenu && (
        <div
          className="media-ctx"
          style={{ top: s.ctxMenu.y, left: s.ctxMenu.x }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="media-ctx-item"
            onClick={() => { s.insertToCanvas(s.ctxMenu!.item.key); s.closeCtxMenu(); }}
          >
            ↗ Insert to canvas
          </button>
          <button
            type="button"
            className="media-ctx-item"
            onClick={() => { void navigator.clipboard.writeText(s.ctxMenu!.item.name); s.closeCtxMenu(); }}
          >
            ⎘ Copy name
          </button>
          <button
            type="button"
            className="media-ctx-item"
            onClick={() => { s.openDetail(s.ctxMenu!.item); s.closeCtxMenu(); }}
          >
            ✎ Rename
          </button>
          <div className="media-ctx-sep" />
          <button
            type="button"
            className="media-ctx-item media-ctx-item--danger"
            onClick={() => { s.deleteItem(s.ctxMenu!.item.key); s.closeCtxMenu(); }}
          >
            ⌫ Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default MediaTab;
```

**Step 2: TypeScript check + commit**

```bash
npx tsc --noEmit 2>&1 | head -20
git add src/editor/sidebar/tabs/media/MediaTab.tsx
git commit -m "feat(media): add MediaTab.tsx — shell component"
```

---

## Task 12: Barrel + Wire TabRouter + Delete Old Files

**Files:**

- Create: `src/editor/sidebar/tabs/media/index.ts`
- Modify: `src/editor/sidebar/TabRouter.tsx`
- Delete: `src/editor/sidebar/tabs/MediaTab.tsx` + 11 old files in `tabs/media/`

**Step 1: Check remaining import references to old files**

```bash
grep -rn "from.*tabs/media\|from.*MediaTab\|from.*useMediaTabState\|from.*mediaIcons\|from.*MediaSubTabs" \
  /Users/shahg/Desktop/aquibra-opencode/packages/new-editor-l2/src \
  --include="*.tsx" --include="*.ts" | grep -v "tabs/media/"
```

Verify TabRouter.tsx is the only file importing `./tabs/MediaTab`.

**Step 2: Create new index.ts**

```typescript
/**
 * Media Tab barrel export
 * @license BSD-3-Clause
 */
export { MediaTab } from "./MediaTab";
export type { MediaTabProps } from "./MediaTab";
```

**Step 3: Update TabRouter.tsx line 21**

Change:

```typescript
const MediaTab = React.lazy(() => import("./tabs/MediaTab"));
```

To:

```typescript
const MediaTab = React.lazy(() => import("./tabs/media/MediaTab"));
```

**Step 4: Delete old top-level MediaTab.tsx**

```bash
rm /Users/shahg/Desktop/aquibra-opencode/packages/new-editor-l2/src/editor/sidebar/tabs/MediaTab.tsx
```

**Step 5: Delete all old files in tabs/media/ that are NOT the new files**

The old files (safe to delete — new files have different names or are replacements):

```bash
cd /Users/shahg/Desktop/aquibra-opencode/packages/new-editor-l2/src/editor/sidebar/tabs/media
rm -f MediaBulkBar.tsx MediaContextMenu.tsx MediaDetailPanel.tsx MediaGrid.tsx \
      MediaLightbox.tsx MediaSearchSort.tsx MediaStorageBar.tsx MediaSubTabs.tsx \
      MediaUploadZone.tsx mediaIcons.tsx useMediaTabState.ts
rm -rf styles/
```

Note: `mediaData.ts` is also replaced by the new version created in Task 4.

**Step 6: TypeScript check**

```bash
npx tsc --noEmit 2>&1
```

Expected: 0 errors.

**Step 7: Verify 11 files exactly**

```bash
ls /Users/shahg/Desktop/aquibra-opencode/packages/new-editor-l2/src/editor/sidebar/tabs/media/
```

Expected: `MediaTab.tsx  DiscoveryView.tsx  LibraryView.tsx  TypePills.tsx  UploadZone.tsx  index.ts  media.css  mediaData.ts  mediaTypes.ts  mediaUtils.ts  useMediaState.ts`

**Step 8: Commit**

```bash
git add -A src/editor/sidebar/tabs/
git commit -m "feat(media): wire new MediaTab, delete 13 old files — full replace complete"
```

---

## Task 13: Final Verification Pass

**Step 1: TypeScript clean**

```bash
npx tsc --noEmit 2>&1
```

Expected: 0 errors.

**Step 2: No dead old imports**

```bash
grep -rn "MediaSubTabs\|MediaBulkBar\|MediaContextMenu\|MediaDetailPanel\|MediaGrid\|MediaLightbox\|MediaSearchSort\|MediaStorageBar\|MediaUploadZone\|useMediaTabState\|mediaIcons" \
  src/ --include="*.tsx" --include="*.ts"
```

Expected: 0 results.

**Step 3: No `any` types**

```bash
grep -n ": any" \
  src/editor/sidebar/tabs/media/mediaTypes.ts \
  src/editor/sidebar/tabs/media/useMediaState.ts \
  src/editor/sidebar/tabs/media/MediaTab.tsx \
  src/editor/sidebar/tabs/media/LibraryView.tsx \
  src/editor/sidebar/tabs/media/DiscoveryView.tsx
```

Expected: 0 results.

**Step 4: No console.log**

```bash
grep -rn "console\." src/editor/sidebar/tabs/media/
```

Expected: 0 results.

**Step 5: File sizes**

```bash
wc -l src/editor/sidebar/tabs/media/*.ts src/editor/sidebar/tabs/media/*.tsx src/editor/sidebar/tabs/media/*.css
```

Expected: All under 500 lines.

**Step 6: Commit**

```bash
git add .
git commit -m "chore(media): verification pass — TypeScript clean, no dead code"
```

---

## Manual Verification Checklist

- [ ] `npx tsc --noEmit` — zero TypeScript errors
- [ ] `J` shortcut opens Media tab (registered in `tabsConfig.ts` as `"assets"` tab)
- [ ] My Library shows empty state when no assets
- [ ] Upload file → ghost progress card → completes → file appears in grid
- [ ] Type pills filter sections in Library (Images / Videos / Icons / Fonts)
- [ ] Switch to Discovery → type pill counts hidden
- [ ] Discovery search input visible with no jump nav
- [ ] Context menu: right-click → Insert / Copy name / Rename / Delete
- [ ] Detail overlay: click image → name editable → Insert button works
- [ ] Select mode → multi-select → bulk delete
- [ ] `git status` — no untracked files in `tabs/media/`
- [ ] File count in `tabs/media/`: exactly 11

---

## Final File Inventory

```
CREATED (11 files):
  src/editor/sidebar/tabs/media/MediaTab.tsx
  src/editor/sidebar/tabs/media/useMediaState.ts
  src/editor/sidebar/tabs/media/LibraryView.tsx
  src/editor/sidebar/tabs/media/DiscoveryView.tsx
  src/editor/sidebar/tabs/media/TypePills.tsx
  src/editor/sidebar/tabs/media/UploadZone.tsx
  src/editor/sidebar/tabs/media/mediaTypes.ts
  src/editor/sidebar/tabs/media/mediaData.ts
  src/editor/sidebar/tabs/media/mediaUtils.ts
  src/editor/sidebar/tabs/media/media.css
  src/editor/sidebar/tabs/media/index.ts

MODIFIED:
  src/shared/types/media.ts           (add "font" to MediaAssetType)
  src/engine/media/MediaManager.ts    (3 stub methods + 4 interfaces)
  src/editor/sidebar/TabRouter.tsx    (update import path)
  src/editor/sidebar/LeftSidebar.css  (add --media-* vars)

DELETED (13 files):
  src/editor/sidebar/tabs/MediaTab.tsx         (old top-level shell)
  src/editor/sidebar/tabs/media/MediaBulkBar.tsx
  src/editor/sidebar/tabs/media/MediaContextMenu.tsx
  src/editor/sidebar/tabs/media/MediaDetailPanel.tsx
  src/editor/sidebar/tabs/media/MediaGrid.tsx
  src/editor/sidebar/tabs/media/MediaLightbox.tsx
  src/editor/sidebar/tabs/media/MediaSearchSort.tsx
  src/editor/sidebar/tabs/media/MediaStorageBar.tsx
  src/editor/sidebar/tabs/media/MediaSubTabs.tsx
  src/editor/sidebar/tabs/media/MediaUploadZone.tsx
  src/editor/sidebar/tabs/media/mediaIcons.tsx
  src/editor/sidebar/tabs/media/useMediaTabState.ts
  src/editor/sidebar/tabs/media/styles/        (folder)
```

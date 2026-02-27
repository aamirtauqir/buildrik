/**
 * Media Tab UI Types
 * @license BSD-3-Clause
 */

import type * as React from "react";
import type {
  StockPhoto,
  StockVideo,
  DiscIcon,
  DiscFont,
} from "../../../../engine/media/MediaManager";
import type { MediaSortBy, SortDirection, UploadProgress } from "../../../../shared/types/media";
import type { MediaAsset } from "../../../../shared/types/media";

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

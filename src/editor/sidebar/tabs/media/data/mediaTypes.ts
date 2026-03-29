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
} from "../../../../../engine/media/MediaManager";
import type { MediaSortBy, SortDirection, UploadProgress } from "../../../../../shared/types/media";
import type { MediaAsset } from "../../../../../shared/types/media";

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

// --- Delete confirmation ---

export interface ConfirmDeletePayload {
  keys: string[];
  names: string[];
  inUseCount: number;
  isBulk: boolean;
}

// --- Upload failure tracking ---

export interface FailedUpload {
  fileName: string;
  reason: string;
}

// --- Overlays ---

export interface CtxMenuState {
  x: number;
  y: number;
  item: LibraryItem;
}

// --- Sub-hook result interfaces ---

export interface LibraryStateResult {
  rawAssets: MediaAsset[];
  libraryItems: LibraryItem[];
  counts: TypeCounts;
  sort: MediaSortBy;
  sortDir: SortDirection;
  gridN: 2 | 3 | 4;
  fmtFilter: string;
  activeType: MediaTypeFilter;
  librarySearch: string;
  setLibrarySearch(q: string): void;
  setSort(by: MediaSortBy, dir: SortDirection): void;
  setGridN(n: 2 | 3 | 4): void;
  setFmtFilter(f: string): void;
  setActiveType(t: MediaTypeFilter): void;
  renameItem(key: string, name: string): Promise<void>;
}

export interface UploadStateResult {
  uploadQueue: UploadProgress[];
  failedUploads: FailedUpload[];
  storageUsed: number;
  panelDragOver: boolean;
  upload(files: File[]): void;
  dismissFailedUploads(): void;
  handlePanelDragEnter(e: React.DragEvent): void;
  handlePanelDragLeave(e: React.DragEvent): void;
  handlePanelDragOver(e: React.DragEvent): void;
  handlePanelDrop(e: React.DragEvent): void;
}

export interface SelectionStateResult {
  selMode: boolean;
  selectedKeys: Set<string>;
  confirmDelete: ConfirmDeletePayload | null;
  toggleSelMode(): void;
  toggleSelect(key: string): void;
  selectAll(allKeys: string[]): void;
  requestDelete(key: string): void;
  requestBulkDelete(items: LibraryItem[]): void;
  executeDelete(): Promise<void>;
  cancelDelete(): void;
}

export interface DiscoveryStateResult {
  stockPhotos: StockPhoto[];
  stockVideos: StockVideo[];
  discIcons: DiscIcon[];
  discFonts: DiscFont[];
  discLoading: Record<"img" | "vid" | "ico" | "fnt", boolean>;
  discoverySearch: string;
  isDiscoveryEmpty: boolean;
  setDiscoverySearch(q: string): void;
  discSearchAll(query: string): void;
  loadMoreDisc(type: "img" | "vid"): Promise<void>;
  saveToLibrary(type: "img" | "vid", item: StockPhoto | StockVideo): Promise<void>;
}

// --- Full state result (returned by useMediaState) ---

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
  failedUploads: FailedUpload[];
  dismissFailedUploads(): void;
  deleteItem(key: string): void;
  requestDelete(key: string): void;
  requestBulkDelete(items: LibraryItem[]): void;
  executeDelete(): Promise<void>;
  cancelDelete(): void;
  confirmDelete: ConfirmDeletePayload | null;
  insertToCanvas(key: string): void;
  renameItem(key: string, name: string): Promise<void>;

  // Panel drag
  panelDragOver: boolean;
  handlePanelDragEnter(e: React.DragEvent): void;
  handlePanelDragLeave(e: React.DragEvent): void;
  handlePanelDragOver(e: React.DragEvent): void;
  handlePanelDrop(e: React.DragEvent): void;

  // Discovery
  stockPhotos: StockPhoto[];
  stockVideos: StockVideo[];
  discIcons: DiscIcon[];
  discFonts: DiscFont[];
  discLoading: Record<"img" | "vid" | "ico" | "fnt", boolean>;
  discoverySearch: string;
  discSearchAll(query: string): void;
  loadMoreDisc(type: "img" | "vid"): void;
  saveToLibrary(type: "img" | "vid", item: StockPhoto | StockVideo): void;

  // Shared
  librarySearch: string;
  setLibrarySearch(q: string): void;
  storage: { used: number; total: number };

  // Clipboard
  copyUrl(src: string): void;

  // Overlays
  ctxMenu: CtxMenuState | null;
  openCtxMenu(e: React.MouseEvent, item: LibraryItem): void;
  closeCtxMenu(): void;
  detailItem: LibraryItem | null;
  openDetail(item: LibraryItem): void;
  closeDetail(): void;

  // Tips
  tipDismissed: boolean;
  dismissTip(): void;
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
  onRequestBulkDelete(items: LibraryItem[]): void;
  onRequestDelete(key: string): void;
  onInsert(key: string): void;
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
  disabled?: boolean;
}

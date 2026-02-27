/**
 * Aquibra Media Manager
 * Core orchestrator for media asset management
 *
 * @module engine/media/MediaManager
 * @license BSD-3-Clause
 */

import { MEDIA_DEFAULTS, MEDIA_EVENTS, getAssetTypeFromMime } from "../../shared/constants/media";
import type {
  MediaAsset,
  MediaAssetType,
  MediaFolder,
  MediaLibraryState,
  MediaSortBy,
  SortDirection,
  UploadProgress,
  UploadResult,
} from "../../shared/types/media";
import { MediaEventEmitter } from "./MediaEventEmitter";
import {
  validateFile,
  readFileAsDataURL,
  getMediaDimensions,
  generateThumbnail,
  generateMediaId,
} from "./MediaHelpers";
import { MediaStorage } from "./MediaStorage";

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
  svgDataUrl: string; // data:image/svg+xml;base64,... safe for <img src>
}

export interface DiscFont {
  id: string;
  family: string;
  category: "serif" | "sans-serif" | "monospace" | "display" | "handwriting";
  variants: string[];
  previewUrl?: string;
}

/** Upload options */
interface UploadOptions {
  readonly folderId?: string;
  readonly tags?: string[];
  readonly generateThumbnail?: boolean;
}

/**
 * Central manager for media assets and folders
 */
export class MediaManager extends MediaEventEmitter {
  private storage: MediaStorage;
  private state: MediaLibraryState;
  private initialized = false;

  constructor() {
    super();
    this.storage = new MediaStorage();
    this.state = this.createInitialState();
  }

  /**
   * Initialize the media manager and load stored assets
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    await this.storage.init();
    await this.loadFromStorage();
    this.initialized = true;
  }

  private async loadFromStorage(): Promise<void> {
    const [assets, folders] = await Promise.all([
      this.storage.getAllAssets(),
      this.storage.getAllFolders(),
    ]);
    this.state.assets = assets;
    this.state.folders = folders;
  }

  private createInitialState(): MediaLibraryState {
    return {
      assets: [],
      folders: [],
      selectedAssetIds: [],
      currentFolderId: null,
      viewMode: "grid",
      sortBy: MEDIA_DEFAULTS.DEFAULT_SORT,
      sortDirection: MEDIA_DEFAULTS.DEFAULT_SORT_DIR,
      searchQuery: "",
      filterTags: [],
      filterType: null,
      isLoading: false,
      hasMore: false,
      page: 1,
      pageSize: MEDIA_DEFAULTS.PAGE_SIZE,
    };
  }

  // ============================================
  // Asset Operations
  // ============================================

  async uploadFile(file: File, options: UploadOptions = {}): Promise<UploadResult> {
    const progress: UploadProgress = {
      fileName: file.name,
      progress: 0,
      status: "pending",
    };

    this.emit(MEDIA_EVENTS.UPLOAD_START, { fileName: file.name });

    const validation = validateFile(file);
    if (!validation.valid) {
      this.emit(MEDIA_EVENTS.UPLOAD_ERROR, { fileName: file.name, error: validation.error });
      return { success: false, error: validation.error, fileName: file.name };
    }

    try {
      progress.status = "uploading";
      progress.progress = 25;
      this.emit(MEDIA_EVENTS.UPLOAD_PROGRESS, progress);

      const src = await readFileAsDataURL(file);
      progress.progress = 50;
      this.emit(MEDIA_EVENTS.UPLOAD_PROGRESS, progress);

      const dimensions = await getMediaDimensions(file, src);

      progress.status = "processing";
      progress.progress = 75;
      this.emit(MEDIA_EVENTS.UPLOAD_PROGRESS, progress);

      let thumbnailSrc: string | undefined;
      if (options.generateThumbnail !== false && file.type.startsWith("image/")) {
        thumbnailSrc = await generateThumbnail(src, dimensions);
      }

      const asset: MediaAsset = {
        id: generateMediaId(),
        type: getAssetTypeFromMime(file.type) || "image",
        name: file.name.replace(/\.[^/.]+$/, ""),
        originalName: file.name,
        src,
        thumbnailSrc,
        mimeType: file.type,
        size: file.size,
        width: dimensions?.width,
        height: dimensions?.height,
        tags: options.tags || [],
        folderId: options.folderId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await this.storage.saveAsset(asset);
      this.state.assets.push(asset);

      progress.status = "complete";
      progress.progress = 100;
      progress.assetId = asset.id;
      this.emit(MEDIA_EVENTS.UPLOAD_PROGRESS, progress);
      this.emit(MEDIA_EVENTS.UPLOAD_COMPLETE, { success: true, asset, fileName: file.name });
      this.emit(MEDIA_EVENTS.MEDIA_ADDED, asset);

      return { success: true, asset, fileName: file.name };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      progress.status = "error";
      progress.error = errorMessage;
      this.emit(MEDIA_EVENTS.UPLOAD_ERROR, { fileName: file.name, error: errorMessage });
      return { success: false, error: errorMessage, fileName: file.name };
    }
  }

  async deleteAsset(id: string): Promise<void> {
    await this.storage.deleteAsset(id);
    this.state.assets = this.state.assets.filter((a) => a.id !== id);
    this.state.selectedAssetIds = this.state.selectedAssetIds.filter((sid) => sid !== id);
    this.emit(MEDIA_EVENTS.MEDIA_DELETED, { id });
  }

  async updateAsset(id: string, updates: Partial<MediaAsset>): Promise<MediaAsset | null> {
    const asset = this.state.assets.find((a) => a.id === id);
    if (!asset) return null;

    const updated: MediaAsset = {
      ...asset,
      ...updates,
      id: asset.id,
      createdAt: asset.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await this.storage.saveAsset(updated);
    const index = this.state.assets.findIndex((a) => a.id === id);
    if (index >= 0) {
      this.state.assets[index] = updated;
    }

    this.emit(MEDIA_EVENTS.MEDIA_UPDATED, { asset: updated, changes: updates });
    return updated;
  }

  getAsset(id: string): MediaAsset | undefined {
    return this.state.assets.find((a) => a.id === id);
  }

  getAssets(options?: {
    folderId?: string | null;
    type?: MediaAssetType;
    tags?: string[];
    search?: string;
  }): MediaAsset[] {
    let assets = [...this.state.assets];

    if (options?.folderId !== undefined) {
      assets = assets.filter((a) => a.folderId === options.folderId);
    }
    if (options?.type) {
      assets = assets.filter((a) => a.type === options.type);
    }
    if (options?.tags?.length) {
      assets = assets.filter((a) => options.tags!.some((tag) => a.tags.includes(tag)));
    }
    if (options?.search) {
      const query = options.search.toLowerCase();
      assets = assets.filter(
        (a) => a.name.toLowerCase().includes(query) || a.originalName.toLowerCase().includes(query)
      );
    }

    return this.sortAssets(assets);
  }

  // ============================================
  // Folder Operations
  // ============================================

  async createFolder(name: string, parentId?: string | null): Promise<MediaFolder> {
    const folder: MediaFolder = {
      id: generateMediaId(),
      name,
      parentId: parentId ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.storage.saveFolder(folder);
    this.state.folders.push(folder);
    this.emit(MEDIA_EVENTS.FOLDER_CREATED, folder);
    return folder;
  }

  // ============================================
  // Selection & Sorting
  // ============================================

  selectAssets(ids: string[]): void {
    this.state.selectedAssetIds = ids;
  }

  getSelectedAssets(): MediaAsset[] {
    return this.state.assets.filter((a) => this.state.selectedAssetIds.includes(a.id));
  }

  setSortBy(sortBy: MediaSortBy, direction?: SortDirection): void {
    this.state.sortBy = sortBy;
    if (direction) this.state.sortDirection = direction;
  }

  private sortAssets(assets: MediaAsset[]): MediaAsset[] {
    const { sortBy, sortDirection } = this.state;
    const dir = sortDirection === "asc" ? 1 : -1;

    return [...assets].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "date":
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
        case "size":
          return (a.size - b.size) * dir;
        case "type":
          return a.type.localeCompare(b.type) * dir;
        default:
          return 0;
      }
    });
  }

  // --- Discovery Stubs (wire to real APIs later) ---

  /**
   * Search stock photos (Unsplash) or videos (Pexels).
   * Stub returns empty array until API is wired.
   */
  async searchStock(_type: "img" | "vid", _query: string): Promise<StockPhoto[] | StockVideo[]> {
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
}

/**
 * Aquibra Media Manager
 * Core orchestrator for media asset management
 *
 * @module engine/media/MediaManager
 * @license BSD-3-Clause
 */

import DOMPurify from "dompurify";
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
  blobToDataURL,
  sniffMimeType,
} from "./MediaHelpers";
import { MediaStorage } from "./MediaStorage";
import { MediaOptimizer } from "./MediaOptimizer";
// P5 (2026-05-07): engine→services import deleted; stock search lives in editor UI
// only via dashboard.media.searchStock tRPC. Engine no longer touches I/O for stock.

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
  readonly autoOptimize?: boolean;
}

/**
 * Central manager for media assets and folders
 */
export class MediaManager extends MediaEventEmitter {
  private storage: MediaStorage;
  private optimizer: MediaOptimizer;
  private state: MediaLibraryState;
  private initialized = false;
  private blobUrlMap = new Map<string, string>();
  /**
   * Ref-count for blob URLs. Each getAssetSrc() increments the count for
   * an id; each releaseAssetSrc() decrements. When count hits zero and
   * the asset still exists, the URL stays alive (cheap to keep). It is
   * revoked only when the asset is deleted (deleteAsset). Purely defensive
   * against long sessions that open and close the library many times.
   */
  private blobUrlRefs = new Map<string, number>();
  /**
   * Pending revoke timers keyed by asset id. Set when refs drop to zero;
   * cleared when refs go back up or the timer fires (5s grace period).
   */
  private pendingRevokes = new Map<string, ReturnType<typeof setTimeout>>();
  /** Deduplicate concurrent getAssetSrc requests for the same id */
  private inFlight = new Map<string, Promise<string | null>>();

  constructor() {
    super();
    this.storage = new MediaStorage();
    this.optimizer = new MediaOptimizer();
    this.state = this.createInitialState();
  }

  /**
   * Public event emitter for callers outside the MediaManager class
   * (e.g. MediaCommandLayer). Keeps MediaEventEmitter's `emit` protected
   * while still allowing sibling engine classes to emit media events.
   */
  emitEvent(event: string, payload: unknown): void {
    this.emit(event, payload);
  }

  /**
   * Get a temporary source URL for an asset (cached Object URL).
   * Increments the ref count. Callers should call `releaseAssetSrc(id)`
   * in cleanup when the URL is no longer needed.
   */
  getAssetSrc(id: string): Promise<string | null> {
    const existing = this.inFlight.get(id);
    if (existing) return existing;

    const promise = this._getAssetSrc(id);
    this.inFlight.set(id, promise);
    promise.finally(() => this.inFlight.delete(id));
    return promise;
  }

  private async _getAssetSrc(id: string): Promise<string | null> {
    const asset = this.state.assets.find((a) => a.id === id);
    if (!asset) return null;

    // Cancel any pending revoke (re-acquisition within grace period)
    const pending = this.pendingRevokes.get(id);
    if (pending) {
      clearTimeout(pending);
      this.pendingRevokes.delete(id);
    }

    // Already a remote URL or data URL — no blob to manage.
    if (asset.src.startsWith("http") || asset.src.startsWith("data:")) {
      return asset.src;
    }

    this.blobUrlRefs.set(id, (this.blobUrlRefs.get(id) ?? 0) + 1);

    // Return cached blob URL.
    if (this.blobUrlMap.has(id)) {
      return this.blobUrlMap.get(id)!;
    }

    // Load from binary storage and create URL.
    const blob = await this.storage.getBlob(id);
    if (blob) {
      const url = URL.createObjectURL(blob);
      this.blobUrlMap.set(id, url);
      return url;
    }

    return asset.src;
  }

  /**
   * Decrement the ref count for a blob URL. Called from UI cleanup
   * (useEffect return, component unmount) to mark that the caller is
   * done with the URL. When refs drop to zero, schedule a deferred revoke
   * (5-second grace period) to handle transient hand-off scenarios where
   * a component unmounts just before another mounts referencing the same
   * asset. If the asset gets re-acquired within the grace period, the
   * revoke is cancelled.
   *
   * No-op for unknown ids and for data/http URLs (which never got refs).
   */
  releaseAssetSrc(id: string): void {
    const current = this.blobUrlRefs.get(id);
    if (!current) return;
    if (current <= 1) {
      this.blobUrlRefs.delete(id);
      this.scheduleRevoke(id);
    } else {
      this.blobUrlRefs.set(id, current - 1);
    }
  }

  /**
   * Schedule revocation of a blob URL after a grace period. If the asset
   * is re-acquired via getAssetSrc before the timeout fires, the revoke
   * is cancelled. Prevents unbounded blob URL accumulation while avoiding
   * race conditions with component remount cycles.
   */
  private scheduleRevoke(id: string): void {
    // Cancel any pending revoke for this id
    const existingTimer = this.pendingRevokes.get(id);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(() => {
      this.pendingRevokes.delete(id);
      // Only revoke if still zero-refs (re-acquisition cancels via getAssetSrc)
      if (!this.blobUrlRefs.has(id)) {
        const url = this.blobUrlMap.get(id);
        if (url) {
          URL.revokeObjectURL(url);
          this.blobUrlMap.delete(id);
        }
      }
    }, 5000);
    this.pendingRevokes.set(id, timer);
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

    // Rebuild blob URLs — stored src values are stale blob URLs from previous
    // sessions (blob: URLs are tied to the Window object and die on reload).
    // Without this, ImageEditorModal and any consumer of asset.src sees dead URLs.
    await Promise.all(
      assets.map(async (asset) => {
        if (asset.src.startsWith("http") || asset.src.startsWith("data:")) {
          return; // Remote or inline — already valid
        }
        try {
          const blob = await this.storage.getBlob(asset.id);
          if (blob) {
            const url = URL.createObjectURL(blob);
            this.blobUrlMap.set(asset.id, url);
            asset.src = url;
          }
        } catch {
          // Leave stale src; UI will render broken image placeholder
        }
      })
    );

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

      let finalBlob: Blob = file;
      let finalMime = file.type;
      // Will be reassigned to sniffed type below if SVG content was detected
      let finalSize = file.size;
      let finalDimensions = await getMediaDimensions(file, src);

      // Sniff actual MIME from magic bytes — file.type is set from extension
      // and can be spoofed (e.g. .svg renamed to .png). If the content is
      // actually SVG, route to the sanitizer regardless of declared type.
      const sniffedMime = await sniffMimeType(file);
      const actualType =
        sniffedMime === "image/svg+xml" ? "image/svg+xml" : file.type;

      // SVG sanitization — strip <script>, event handlers, external refs, etc.
      // DOMPurify's USE_PROFILES:{svg,svgFilters} keeps drawing instructions
      // and drops anything executable. Runs before storage and before any
      // consumer renders the file.
      if (actualType === "image/svg+xml") {
        const raw = await file.text();
        const clean = DOMPurify.sanitize(raw, {
          USE_PROFILES: { svg: true, svgFilters: true },
          FORBID_ATTR: ["xlink:href", "href"],
        });
        // Validate root element is <svg> — DOMPurify can return a fragment
        // that starts with <g>, <path>, etc. which is not a valid SVG document.
        const parsed = new DOMParser().parseFromString(clean, "image/svg+xml");
        const parseError = parsed.querySelector("parsererror");
        const rootEl = parsed.documentElement;
        const isSvgRoot =
          rootEl &&
          rootEl.localName === "svg" &&
          rootEl.namespaceURI === "http://www.w3.org/2000/svg";
        if (!clean || parseError || !isSvgRoot) {
          this.emit(MEDIA_EVENTS.UPLOAD_ERROR, {
            fileName: file.name,
            error: "SVG rejected: invalid SVG document after sanitization",
          });
          return {
            success: false,
            error: "SVG rejected: invalid SVG document after sanitization",
            fileName: file.name,
          };
        }
        finalBlob = new Blob([clean], { type: "image/svg+xml" });
        finalSize = finalBlob.size;
        finalMime = "image/svg+xml";
      }

      // Auto-optimization
      if (
        options.autoOptimize !== false &&
        file.type.startsWith("image/") &&
        file.type !== "image/svg+xml"
      ) {
        progress.status = "optimizing";
        this.emit(MEDIA_EVENTS.UPLOAD_PROGRESS, progress);

        const optimizationResult = await this.optimizer.convertToWebP(src);
        if (optimizationResult.success && optimizationResult.blob) {
          finalBlob = optimizationResult.blob;
          finalMime = "image/webp";
          finalSize = optimizationResult.blob.size;
          finalDimensions = optimizationResult.dimensions;
        }
      }

      progress.status = "processing";
      progress.progress = 75;
      this.emit(MEDIA_EVENTS.UPLOAD_PROGRESS, progress);

      // Create Object URL for session preview
      const previewUrl = URL.createObjectURL(finalBlob);

      let thumbnailSrc: string | undefined;
      if (options.generateThumbnail !== false && finalMime.startsWith("image/")) {
        thumbnailSrc = await generateThumbnail(previewUrl, finalDimensions);
      }

      const assetId = generateMediaId();
      const asset: MediaAsset = {
        id: assetId,
        type: getAssetTypeFromMime(finalMime) || "image",
        name: file.name.replace(/\.[^/.]+$/, ""),
        originalName: file.name,
        src: previewUrl, // Use blob URL for current session
        thumbnailSrc,
        mimeType: finalMime,
        size: finalSize,
        width: finalDimensions?.width,
        height: finalDimensions?.height,
        tags: options.tags || [],
        folderId: options.folderId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save both metadata and binary blob
      await this.storage.saveAsset(asset, finalBlob);
      this.blobUrlMap.set(assetId, previewUrl);
      this.state.assets.push(asset);

      progress.status = "complete";
      progress.progress = 100;
      progress.assetId = assetId;
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

    // Revoke object URL to free memory
    if (this.blobUrlMap.has(id)) {
      URL.revokeObjectURL(this.blobUrlMap.get(id)!);
      this.blobUrlMap.delete(id);
    }
    this.blobUrlRefs.delete(id);

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

  async deleteFolder(id: string): Promise<void> {
    await this.storage.deleteFolder(id);
    this.state.folders = this.state.folders.filter((f) => f.id !== id);

    // Orphaned assets move to root
    const orphaned = this.state.assets.filter((a) => a.folderId === id);
    for (const asset of orphaned) {
      await this.updateAsset(asset.id, { folderId: undefined });
    }

    this.emit(MEDIA_EVENTS.FOLDER_DELETED, { id });
  }

  getFolders(parentId: string | null = null): MediaFolder[] {
    return this.state.folders.filter((f) => f.parentId === parentId);
  }

  /**
   * Automatically ensure a folder exists for the current project.
   * Creates it at the root level if not found.
   */
  async ensureProjectFolder(projectName: string): Promise<string> {
    const existing = this.state.folders.find(
      (f) => f.name === projectName && f.parentId === null
    );
    if (existing) return existing.id;

    const folder = await this.createFolder(projectName, null);
    return folder.id;
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

  // --- Discovery Stubs (wired with mock data for "functional" feel) ---
  //
  // P5 (2026-05-07): MediaManager.searchStock deleted. Stock search now lives
  // in editor UI only — useDiscoveryState calls dashboard.media.searchStock
  // tRPC directly (which itself proxies to Unsplash/Pexels with rate-limit +
  // quota enforcement on the server). Engine purity restored: no engine→
  // services import, no engine→external-API call.

  /**
   * Get built-in icon library.
   */
  getIcons(category?: string): DiscIcon[] {
    const icons: DiscIcon[] = [
      { id: "ico_1", name: "User", category: "General", svgDataUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xOSAyMXYtMmE0IDQgMCAwIDAtNC00SDlhNCA0IDAgMCAwLTQgNHYyIj48L3BhdGg+PGNpcmNsZSBjeD0iMTIiIGN5PSI3IiByPSI0Ij48L2NpcmNsZT48L3N2Zz4=" },
      { id: "ico_2", name: "Settings", category: "General", svgDataUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjMiPjwvY2lyY2xlPjxwYXRoIGQ9Ik0xOS40IDE1YTEuNjUgMS42NSAwIDAgMCAuMzMgMS44MmwuMDYuMDZhMiAyIDAgMSAxLTIuODMgMi44M2wtLjA2LS4wNmExLjY1IDEuNjUgMCAwIDAtMS44Mi0uMzMgMS42NSAxLjY1IDAgMCAwLTEgMS41MXYuMTFhMiAyIDAgMSAxLTQgMHYtLjExYTEuNjUgMS42NSAwIDAgMC0xLTEuNTFhMS42NSAxLjY1IDAgMCAwLTEuODIuMzNsLS4wNi4wNmEyIDIgMCAxIDEtMi44My0yLjgzbC4wNi0uMDZhMS42NSAxLjY1IDAgMCAwIC4zMy0xLjgyIDEuNjUgMS42NSAwIDAgMC0xLjUxLTFoLjExYTIgMiAwIDExIDAtNHYtLjExYTEuNjUgMS42NSAwIDAgMC0xLjUxLTFhMS42NSAxLjY1IDAgMCAwLTEuODItLjMzbC4wNi0uMDZhMiAyIDAgMSAxIDIuODMtMi44M2wuMDYuMDZhMS42NSAxLjY1IDAgMCAwIDEuODItLjMzIDEuNjUgMS42NSAwIDAgMCAxLTEuNTF2LS4xMWEyIDIgMCAxIDEgNCAwdi4xMWExLjY1IDEuNjUgMCAwIDAgMSAxLjUxIDEuNjUgMS42NSAwIDAgMCAxLjgyLjMzbC4wNi0uMDZhMiAyIDAgMSAxIDIuODMgMi44M2wtLjA2LjA2YTEuNjUgMS42NSAwIDAgMC0uMzMgMS44MloiPjwvcGF0aD48L3N2Zz4=" },
      { id: "ico_3", name: "Search", category: "General", svgDataUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjExIiBjeT0iMTEiIHI9IjgiPjwvY2lyY2xlPmxpbmUgeDE9IjIxIiB5MT0iMjEiIHgyPSIxNi42NSIgeTI9IjE2LjY1Ij48L2xpbmU+PC9zdmc+" },
      { id: "ico_4", name: "Heart", category: "General", svgDataUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMC44NCA0LjYxYTUuNSA1LjUgMCAwIDAtNy43OCAwTDExIDYuMjNsLTEuMDYtMS4wNmE1LjUgNS41IDAgMCAwLTcuNzggNy43OGwxLjA2IDEuMDZMMTEgMjFsNy43OC03Ljc4IDEuMDYtMS4wNmE1LjUgNS41IDAgMCAwIDAtNy43OHoiPjwvcGF0aD48L3N2Zz4=" },
    ];

    if (category) {
      return icons.filter(i => i.category === category);
    }
    return icons;
  }

  /**
   * Get Google Fonts list.
   */
  async getFonts(query?: string): Promise<DiscFont[]> {
    const fonts: DiscFont[] = [
      { id: "fnt_1", family: "Inter", category: "sans-serif", variants: ["400", "500", "600", "700"] },
      { id: "fnt_2", family: "Playfair Display", category: "serif", variants: ["400", "700"] },
      { id: "fnt_3", family: "Fira Code", category: "monospace", variants: ["400", "500"] },
      { id: "fnt_4", family: "Roboto", category: "sans-serif", variants: ["300", "400", "500", "700"] },
    ];

    if (query) {
      const lower = query.toLowerCase();
      return fonts.filter(f => f.family.toLowerCase().includes(lower));
    }
    return fonts;
  }
}

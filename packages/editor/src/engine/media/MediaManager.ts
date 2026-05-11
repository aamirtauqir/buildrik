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
  RemoteAssetSync,
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
  sniffMimeType,
} from "./MediaHelpers";
import { MediaStorage } from "./MediaStorage";
import { MediaOptimizer } from "./MediaOptimizer";
// P5 (2026-05-07): engine→services import deleted; stock search lives in editor UI

/**
 * Phase B2: narrow MediaAssetType to the server's mediaTypeEnum subset.
 *  - Engine type: "image" | "video" | "audio" | "icon" | "svg" | "font"
 *  - Server enum: "image" | "video" | "icon" | "font"
 *
 *  - svg → image (SVGs are stored as image rows server-side; the type
 *    discriminator is mimeType, not the asset.type field)
 *  - audio → null (no server-side schema; local-only forever)
 */
function toServerAssetType(
  type: MediaAssetType,
): "image" | "video" | "icon" | "font" | null {
  switch (type) {
    case "image":
    case "svg":
      return "image";
    case "video":
      return "video";
    case "icon":
      return "icon";
    case "font":
      return "font";
    case "audio":
      return null;
    default:
      return null;
  }
}
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

  /**
   * Phase B2: optional remote sync. Wired by Composer from ComposerConfig.
   * Null = local-only mode (no dashboard URL configured / unauthenticated).
   */
  private remoteSync: RemoteAssetSync | null;

  /**
   * Phase B2: asset IDs needing server retry. Populated when uploadAndCreate
   * returns null (offline / 5xx). Drained by retryLocalOnlyAssets() on
   * 'online' event or next successful upload.
   */
  private retryQueue = new Set<string>();

  /** Phase B2: pending server-side deletes when offline. Asset already gone locally. */
  private pendingRemoteDeletes = new Set<string>();

  /**
   * Phase B5 P1C fix: local IDs of assets currently mid-uploadAndCreate.
   * If deleteAsset fires while one is in flight, we record a tombstone
   * (deleteOnReconcile) so the upload completion handler immediately
   * deletes the just-created server row instead of leaking it.
   */
  private inFlightUploads = new Set<string>();
  private deleteOnReconcile = new Set<string>();

  /**
   * Phase B5 P1B fix: folder IDs that failed server-side and need retry
   * before any asset that references them can be uploaded. Folders sync
   * before assets in retryLocalOnlyAssets so the asset's folderId
   * resolves on the server.
   */
  private folderRetryQueue = new Map<string, { name: string; parentId: string | null }>();

  /**
   * Phase B5 P2 (durability): rebuild this from persisted localOnly assets
   * during init() so a refresh between mirror failures doesn't lose retry
   * intent. The Set itself stays in-memory; the *intent* is stored in
   * IndexedDB via asset.localOnly=true.
   */
  constructor(remoteSync?: RemoteAssetSync) {
    super();
    this.storage = new MediaStorage();
    this.optimizer = new MediaOptimizer();
    this.state = this.createInitialState();
    this.remoteSync = remoteSync ?? null;

    // Trigger retry when network returns. Browser may not have addEventListener
    // in some test envs (jsdom does); guard for safety.
    if (typeof window !== "undefined" && this.remoteSync) {
      window.addEventListener("online", this.handleOnline);
    }
  }

  /**
   * Phase B5 P2 (listener leak fix): tear down window event listener +
   * clear in-flight queues. Called from Composer.destroy() so repeated
   * editor mounts (tests, hot reload, route nav) don't accumulate.
   */
  destroy(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
    }
    // Clear in-flight + pending sets so any pending promises resolve
    // into a no-op rather than mutating destroyed state.
    this.inFlightUploads.clear();
    this.deleteOnReconcile.clear();
    this.retryQueue.clear();
    this.pendingRemoteDeletes.clear();
    this.folderRetryQueue.clear();
    // Revoke all blob URLs to free memory.
    for (const [, url] of this.blobUrlMap) {
      URL.revokeObjectURL(url);
    }
    this.blobUrlMap.clear();
    this.blobUrlRefs.clear();
    for (const timer of this.pendingRevokes.values()) {
      clearTimeout(timer);
    }
    this.pendingRevokes.clear();
    this.removeAllListeners();
  }

  /**
   * Phase B5 P2 (durability): scan persisted assets for localOnly=true and
   * rebuild the retry queue. Call this once from MediaStorage.init()
   * completion. Idempotent — running twice doesn't double-add (Set).
   *
   * Public so MediaCommandLayer / app init can also re-trigger after
   * project import.
   */
  rebuildRetryQueueFromState(): void {
    for (const asset of this.state.assets) {
      if (asset.localOnly) this.retryQueue.add(asset.id);
    }
  }

  /**
   * Phase B5+ codex re-review fix [P2 durability]: rebuild folderRetryQueue
   * from persisted MediaFolder.localOnly markers. Pre-fix, the queue was
   * memory-only — a reload between createFolder() failure and reconnect
   * lost retry intent forever, so the folder stayed permanently absent
   * from the server. Mirror of rebuildRetryQueueFromState for assets.
   *
   * Public so MediaCommandLayer / app init can also re-trigger after
   * project import. Idempotent — Map.set on the same key just overwrites.
   */
  rebuildFolderRetryQueueFromState(): void {
    for (const folder of this.state.folders) {
      if (folder.localOnly) {
        this.folderRetryQueue.set(folder.id, {
          name: folder.name,
          parentId: folder.parentId,
        });
      }
    }
  }

  /**
   * Phase B2: re-attempt server sync for any localOnly assets and any
   * pending remote deletes. Called on 'online' event and after each
   * successful upload (chained retries).
   */
  private handleOnline = (): void => {
    void this.retryLocalOnlyAssets();
  };

  /**
   * Phase B5+ codex re-review pass 3 P1 fix: serialize re-entrant
   * drains. retryLocalOnlyAssets is called from `online`, from
   * uploadFile success branch (chained retry), and from app init
   * (loadServerMedia hooks). Two overlapping calls would both
   * snapshot the same folderRetryQueue entries and both call
   * remoteSync.createFolder before either pass deleted the entry —
   * server gets duplicate folders, remap map fights itself.
   */
  private retryInFlight: Promise<void> | null = null;

  /**
   * Phase B2: drain the retry queue. Best-effort — failures stay queued.
   * Phase B5 P1B fix: sync folders first so assets referencing offline-
   * created folders don't hit FOLDER_NOT_FOUND server-side. Asset
   * folderId is rewritten from local UUID to server CUID before the
   * asset's own retry runs.
   *
   * Phase B5++ codex pass 4 fix: the pass-3 mutex was racy. After
   * `await this.retryInFlight`, two callers could both find the size
   * check pass and both start a new drain — exactly the multi-trigger
   * pattern the mutex was meant to prevent. Replaced with the
   * single-follow-up-pass pattern: while a drain is in flight, set
   * `retryRequested` and let the running drain check + re-enter once
   * before clearing. Only one follow-up drain is ever scheduled
   * regardless of how many concurrent callers arrived during the
   * in-flight window.
   */
  private retryRequested = false;

  async retryLocalOnlyAssets(): Promise<void> {
    if (!this.remoteSync) return;

    if (this.retryInFlight) {
      // A drain is already in flight. Mark that another follow-up
      // pass is needed; the in-flight drain's finally hook will
      // schedule exactly one re-entry, regardless of how many
      // callers arrived during this window. Then await the in-flight
      // promise so callers don't return before the work they
      // requested has been attempted.
      this.retryRequested = true;
      await this.retryInFlight;
      return;
    }

    this.retryInFlight = this.doRetryLocalOnlyAssets().finally(() => {
      this.retryInFlight = null;
      // If any caller arrived during this drain, schedule a single
      // follow-up — regardless of how many requesters there were.
      if (this.retryRequested) {
        this.retryRequested = false;
        if (this.retryQueue.size > 0 || this.folderRetryQueue.size > 0) {
          void this.retryLocalOnlyAssets();
        }
      }
    });
    return this.retryInFlight;
  }

  private async doRetryLocalOnlyAssets(): Promise<void> {
    if (!this.remoteSync) return;

    // Step 1: drain folder retry queue. Returns map of localId → serverCUID
    // for any folders that synced this pass.
    const folderRemap = await this.retryFolderQueue();

    // Step 2: rewrite asset.folderId references in IndexedDB + state for
    // any folder that just got a server CUID. This must happen BEFORE
    // asset retries so the createAsset call carries the right folderId.
    if (folderRemap.size > 0) {
      for (const asset of this.state.assets) {
        const newFolderId = asset.folderId ? folderRemap.get(asset.folderId) : undefined;
        if (newFolderId) {
          asset.folderId = newFolderId;
          await this.storage.saveAsset({ ...asset });
        }
      }
    }

    // Step 3: drain the asset retry queue.
    // Snapshot first; new entries during iteration retry next call.
    const ids = Array.from(this.retryQueue);
    for (const id of ids) {
      const asset = this.state.assets.find((a) => a.id === id);
      if (!asset || !asset.localOnly) {
        this.retryQueue.delete(id);
        continue;
      }
      const serverType = toServerAssetType(asset.type);
      if (!serverType) {
        // Unsupported on server (audio) — local-only forever; drop from queue.
        this.retryQueue.delete(id);
        continue;
      }
      const blob = await this.storage.getBlob(id);
      if (!blob) {
        // Local blob lost — drop from retry; nothing to upload.
        this.retryQueue.delete(id);
        continue;
      }
      const result = await this.remoteSync.uploadAndCreate(blob, {
        filename: asset.originalName,
        mimeType: asset.mimeType,
        bytes: asset.size,
        type: serverType,
        folderId: asset.folderId ?? null,
      });
      if (result) {
        // Replace local id with server CUID, clear localOnly flag,
        // re-key IndexedDB so engine and server agree on identity.
        await this.replaceAssetId(id, result.serverId, result.url);
        this.retryQueue.delete(id);
      }
    }
    // Drain pending deletes too.
    const deletes = Array.from(this.pendingRemoteDeletes);
    for (const serverId of deletes) {
      const ok = await this.remoteSync.deleteRemote(serverId);
      if (ok) this.pendingRemoteDeletes.delete(serverId);
    }
  }

  /**
   * Phase B3: merge server-side assets + folders into the engine on project
   * load. Server is authoritative for shared identity (the CUID). Local-only
   * assets (uploaded but not yet mirrored) are preserved and continue to
   * retry. Server assets new to this device get metadata-only IndexedDB
   * rows pointing at the public URL — blobs are lazy-fetched on first
   * render need.
   *
   * Cross-device divergence policy: server wins for assets that exist
   * server-side; local copies that disagree get the server's metadata.
   * Asset deleted on another device → still in IndexedDB until the local
   * editor explicitly deletes (no GC pass yet; safe to defer).
   */
  async importServerAssets(
    serverAssets: ReadonlyArray<{
      id: string;
      url: string;
      bytes: number;
      type: "image" | "video" | "icon" | "font";
      mimeType: string;
      filename: string;
      altText: string | null;
      folderId: string | null;
      createdAt: string | Date;
      updatedAt: string | Date;
    }>,
    serverFolders: ReadonlyArray<{
      id: string;
      name: string;
      parentId: string | null;
      createdAt: string | Date;
      updatedAt: string | Date;
    }>,
  ): Promise<void> {
    // Folders first so asset folder refs resolve.
    const existingFolderIds = new Set(this.state.folders.map((f) => f.id));
    for (const sf of serverFolders) {
      if (existingFolderIds.has(sf.id)) continue;
      const folder: MediaFolder = {
        id: sf.id,
        name: sf.name,
        parentId: sf.parentId, // MediaFolder.parentId is `string | null`
        createdAt: typeof sf.createdAt === "string" ? sf.createdAt : sf.createdAt.toISOString(),
        updatedAt: typeof sf.updatedAt === "string" ? sf.updatedAt : sf.updatedAt.toISOString(),
      };
      await this.storage.saveFolder(folder);
      this.state.folders.push(folder);
      this.emit(MEDIA_EVENTS.FOLDER_CREATED, folder);
    }

    // Assets — skip duplicates (engine already has matching CUID, e.g.
    // uploaded earlier this session). Map server enum back to engine
    // MediaAssetType. SVG-as-image: discriminate via mimeType.
    const existingAssetIds = new Set(this.state.assets.map((a) => a.id));
    for (const sa of serverAssets) {
      if (existingAssetIds.has(sa.id)) continue;
      const engineType: MediaAssetType =
        sa.type === "image" && sa.mimeType === "image/svg+xml" ? "svg" : sa.type;
      const asset: MediaAsset = {
        id: sa.id,
        serverId: sa.id,
        type: engineType,
        name: sa.filename.replace(/\.[^/.]+$/, ""),
        originalName: sa.filename,
        // Server URL is the canonical src; UI renders straight from it
        // without needing a local blob fetch.
        src: sa.url,
        mimeType: sa.mimeType,
        size: sa.bytes,
        altText: sa.altText ?? undefined,
        folderId: sa.folderId ?? undefined,
        tags: [],
        createdAt: typeof sa.createdAt === "string" ? sa.createdAt : sa.createdAt.toISOString(),
        updatedAt: typeof sa.updatedAt === "string" ? sa.updatedAt : sa.updatedAt.toISOString(),
        assetSource: "uploaded",
      };
      // Metadata-only IndexedDB write. Blob arg omitted — first render
      // request fetches the public URL into a Blob via the existing
      // getAssetSrc lazy path.
      await this.storage.saveAsset(asset);
      this.state.assets.push(asset);
      this.emit(MEDIA_EVENTS.MEDIA_ADDED, asset);
    }
  }

  /**
   * Phase B2: rewrite an asset's ID from the engine-generated local UUID
   * to the server CUID. Updates state, IndexedDB, blob URL map, and emits
   * MEDIA_UPDATED so the UI re-keys.
   */
  private async replaceAssetId(
    oldId: string,
    newId: string,
    remoteUrl: string,
  ): Promise<void> {
    const idx = this.state.assets.findIndex((a) => a.id === oldId);
    if (idx === -1) return;
    const old = this.state.assets[idx];
    const updated: MediaAsset = {
      ...old,
      id: newId,
      serverId: newId,
      src: remoteUrl,
      localOnly: false,
      updatedAt: new Date().toISOString(),
    };
    // Move IndexedDB record under the new key, then drop old key.
    const blob = await this.storage.getBlob(oldId);
    if (blob) {
      await this.storage.saveAsset(updated, blob);
      await this.storage.deleteAsset(oldId);
    }
    this.state.assets[idx] = updated;
    const blobUrl = this.blobUrlMap.get(oldId);
    if (blobUrl) {
      this.blobUrlMap.delete(oldId);
      this.blobUrlMap.set(newId, blobUrl);
    }
    this.emit(MEDIA_EVENTS.MEDIA_UPDATED, updated);
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
    // Phase B5 P2 (durability): refresh between sync failures used to lose
    // retry intent because retryQueue lived only in memory. Now we rebuild
    // it from persisted localOnly markers so retry survives reload — for
    // both assets and folders. Order matters in spirit (folders before
    // assets) but retryLocalOnlyAssets() always drains the folder queue
    // first anyway, so the only requirement here is "both seeded before
    // any retry runs."
    this.rebuildRetryQueueFromState();
    this.rebuildFolderRetryQueueFromState();
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

      // Save both metadata and binary blob locally first — server mirror is
      // best-effort; offline / auth-fail / quota all fall back to localOnly.
      await this.storage.saveAsset(asset, finalBlob);
      this.blobUrlMap.set(assetId, previewUrl);
      this.state.assets.push(asset);

      // Phase B2: mirror to server when remoteSync is wired. On success the
      // server-assigned CUID becomes the engine asset ID (replaceAssetId
      // re-keys IndexedDB + state in one pass and emits MEDIA_UPDATED so
      // the UI updates the row identity).
      //
      // Phase B5 P1C fix: track inFlightUploads while uploadAndCreate is
      // pending; deleteAsset(localId) during this window sets a tombstone
      // (deleteOnReconcile) so we delete the server row immediately on
      // completion instead of leaking it.
      let finalAsset: MediaAsset = asset;
      const serverType = toServerAssetType(asset.type);
      if (this.remoteSync && serverType) {
        this.inFlightUploads.add(assetId);
        const remote = await this.remoteSync.uploadAndCreate(finalBlob, {
          filename: file.name,
          mimeType: finalMime,
          bytes: finalSize,
          type: serverType,
          folderId: asset.folderId ?? null,
        });
        this.inFlightUploads.delete(assetId);

        if (remote) {
          // P1C tombstone check — if user deleted local during in-flight
          // upload, server row exists but engine state was already cleaned.
          // Delete the server row + Vercel Blob to match.
          if (this.deleteOnReconcile.has(assetId)) {
            this.deleteOnReconcile.delete(assetId);
            const deleteOk = await this.remoteSync.deleteRemote(remote.serverId);
            if (!deleteOk) this.pendingRemoteDeletes.add(remote.serverId);
            // Engine state was already cleaned by deleteAsset; nothing more to do.
            // Fall through to the success branch's emit pattern below using
            // the original (now-deleted) asset for UPLOAD_COMPLETE shape.
            progress.status = "complete";
            progress.progress = 100;
            progress.assetId = assetId;
            this.emit(MEDIA_EVENTS.UPLOAD_PROGRESS, progress);
            return { success: true, asset, fileName: file.name };
          }
          await this.replaceAssetId(assetId, remote.serverId, remote.url);
          finalAsset = this.state.assets.find((a) => a.id === remote.serverId) ?? asset;
          // P2 fix: chain retry on success so other queued localOnly assets
          // get a fresh attempt without waiting for an 'online' event.
          if (this.retryQueue.size > 0 || this.folderRetryQueue.size > 0) {
            // Fire-and-forget — do not await; current upload's caller
            // doesn't need to wait for unrelated retries.
            void this.retryLocalOnlyAssets();
          }
        } else {
          // Phase B5+ codex re-review fix [P1C failure path]: if the
          // user deleted this asset locally while uploadAndCreate was
          // in-flight, deleteAsset() set the tombstone and already
          // removed the asset from state + IndexedDB + blobUrlMap.
          // Without this guard the failure branch would resurrect the
          // deleted asset as localOnly + queue a retry, silently
          // undoing the user's delete the next time we come online.
          if (this.deleteOnReconcile.has(assetId)) {
            this.deleteOnReconcile.delete(assetId);
            this.retryQueue.delete(assetId);
            progress.status = "complete";
            progress.progress = 100;
            progress.assetId = assetId;
            this.emit(MEDIA_EVENTS.UPLOAD_PROGRESS, progress);
            return { success: true, asset, fileName: file.name };
          }
          // Remote sync failed — flag local-only and queue for retry.
          asset.localOnly = true;
          this.retryQueue.add(assetId);
          await this.storage.saveAsset(asset, finalBlob);
        }
      }
      // serverType=null (audio) means we keep the asset local without queuing
      // — there's no server schema for audio uploads today.

      progress.status = "complete";
      progress.progress = 100;
      progress.assetId = finalAsset.id;
      this.emit(MEDIA_EVENTS.UPLOAD_PROGRESS, progress);
      this.emit(MEDIA_EVENTS.UPLOAD_COMPLETE, {
        success: true,
        asset: finalAsset,
        fileName: file.name,
      });
      this.emit(MEDIA_EVENTS.MEDIA_ADDED, finalAsset);

      return { success: true, asset: finalAsset, fileName: file.name };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      progress.status = "error";
      progress.error = errorMessage;
      this.emit(MEDIA_EVENTS.UPLOAD_ERROR, { fileName: file.name, error: errorMessage });
      return { success: false, error: errorMessage, fileName: file.name };
    }
  }

  async deleteAsset(id: string): Promise<void> {
    // Capture serverId BEFORE local delete so we can mirror to server.
    const asset = this.state.assets.find((a) => a.id === id);
    const serverId = asset?.serverId;

    // Phase B5 P1C fix: if uploadAndCreate is in flight for this asset,
    // tombstone it so completion handler immediately deletes the server
    // row instead of leaving an orphan. Without this, deleteAsset returns
    // before the upload completes, server row gets created, and B3 hydration
    // re-imports the "deleted" asset on next reload.
    if (this.inFlightUploads.has(id)) {
      this.deleteOnReconcile.add(id);
    }

    // Phase B5 P2 + P1B: also drop from retry / folder-retry queues if
    // present, so we don't accidentally re-create the asset server-side
    // after the user explicitly deleted it locally.
    this.retryQueue.delete(id);

    await this.storage.deleteAsset(id);
    this.state.assets = this.state.assets.filter((a) => a.id !== id);
    this.state.selectedAssetIds = this.state.selectedAssetIds.filter((sid) => sid !== id);

    // Revoke object URL to free memory
    if (this.blobUrlMap.has(id)) {
      URL.revokeObjectURL(this.blobUrlMap.get(id)!);
      this.blobUrlMap.delete(id);
    }
    this.blobUrlRefs.delete(id);

    // Phase B2: mirror server-side delete. If offline / 5xx, queue for
    // retry on next 'online' event. Local delete already happened — server
    // is the eventually-consistent side.
    // Skipped when serverId absent — either local-only (nothing to delete)
    // or in-flight (handled by tombstone above).
    if (this.remoteSync && serverId) {
      const ok = await this.remoteSync.deleteRemote(serverId);
      if (!ok) this.pendingRemoteDeletes.add(serverId);
    }

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

    // Phase B4: mirror folderId changes server-side. Only fires when the
    // folderId field is explicitly part of `updates` (not all updateAsset
    // calls — rename/altText changes don't move the asset). Asset must
    // have a serverId (was uploaded successfully); local-only assets
    // skip this mirror until they sync.
    if (
      this.remoteSync &&
      asset.serverId &&
      Object.prototype.hasOwnProperty.call(updates, "folderId") &&
      asset.folderId !== updated.folderId
    ) {
      await this.remoteSync.moveAsset(asset.serverId, updated.folderId ?? null);
      // Failure tolerated — local move stuck, server out of sync until
      // next move or full sync. Phase B5 (deferred) would add a queue.
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
    // Phase B4: try server first when wired. If server returns a CUID,
    // use it as the engine folder id (single source of identity). On
    // failure, generate a local id AND queue for retry — without this
    // queue, assets uploaded into the folder later would fail with
    // FOLDER_NOT_FOUND server-side and uploadAndCreate would loop
    // forever (Phase B5 P1B fix).
    let id = generateMediaId();
    let serverSynced = false;
    if (this.remoteSync) {
      const created = await this.remoteSync.createFolder({
        name,
        parentId: parentId ?? null,
      });
      if (created) {
        id = created.serverId;
        serverSynced = true;
      } else {
        // Queue for retry. retryLocalOnlyAssets syncs folders FIRST so
        // any assets that reference this folder get the server CUID
        // before their own retry hits createAsset.
        this.folderRetryQueue.set(id, { name, parentId: parentId ?? null });
      }
    }

    // Phase B5+ codex re-review fix [P2 durability]: stamp localOnly
    // when we couldn't reach the server, mirroring the asset contract.
    // Pre-fix the retry queue lived only in memory — a reload between
    // creation and reconnection lost retry intent forever, leaving the
    // folder permanently divergent from the server. With this marker
    // rebuildFolderRetryQueueFromState() restores the queue on init.
    const localOnly = this.remoteSync !== undefined && !serverSynced;

    const folder: MediaFolder = {
      id,
      name,
      parentId: parentId ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      localOnly,
    };

    await this.storage.saveFolder(folder);
    this.state.folders.push(folder);
    this.emit(MEDIA_EVENTS.FOLDER_CREATED, folder);
    return folder;
  }

  /**
   * Phase B5 P1B fix: re-attempt folder server creation. Returns map
   * of localId → serverId for successful syncs so retryLocalOnlyAssets
   * can rewrite asset.folderId references in the same pass.
   */
  private async retryFolderQueue(): Promise<Map<string, string>> {
    const remapped = new Map<string, string>();
    if (!this.remoteSync || this.folderRetryQueue.size === 0) return remapped;

    // Phase B5+ codex re-review fix [P1B nested]: process in waves so
    // children never sync ahead of their parents. Pre-fix the queue
    // iterated in insertion order, which broke when:
    //   1. A reload restored queue with no parent-before-child guarantee
    //   2. A successful upload mid-sync re-entered retryFolderQueue
    //      while a parent folder hadn't synced yet
    // Result: child sent local-UUID parentId to server, server replied
    // PARENT_NOT_FOUND, child stuck forever.
    //
    // Wave protocol: pick entries whose parent is either null (root),
    // not in the queue (already server-side from a prior pass), or
    // already remapped *this* pass. Skip the rest, re-evaluate next
    // wave. Substitute parent's server CUID at call time. Stop when
    // a wave makes no progress (avoids infinite loop on a cycle —
    // shouldn't happen, but defensive).
    let progressed = true;
    while (this.folderRetryQueue.size > 0 && progressed) {
      progressed = false;
      const entries = Array.from(this.folderRetryQueue.entries());
      for (const [localId, payload] of entries) {
        const localParent = payload.parentId;
        // Parent is queued but not yet remapped — wait for next wave.
        if (
          localParent &&
          this.folderRetryQueue.has(localParent) &&
          !remapped.has(localParent)
        ) {
          continue;
        }
        // Substitute parent id: local UUID → server CUID if it was
        // remapped earlier in this pass; otherwise pass through (it's
        // already server-side, or null root).
        const parentIdForServer = localParent
          ? remapped.get(localParent) ?? localParent
          : null;
        const created = await this.remoteSync.createFolder({
          name: payload.name,
          parentId: parentIdForServer,
        });
        if (created) {
          // Rewrite engine folder id from local UUID to server CUID.
          // Clear localOnly — folder is now durably server-synced, so
          // the next reload's rebuildFolderRetryQueueFromState() won't
          // re-enqueue a phantom retry.
          const idx = this.state.folders.findIndex((f) => f.id === localId);
          if (idx >= 0) {
            const old = this.state.folders[idx];
            const updated: MediaFolder = {
              ...old,
              id: created.serverId,
              localOnly: false,
            };
            await this.storage.saveFolder(updated);
            await this.storage.deleteFolder(localId);
            this.state.folders[idx] = updated;
            remapped.set(localId, created.serverId);
          }
          // Carry forward: any folder in state.folders that pointed at
          // this folder's local UUID as its parent must update to the
          // new server CUID, or the UI tree shows orphans.
          for (const f of this.state.folders) {
            if (f.parentId === localId) {
              f.parentId = created.serverId;
              await this.storage.saveFolder(f);
            }
          }
          // Same carry-forward for queued descendants — they need the
          // server CUID parent, not the dead local UUID, on next wave.
          for (const [, queued] of this.folderRetryQueue) {
            if (queued.parentId === localId) {
              queued.parentId = created.serverId;
            }
          }
          this.folderRetryQueue.delete(localId);
          progressed = true;
        }
      }
    }
    return remapped;
  }

  async deleteFolder(id: string): Promise<void> {
    // Phase B5+ codex re-review pass 3 P1 fix: drop the folder + any
    // queued descendants from folderRetryQueue BEFORE removing them
    // from state. Pre-fix, deleting an offline-created folder left
    // its entry in folderRetryQueue, so on the next reconnect the
    // server resurrected the folder the user had explicitly trashed
    // (state had no row, but the queue still asked the server to
    // create it). Walk the local subtree using state.folders, then
    // purge each id from the queue.
    // Pass 4 fix: cycle-safe walk + queue-relation traversal. The
    // pass-3 walk only used the Set after recursing, so a malformed
    // cycle (f1↔f2) would loop until stack overflow. Also limited
    // to state.folders, missing queued descendants whose state row
    // had a stale parent reference.
    const toPurgeFromQueue = new Set<string>();
    const walk = (folderId: string) => {
      if (toPurgeFromQueue.has(folderId)) return;
      toPurgeFromQueue.add(folderId);
      for (const f of this.state.folders) {
        if (f.parentId === folderId) walk(f.id);
      }
      // Also walk queued descendants in case state and queue diverged
      // (e.g., a parent was just remapped, breaking state.parentId
      // references for queued children).
      for (const [queuedId, payload] of this.folderRetryQueue) {
        if (payload.parentId === folderId) walk(queuedId);
      }
    };
    walk(id);
    for (const purgeId of toPurgeFromQueue) {
      this.folderRetryQueue.delete(purgeId);
    }

    await this.storage.deleteFolder(id);
    this.state.folders = this.state.folders.filter((f) => f.id !== id);

    // Orphaned assets move to root
    const orphaned = this.state.assets.filter((a) => a.folderId === id);
    for (const asset of orphaned) {
      await this.updateAsset(asset.id, { folderId: undefined });
    }

    // Phase B4: mirror server delete. Server cascades assets-to-root
    // independently per Phase A spec; we just notify it.
    if (this.remoteSync) {
      await this.remoteSync.deleteFolder(id);
      // Failure ignored — local delete already happened. Server cleans
      // up on next sync cycle if it ever adds one.
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

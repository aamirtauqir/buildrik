/**
 * BuildrikSyncProvider — Dashboard tRPC API integration for cloud sync
 *
 * Loads and saves site data from the Buildrik dashboard backend via tRPC.
 * Used when the editor is opened from the dashboard with a siteId query param.
 *
 * @module services/BuildrikSyncProvider
 * @license BSD-3-Clause
 */

import { createBuildrikApiClient } from "@buildrik/shared";
import type { PageMeta, PageSettings, ProjectData, SlugChange } from "@/shared/types/project";
import type { ElementData } from "@/shared/types/element";

/**
 * Shape of a page row returned by `pages.list`. Extended in Phase 1 to
 * include the new metadata fields. The dashboard saves via `sites.saveProject`
 * (single payload), so round-trip correctness only requires that the load
 * path map these fields through. Missing fields on legacy rows fall back to
 * safe defaults in the editor via PageManager.importPage normalization.
 */
interface DashboardPageRow {
  id: string;
  name: string;
  slug: string;
  isHomePage: boolean;
  blocks?: ElementData;
  position: number;
  settings?: PageSettings;
  /** Phase -1: applied-template state + forward-compat metadata. */
  meta?: PageMeta;
  updatedAt?: string;
  slugManuallySet?: boolean;
  slugHistory?: SlugChange[];
}

const DASHBOARD_URL =
  import.meta.env.VITE_DASHBOARD_URL || "http://localhost:3000";

let _client: ReturnType<typeof createBuildrikApiClient> | null = null;
function getClient() {
  if (!_client) _client = createBuildrikApiClient(DASHBOARD_URL);
  return _client;
}

const DEFAULT_ROOT: ElementData = {
  id: "root",
  type: "container",
  children: [],
};

export async function loadProject(siteId: string): Promise<ProjectData> {
  try {
    const client = getClient();
    const site = await client.sites.get.query({ id: siteId });
    const pages = await client.pages.list.query({ siteId });

    // Sort by position once, then map — Phase 1 round-trips the new fields
    // (updatedAt, slugManuallySet, slugHistory, settings) so folder/slug-redirect/
    // custom-head/etc. data survives the dashboard save boundary.
    const sortedPages: DashboardPageRow[] = (pages as DashboardPageRow[])
      .slice()
      .sort((a, b) => a.position - b.position);

    return {
      version: "1.0",
      pagesOrder: sortedPages.map((p) => p.id),
      pages: sortedPages.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        isHome: p.isHomePage,
        root: p.blocks ?? DEFAULT_ROOT,
        settings: p.settings,
        // Phase -1: meta carries applied-template state + forward-compat keys.
        // Server returns null for un-set; coerce to undefined so editor uses spread-undefined semantics.
        meta: p.meta ?? undefined,
        updatedAt: p.updatedAt,
        slugManuallySet: p.slugManuallySet ?? false,
        slugHistory: p.slugHistory ?? [],
      })),
      styles: [],
      assets: [],
      metadata: {
        name: site.name,
        // Domain lives on the dashboard site record; read-through for copy-link
        // and SEO preview. Falls back to undefined if not configured.
        domain: (site as { domain?: string }).domain,
      },
    };
  } catch (cause) {
    const error = cause instanceof Error ? cause : new Error(String(cause));
    throw new Error(`BuildrikSyncProvider.loadProject failed for site ${siteId}: ${error.message}`, { cause: error });
  }
}

export async function saveProject(
  siteId: string,
  projectData: ProjectData
): Promise<{ success: boolean; savedAt: Date }> {
  return getClient().sites.saveProject.mutate({ siteId, projectData });
}

/**
 * Phase B3: fetch server assets + folders for hydration into MediaManager.
 *
 * Returns null on auth fail, offline, dashboard unconfigured, or any RPC
 * error — caller (useComposerInit) skips the import step and falls back
 * to engine-only state. We DO NOT throw because asset hydration is
 * additive; missing it should not block project load.
 */
export async function loadServerMedia(
  siteId: string,
): Promise<{
  assets: ReadonlyArray<{
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
  }>;
  folders: ReadonlyArray<{
    id: string;
    name: string;
    parentId: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
  }>;
} | null> {
  try {
    const client = getClient();
    // Cap initial pull at 200 — UI can paginate via media.listAssets cursor
    // once user opens MediaTab. Per spec: B3 pulls a working set, not
    // unbounded history.
    const [assetsResult, foldersResult] = await Promise.all([
      client.media.listAssets.query({ siteId, limit: 200 }),
      client.media.listFolders.query({ siteId }),
    ]);
    // tRPC's inferred return shape includes Prisma scalars + extras
    // (_count for folders, nextCursor for paginated assets). The engine's
    // importServerAssets only reads the fields below, so we narrow via
    // `unknown` to satisfy TS without re-stating every Prisma column.
    const items = (assetsResult as { items: unknown }).items as ReadonlyArray<{
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
    }>;
    const folders = foldersResult as unknown as ReadonlyArray<{
      id: string;
      name: string;
      parentId: string | null;
      createdAt: string | Date;
      updatedAt: string | Date;
    }>;
    return { assets: items, folders };
  } catch {
    // Auth fail / offline / unconfigured — caller continues with engine state.
    return null;
  }
}

export function getSiteIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("siteId");
}

/**
 * Returns StorageConfig handlers for the Buildrik dashboard API.
 * Wire into AquibraStudio via options.storage.handlers.
 */
export function getBuildrikStorageHandlers(siteId: string) {
  return {
    load: () => loadProject(siteId),
    save: (data: ProjectData) =>
      saveProject(siteId, data).then(() => undefined),
  };
}

/**
 * Initialize Buildrik sync on a Composer instance.
 * Loads the project and sets up auto-save on PROJECT_CHANGED events.
 */
export async function initBuildrikSync(
  composer: {
    importProject: (data: ProjectData) => void;
    exportProject: () => ProjectData;
    on: (event: string, cb: () => void) => void;
    emit: (event: string) => void;
  },
  siteId: string,
  onSaveError?: (error: Error) => void
): Promise<void> {
  const data = await loadProject(siteId);
  composer.importProject(data);

  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  let isSaving = false;
  let pendingChanges = false;
  composer.on("project:changed", () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    if (isSaving) {
      pendingChanges = true;
      return;
    }
    saveTimeout = setTimeout(() => {
      isSaving = true;
      const projectData = composer.exportProject();
      saveProject(siteId, projectData)
        .catch((err: unknown) => {
          const error = err instanceof Error ? err : new Error("Save failed");
          console.error("[BuildrikSync] save failed, retrying once:", error.message);
          return saveProject(siteId, projectData);
        })
        .catch((retryErr: unknown) => {
          const retryError = retryErr instanceof Error ? retryErr : new Error("Save retry failed");
          console.error("[BuildrikSync] retry failed:", retryError.message);
          onSaveError?.(retryError);
        })
        .finally(() => {
          isSaving = false;
          if (pendingChanges) {
            pendingChanges = false;
            composer.emit("project:changed");
          }
        });
    }, 5000);
  });
}

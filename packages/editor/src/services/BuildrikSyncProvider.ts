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
import type { PageMeta, PageSettings, ProjectData, SiteSEO, SlugChange } from "@/shared/types/project";
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

/**
 * P0.2b SSOT: shape of Site columns that mirror editor projectSettings fields.
 * `siteDetail.settings.get` returns these alongside name/slug/etc.
 */
interface SiteColumnSettings {
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaTitleTemplate?: string | null;
  ogImage?: string | null;
  headCode?: string | null;
  bodyCode?: string | null;
  socialLinks?: Record<string, string> | null;
  publishedPassword?: string | null;
  touchIcon?: string | null;
}

/**
 * Extract Site-column fields from editor projectSettings. Returns only fields
 * that are present (non-undefined) so the tRPC payload doesn't accidentally
 * null out untouched server values via partial update semantics.
 *
 * Editor → server name mapping:
 *   settings.seo.metaTitle          → metaTitle
 *   settings.seo.metaDescription    → metaDescription
 *   settings.seo.metaTitleTemplate  → metaTitleTemplate
 *   settings.seo.defaultOgImage     → ogImage
 *   settings.seo.touchIcon          → touchIcon
 *   settings.seo.socialLinks        → socialLinks
 *   settings.customCode.headScripts → headCode
 *   settings.customCode.bodyScripts → bodyCode
 *   settings.publishing.publishedPassword → publishedPassword
 */
function extractSiteColumnPatch(projectData: ProjectData): SiteColumnSettings {
  const settings = projectData.settings;
  if (!settings) return {};
  const seo = settings.seo;
  const customCode = settings.customCode;
  const publishing = settings.publishing;
  const patch: SiteColumnSettings = {};
  if (seo?.metaTitle !== undefined) patch.metaTitle = seo.metaTitle;
  if (seo?.metaDescription !== undefined) patch.metaDescription = seo.metaDescription;
  if (seo?.metaTitleTemplate !== undefined) patch.metaTitleTemplate = seo.metaTitleTemplate;
  if (seo?.defaultOgImage !== undefined) patch.ogImage = seo.defaultOgImage;
  if (seo?.touchIcon !== undefined) patch.touchIcon = seo.touchIcon;
  if (seo?.socialLinks !== undefined) patch.socialLinks = seo.socialLinks as Record<string, string>;
  if (customCode?.headScripts !== undefined) patch.headCode = customCode.headScripts;
  if (customCode?.bodyScripts !== undefined) patch.bodyCode = customCode.bodyScripts;
  if (publishing?.publishedPassword !== undefined) patch.publishedPassword = publishing.publishedPassword;
  return patch;
}

/**
 * Inverse of extractSiteColumnPatch: merge Site columns into editor's
 * projectSettings shape on load. Server is canonical for these fields,
 * so any value present on the Site row wins over projectSettings JSON.
 */
function mergeSiteColumnsIntoSettings(
  baseSettings: ProjectData["settings"],
  siteCols: SiteColumnSettings
): ProjectData["settings"] {
  const settings = { ...(baseSettings ?? {}) };
  const seo = { ...(settings.seo ?? {}) };
  const customCode = { ...(settings.customCode ?? { headScripts: "", bodyScripts: "", globalCss: "" }) };
  const publishing = { ...(settings.publishing ?? {}) };

  if (siteCols.metaTitle != null) seo.metaTitle = siteCols.metaTitle;
  if (siteCols.metaDescription != null) seo.metaDescription = siteCols.metaDescription;
  if (siteCols.metaTitleTemplate != null) seo.metaTitleTemplate = siteCols.metaTitleTemplate;
  if (siteCols.ogImage != null) seo.defaultOgImage = siteCols.ogImage;
  if (siteCols.touchIcon != null) seo.touchIcon = siteCols.touchIcon;
  if (siteCols.socialLinks != null) seo.socialLinks = siteCols.socialLinks as SiteSEO["socialLinks"];
  if (siteCols.headCode != null) customCode.headScripts = siteCols.headCode;
  if (siteCols.bodyCode != null) customCode.bodyScripts = siteCols.bodyCode;
  // publishedPassword: server redacts the hash on read (returns null if redacted
  // OR not set). We can't distinguish those here, so we never round-trip null —
  // user must explicitly type a new value to change it. The hasPublishedPassword
  // boolean (from server) is the authoritative "is a password set" indicator.
  if (siteCols.publishedPassword) publishing.publishedPassword = siteCols.publishedPassword;

  settings.seo = seo;
  settings.customCode = customCode;
  settings.publishing = publishing;
  return settings;
}

export async function loadProject(siteId: string): Promise<ProjectData> {
  try {
    const client = getClient();
    // P0.2b: pull Site columns alongside core site + pages so editor's view
    // of metaTitle/etc reflects what the dashboard saved.
    const [site, pages, settingsResult] = await Promise.all([
      client.sites.get.query({ id: siteId }),
      client.pages.list.query({ siteId }),
      client.siteDetail.settings.get.query({ siteId }).catch(() => null),
    ]);

    const sortedPages: DashboardPageRow[] = (pages as DashboardPageRow[])
      .slice()
      .sort((a, b) => a.position - b.position);

    const baseSettings = undefined; // load-from-server: projectSettings JSON not exported by sites.get yet
    const mergedSettings = settingsResult
      ? mergeSiteColumnsIntoSettings(baseSettings, settingsResult as SiteColumnSettings)
      : baseSettings;

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
        meta: p.meta ?? undefined,
        updatedAt: p.updatedAt,
        slugManuallySet: p.slugManuallySet ?? false,
        slugHistory: p.slugHistory ?? [],
      })),
      styles: [],
      assets: [],
      settings: mergedSettings,
      metadata: {
        name: site.name,
        domain: (site as { domain?: string }).domain,
      },
    };
  } catch (cause) {
    const error = cause instanceof Error ? cause : new Error(String(cause));
    throw new Error(`BuildrikSyncProvider.loadProject failed for site ${siteId}: ${error.message}`, { cause: error });
  }
}

/**
 * P0.2b dual-save: routes Site-column fields to siteDetail.settings.update
 * (canonical for those fields server-side) and the rest of projectData to
 * sites.saveProject (page tree, element data, non-mirrored config).
 *
 * Both calls run in parallel. If only one half changes, the other is skipped.
 */
export async function saveProject(
  siteId: string,
  projectData: ProjectData
): Promise<{ success: boolean; savedAt: Date }> {
  const client = getClient();
  const siteColumnPatch = extractSiteColumnPatch(projectData);
  const hasSiteColumnChanges = Object.keys(siteColumnPatch).length > 0;

  const calls: Array<Promise<unknown>> = [
    client.sites.saveProject.mutate({ siteId, projectData }),
  ];
  if (hasSiteColumnChanges) {
    calls.push(
      client.siteDetail.settings.update.mutate({ id: siteId, ...siteColumnPatch })
    );
  }

  const [primaryResult] = await Promise.all(calls);
  return primaryResult as { success: boolean; savedAt: Date };
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

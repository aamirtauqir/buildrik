/**
 * BuildrikSyncProvider — Dashboard tRPC API integration for cloud sync
 *
 * Loads and saves site data from the Buildrik dashboard backend via tRPC.
 * Used when the editor is opened from the dashboard with a siteId query param.
 *
 * @module services/BuildrikSyncProvider
 * @license BSD-3-Clause
 */

import { createBuildrikApiClient } from "./api-client";
import { DASHBOARD_URL } from "../shared/utils/runtimeEnv";
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

let _client: ReturnType<typeof createBuildrikApiClient> | null = null;
function getClient() {
  if (!_client) _client = createBuildrikApiClient(DASHBOARD_URL);
  return _client;
}

// 61-conflict: the lastEditedAt this editor loaded / last successfully saved.
// Sent with each save so the server can detect a behind-copy. Updated on every
// successful save; the caller may force it (to the server's value) to overwrite.
let _baselineLastEditedAt: string | null = null;

/** Assets per `loadServerMedia` page. The drawer's "Load more" walks the rest.
 *  Not exported: nothing outside this module decides the page size, and an
 *  export with no importer is what `gate:ds-ssot` calls a dead export. */
const MEDIA_PAGE_SIZE = 200;

/* Site ids whose project actually came back from the server this session.
   A save is only safe for a site in this set: `saveProjectData` treats a
   full snapshot as authoritative and DELETES pages the payload omits, so
   saving a project the editor never loaded replaces the real site with
   whatever the fallback put on screen. Verified on a scratch site — one
   blocked load plus one inserted element turned a 2-page site into a single
   "Page 1". `initBuildrikSync`'s empty-project guard does not cover this: the
   fallback project has a child, so it counts as content. */
const _loadedSites = new Set<string>();

/* Sites the server says do not exist. A refused save is not the same story for
   these: "Reload to get the real site" is the right advice for a load that
   failed once, and a lie for a site that has been deleted — the reload returns
   the same 404 forever. */
const _missingSites = new Set<string>();

/** A save refused because the site's project never loaded — not a failure to
 *  reach the server, and deliberately worded so the network-error branch in
 *  useSaveCallback does not claim it. */
export class ProjectNotLoadedError extends Error {
  constructor(
    public readonly siteId: string,
    /** The server answered NOT_FOUND — this site is gone, not merely unloaded. */
    public readonly missing = false,
  ) {
    super(
      (missing ? "SITE_MISSING " : "") +
        `PROJECT_NOT_LOADED: refusing to save site ${siteId} — its project never loaded this session, ` +
        "so this save would replace the stored pages with what the fallback put on screen.",
    );
    this.name = "ProjectNotLoadedError";
  }
}

/** Thrown by saveProject when the server rejects a behind-copy. Carries the
 *  server's current lastEditedAt so the UI can offer "Reload latest". */
export class SaveConflictError extends Error {
  constructor(public serverLastEditedAt: string) {
    super("SAVE_CONFLICT");
    this.name = "SaveConflictError";
  }
}

/** Force the baseline (e.g. after the user chooses "Overwrite"), so the next
 *  save matches the server and wins. */
export function setBaselineLastEditedAt(iso: string | null): void {
  _baselineLastEditedAt = iso;
}

// Conflict signal — emitted on a window CustomEvent so BOTH manual save and
// autosave surface the same dialog, decoupled from module-instance identity
// (the editor's "emit events, UI subscribes" convention). The shell listens for
// `buildrik:save-conflict`.
export const SAVE_CONFLICT_EVENT = "buildrik:save-conflict";
function emitSaveConflict(serverLastEditedAt: string): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SAVE_CONFLICT_EVENT, { detail: { serverLastEditedAt } }));
  }
}

/**
 * The pages saved and the site-column mirror beside them did not.
 *
 * These two ride in one batch, and `Promise.all` made either one failing read
 * as "Save failed — retry" for both. It happened for real: `ogImage: ""` is
 * not a URL, so every site without an OG image saved its pages under a red
 * banner. The page save is the one the status chip is about; a refused mirror
 * is its own, smaller sentence.
 */
export const SETTINGS_MIRROR_ERROR_EVENT = "buildrik:settings-mirror-error";
function emitSettingsMirrorError(message: string): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SETTINGS_MIRROR_ERROR_EVENT, { detail: { message } }));
  }
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
/** "" is how a text input says "cleared"; null is how the server hears it. */
function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = typeof value === "string" ? value.trim() : value;
  return trimmed ? trimmed : null;
}

function extractSiteColumnPatch(projectData: ProjectData): SiteColumnSettings {
  const settings = projectData.settings;
  if (!settings) return {};
  const seo = settings.seo;
  const customCode = settings.customCode;
  const publishing = settings.publishing;
  const patch: SiteColumnSettings = {};
  if (seo?.metaTitle !== undefined) patch.metaTitle = emptyToNull(seo.metaTitle);
  if (seo?.metaDescription !== undefined) patch.metaDescription = emptyToNull(seo.metaDescription);
  if (seo?.metaTitleTemplate !== undefined) patch.metaTitleTemplate = emptyToNull(seo.metaTitleTemplate);
  /* Empty means "cleared", and the server's contract for cleared is null —
     `ogImage` is `z.string().url().nullable().optional()`, so "" is neither a
     URL nor null and the whole settings mutation 400s. It rides in the same
     batch as `sites.saveProject`, so the page content saved and the topbar
     still said "Save failed — retry": every site that never set an OG image
     (the SEO screen writes "" for an untouched field) saved under a red
     banner. Measured live — batch 207, `ogImage: Invalid url`. */
  if (seo?.defaultOgImage !== undefined) patch.ogImage = emptyToNull(seo.defaultOgImage);
  if (seo?.touchIcon !== undefined) patch.touchIcon = emptyToNull(seo.touchIcon);
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
  baseSettings: ProjectData["settings"] | undefined,
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

// Workspace plan for the currently-open site, captured at load time so the
// editor's plan-gated UI (SettingsTab Custom-code / Integrations screens) can
// read the REAL tier instead of defaulting everyone to "starter". Dashboard
// plans (FREE/PRO/BUSINESS) map to the editor's tiers (starter/pro/enterprise).
type EditorPlanTier = "starter" | "pro" | "enterprise";
let _editorPlanTier: EditorPlanTier = "starter";

function mapDashboardPlan(plan: unknown): EditorPlanTier {
  if (plan === "PRO") return "pro";
  if (plan === "BUSINESS") return "enterprise";
  return "starter";
}

/** Plan tier for the open site. Valid after loadProject resolves. */
export function getEditorPlanTier(): EditorPlanTier {
  return _editorPlanTier;
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

    // tRPC `pages.list` returns Prisma rows with Json columns typed as
    // JsonValue. Runtime shape matches DashboardPageRow (blocks/settings/meta
    // are persisted typed at write time + validated via shared schemas).
    // Two-step `unknown as` cast satisfies TS — JsonValue → typed shape
    // doesn't structurally overlap without the bridge.
    const sortedPages: DashboardPageRow[] = (pages as unknown as DashboardPageRow[])
      .slice()
      .sort((a, b) => a.position - b.position);

    // sites.get returns the full Site row including the projectSettings Json
    // column (Prisma findFirst defaults to selecting all scalars). Pull that
    // as the base so non-mirrored settings (e.g. things only persisted in the
    // JSON blob) survive editor reload from dashboard.
    const baseSettings = (site as { projectSettings?: unknown }).projectSettings as
      | ProjectData["settings"]
      | undefined;
    const mergedSettings = settingsResult
      ? mergeSiteColumnsIntoSettings(baseSettings, settingsResult as SiteColumnSettings)
      : baseSettings;

    // Capture the workspace plan so plan-gated editor UI reads the real tier.
    _editorPlanTier = mapDashboardPlan((settingsResult as { plan?: unknown } | null)?.plan);

    // 61-conflict: record the load-time version as the save baseline.
    const loadedLastEditedAt = (site as { lastEditedAt?: string | Date | null }).lastEditedAt;
    _baselineLastEditedAt = loadedLastEditedAt ? new Date(loadedLastEditedAt).toISOString() : null;
    // Same moment, same fact: this site's project is now known-good in memory,
    // which is the only condition under which saving over it is safe.
    _loadedSites.add(siteId);

    return {
      version: "1.0",
      pagesOrder: sortedPages.map((p) => p.id),
      pages: sortedPages.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        isHome: p.isHomePage,
        root: (p.blocks && typeof p.blocks === "object" && !Array.isArray(p.blocks))
          ? p.blocks
          : DEFAULT_ROOT,
        settings: p.settings,
        meta: p.meta ?? undefined,
        updatedAt: p.updatedAt,
        slugManuallySet: p.slugManuallySet ?? false,
        slugHistory: p.slugHistory ?? [],
      })),
      // projectStyles holds StyleEngine CSS rules ({id, selector, properties}).
      // Legacy data also contains design-token entries ({id, kind, cssVar, ...})
      // from before tokens migrated to TokenRegistry — those fail StyleEngine
      // validation and warn "dropped N malformed rule(s)" on every site open.
      // Filter at load so only real CSS rules reach the engine; tokens are
      // hydrated separately by the DS layer.
      styles: (Array.isArray((site as { projectStyles?: unknown }).projectStyles)
        ? ((site as { projectStyles: unknown[] }).projectStyles as unknown[]).filter(
            (s): s is { selector: string } =>
              s != null &&
              typeof s === "object" &&
              typeof (s as { selector?: unknown }).selector === "string" &&
              (s as { selector: string }).selector.length > 0
          )
        : []) as ProjectData["styles"],
      assets: [],
      settings: mergedSettings,
      dsSchemaVersion: (site as { dsSchemaVersion?: number }).dsSchemaVersion ?? 0,
      metadata: {
        name: site.name,
        domain: (site as { domain?: string }).domain,
      },
    };
  } catch (cause) {
    const error = cause instanceof Error ? cause : new Error(String(cause));
    if (/not_found/i.test(error.message)) _missingSites.add(siteId);
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
  if (!_loadedSites.has(siteId)) {
    throw new ProjectNotLoadedError(siteId, _missingSites.has(siteId));
  }
  const client = getClient();
  const siteColumnPatch = extractSiteColumnPatch(projectData);
  const hasSiteColumnChanges = Object.keys(siteColumnPatch).length > 0;

  // Both mutations start in the same tick so the httpBatchLink still batches
  // them; they are AWAITED separately so one cannot speak for the other.
  const primaryCall = client.sites.saveProject.mutate({
    siteId,
    projectData,
    // 61-conflict: opt into behind-copy detection.
    expectedLastEditedAt: _baselineLastEditedAt,
  });
  const settingsCall = hasSiteColumnChanges
    ? client.siteDetail.settings.update
        .mutate({ id: siteId, ...siteColumnPatch })
        .then(() => null)
        .catch((e: unknown) => (e instanceof Error ? e.message : String(e)))
    : null;

  let primaryResult: unknown;
  try {
    primaryResult = await primaryCall;
  } catch (err) {
    // Translate the server's CONFLICT into a typed error the shell can catch to
    // show the conflict dialog (rather than a generic save-failed toast).
    const msg = err instanceof Error ? err.message : String(err);
    const match = /SAVE_CONFLICT:(.+)$/.exec(msg);
    if (match) {
      const serverToken = match[1].trim();
      emitSaveConflict(serverToken);
      throw new SaveConflictError(serverToken);
    }
    throw err;
  }

  const mirrorError = settingsCall ? await settingsCall : null;
  if (mirrorError) emitSettingsMirrorError(mirrorError);

  const result = primaryResult as { success: boolean; savedAt: Date };
  // Advance the baseline so the editor's own next save isn't seen as a conflict.
  _baselineLastEditedAt = new Date(result.savedAt).toISOString();
  return result;
}

/**
 * Who is editing, for attribution on versions and history entries.
 *
 * Both `VersionTimelineManager.setCurrentUserId` and
 * `HistoryManager.setCurrentUserId` existed with **zero callers**, so
 * `currentUserId` was permanently null and six write sites stamped that null
 * into stored rows (`VersionTimelineManager.ts:172,238`,
 * `HistoryManager.ts:203,213,302`). Board 162:2 attributes rows; nothing could,
 * because nothing was ever recorded.
 *
 * Returns null rather than throwing: attribution is additive, and a signed-out
 * or offline editor must still save versions.
 */
export async function loadCurrentUserId(): Promise<string | null> {
  try {
    const profile = await getClient().account.profile.get.query();
    return profile?.id ?? null;
  } catch {
    return null;
  }
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
  cursor?: string,
  search?: string,
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
  nextCursor: string | null;
  /** Counted once per pull — null on any page after the first. */
  total: number | null;
} | null> {
  try {
    const client = getClient();
    /* A page at a time, and the page's own edges come back with it. The cap
       used to be a bare `limit: 200` under a comment saying the UI could
       paginate "once user opens MediaTab" — and no cursor consumer was ever
       built, so `media.listAssets` had exactly one caller in the whole editor,
       this one, which threw `nextCursor` away. A site past 200 assets showed
       200, silently, and the grid, the picker and replace-across-site all read
       that same truncated set. */
    const [assetsResult, foldersResult] = await Promise.all([
      client.media.listAssets.query({
        siteId,
        limit: MEDIA_PAGE_SIZE,
        ...(cursor ? { cursor } : {}),
        /* Sent so a search can reach assets this browser has never pulled. The
           drawer's type, folder and search filters all run on the client over
           the loaded set, so on a 412-asset library a search reached 200 of
           them and quietly reported "Nothing matches" for a file that exists.
           `listAssets` has always accepted this argument; nothing ever sent it. */
        ...(search ? { search } : {}),
      }),
      /* Fetched on EVERY page, including "load more". Skipping it read as a
         free optimisation — folders are not paged — but folders are not FROZEN
         either: create a folder in another tab and move an asset into it
         between page 1 and page 2, and page 2 imports an asset whose
         `folderId` names a folder this browser has never heard of. The root
         view filters it out for having a non-null folderId, no picker entry
         exists for it, and the asset is simply invisible. (Codex review,
         2026-08-24.) */
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
    const page = assetsResult as { nextCursor?: string | null; total?: number | null };
    return {
      assets: items,
      folders,
      nextCursor: page.nextCursor ?? null,
      /* null on a later page — the server counts once per pull, and the caller
         keeps the total it already holds. Only the FIRST pull falls back to the
         page length, for a server that has not shipped the count. */
      total: typeof page.total === "number" ? page.total : cursor ? null : items.length,
    };
  } catch {
    // Auth fail / offline / unconfigured — caller continues with engine state.
    return null;
  }
}

export function getSiteIdFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const pathMatch = window.location.pathname.match(/^\/edit\/([^/?#]+)/);
  if (pathMatch) {
    try {
      return decodeURIComponent(pathMatch[1]);
    } catch {
      return pathMatch[1];
    }
  }
  return new URLSearchParams(window.location.search).get("siteId");
}

/* `initBuildrikSync` lived here until 2026-08-19: a second autosave loop —
   load, import, debounce on project:changed, save, retry once — that nothing
   ever called. The shipping path is `useComposerInit` (load + autosave) and
   `useSaveCallback` (manual). It also carried the only copy of the
   2026-06-04 fixture-wipe guard, which refused a save when no CONTENT had
   been observed. That guard did not fit the failure it was written for: a
   failed load leaves a fallback project on screen, and the fallback has a
   child, so it counts as content and the wipe went through anyway (proved on
   a scratch site — 2 pages became one). The protection now lives at the write
   boundary as `_loadedSites` + `ProjectNotLoadedError`, where every caller
   gets it. Do not re-add a loop here; wire the shell instead.

   `getBuildrikStorageHandlers` went the same way 2026-08-20 — a {load, save}
   pair that delegated straight to loadProject/saveProject, documented as "wire
   into AquibraStudio via options.storage.handlers", wired into nothing. */

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
import { fetchMyRole, roleAtLeast } from "./RoleService";
import { resumeKeepingUnsaved } from "./unsavedRecovery";
import { DASHBOARD_URL } from "../shared/utils/runtimeEnv";
import { dropSessionMediaUrls } from "@/shared/utils/html";
import type { PageMeta, PageSettings, ProjectData, ProjectSettings, SiteSEO, SlugChange } from "@/shared/types/project";
import type { ProjectSettingsPatch } from "@buildrik/shared/schemas/project-settings";
import type { updateSiteSettingsSchema } from "@buildrik/shared/schemas/site-detail";
import { SITE_COLUMN_FIELDS } from "@buildrik/shared/schemas/site-column-fields";
import type { z } from "zod";
import type { ElementData } from "@/shared/types/element";
import { blankPageRoot } from "@buildrik/shared/content/elementIds";

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

/* A-2 / PD-11: set when the server refused a behind-copy, cleared only when the
   user resolves it (Overwrite adopts the server token; Reload re-loads). While
   it stands, autosave holds back: every further autosave would carry the same
   stale token, be refused again, and re-raise the dialog the user just
   dismissed — the "Conflict — reload" pill is the standing notice instead. */
let _conflictToken: string | null = null;

/** Whether a save conflict is waiting on the user's choice. Autosave reads it
 *  and holds the edit; a manual save is not sent either — saveProjectNow
 *  refuses with the held SaveConflictError, which re-surfaces the dialog. */
export function isSaveConflictPending(): boolean {
  return _conflictToken !== null;
}

/** The server token the pending conflict was raised with, or null. The
 *  Inspector's "Resolve" re-sends SAVE_CONFLICT_EVENT with it, which reopens
 *  the conflict dialog the user dismissed (board 29). */
export function getPendingConflictToken(): string | null {
  return _conflictToken;
}

/** Dispatched on `window` when a pending conflict is resolved — Overwrite
 *  adopted the server token, or a fresh load replaced the copy. */
export const SAVE_CONFLICT_CLEARED_EVENT = "buildrik:save-conflict-cleared";

function clearConflictToken(): void {
  if (_conflictToken === null) return;
  _conflictToken = null;
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(SAVE_CONFLICT_CLEARED_EVENT));
}

/* A-1 / PD-1: the Site-column values this editor last knew the server held —
   captured at load, advanced after each successful mirror. The mirror sends
   only what differs from it, so a dashboard edit to a field this editor never
   touched is no longer overwritten with the load-time copy on every autosave. */
let _baselineSiteColumns: SiteColumnSettings = {};

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

/* SA-01: sites whose Site-column settings did not load this session (the read
   failed twice). The columns are the only source of the column-backed
   settings, so such a session renders pages without their title template,
   icons, OG image or head/body code — publishing it is refused. */
const _siteColumnsMissing = new Set<string>();

/** Whether the open site's Site-column settings loaded. Publish reads it. */
export function siteColumnsLoaded(siteId: string): boolean {
  return !_siteColumnsMissing.has(siteId);
}

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
  clearConflictToken();
}

// Conflict signal — emitted on a window CustomEvent so BOTH manual save and
// autosave surface the same dialog, decoupled from module-instance identity
// (the editor's "emit events, UI subscribes" convention). The shell listens for
// `buildrik:save-conflict`.
export const SAVE_CONFLICT_EVENT = "buildrik:save-conflict";

/** Read a server `SAVE_CONFLICT:<iso>` refusal — from a save OR a publish
 *  (C-3) — into the one conflict state: hold autosave, raise the dialog, and
 *  hand back the typed error. Returns null for any other failure. */
export function raiseSaveConflict(err: unknown): SaveConflictError | null {
  const msg = err instanceof Error ? err.message : String(err);
  const match = /SAVE_CONFLICT:(.+)$/.exec(msg);
  if (!match) return null;
  _conflictToken = match[1].trim();
  return announceConflict(_conflictToken);
}

function announceConflict(serverToken: string): SaveConflictError {
  /* A conflict raised after a Reload whose unload prompt was cancelled: the
     page lives on, and its refused work must be kept again. */
  resumeKeepingUnsaved();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SAVE_CONFLICT_EVENT, { detail: { serverLastEditedAt: serverToken } }));
  }
  return new SaveConflictError(serverToken);
}

/** C-3: the freshness token a publish carries. Read only once every save
 *  already in flight has landed — a save advances the server's lastEditedAt
 *  before its response advances this baseline, and reading in that gap would
 *  refuse the tab's publish over its own save. */
export async function settledBaselineLastEditedAt(): Promise<string | null> {
  await _saveChain;
  return _baselineLastEditedAt;
}

/**
 * The pages saved and the site-column mirror beside them did not.
 *
 * These two used to ride in one batch, and `Promise.all` made either one
 * failing read as "Save failed — retry" for both. It happened for real: `ogImage: ""` is
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


/**
 * P0.2b SSOT: shape of Site columns that mirror editor projectSettings fields.
 * `siteDetail.settings.get` returns these alongside name/slug/etc.
 */
interface SiteColumnSettings {
  name?: string;
  favicon?: string | null;
  defaultLocale?: string;
  enabledLocales?: string[];
  localeAutoRedirect?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaTitleTemplate?: string | null;
  ogImage?: string | null;
  allowIndexing?: boolean;
  robotsTxt?: string | null;
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
 *   settings.seo.siteName           → name
 *   settings.seo.favicon            → favicon
 *   settings.seo.language           → defaultLocale
 *   settings.seo.metaTitle          → metaTitle
 *   settings.seo.metaDescription    → metaDescription
 *   settings.seo.metaTitleTemplate  → metaTitleTemplate
 *   settings.seo.defaultOgImage     → ogImage
 *   settings.seo.allowIndexing      → allowIndexing
 *   settings.seo.robotsTxt          → robotsTxt
 *   settings.seo.touchIcon          → touchIcon
 *   settings.seo.socialLinks        → socialLinks
 *   settings.customCode.headScripts → headCode
 *   settings.customCode.bodyScripts → bodyCode
 *   settings.publishing.publishedPassword → publishedPassword
 *
 * The first three joined 2026-09-14 (Settings · Clone S1): the General screen
 * had written `seo.siteName` / `seo.favicon` / `seo.language` into the
 * project JSON for months while `Site.name`, `Site.favicon` and
 * `Site.defaultLocale` — the columns the dashboard, the publish worker and
 * the document `lang` read — never heard about it.
 */
/** "" is how a text input says "cleared"; null is how the server hears it. */
function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = typeof value === "string" ? value.trim() : value;
  return trimmed ? trimmed : null;
}

/**
 * Reads exactly SITE_COLUMN_FIELDS (`@buildrik/shared/schemas/site-column-fields`)
 * — each one is a Site column the dashboard owns, mirrored from the editor
 * only for an ADMIN (A-1).
 * The Settings screens lock exactly these below ADMIN (M7 / PD-1);
 * `siteColumnFields.test.ts` pins this list to the function's reads, so a new
 * mirrored field cannot land without being locked, and project data (Author,
 * Twitter handle, Global CSS) is never locked by mistake. SA-01: the list
 * lives in `@buildrik/shared` because the server strips the same fields from
 * the stored projectSettings.
 */
export function extractSiteColumnPatch(settings: ProjectSettings | undefined): SiteColumnSettings {
  if (!settings) return {};
  const seo = settings.seo;
  const customCode = settings.customCode;
  const publishing = settings.publishing;
  const patch: SiteColumnSettings = {};
  /* `name` and `defaultLocale` are required columns (`z.string().min(2)` /
     `.min(2)`, no null) — "cleared" cannot be sent, so an empty field leaves
     the column as it is. A too-short value IS sent: the server refuses it and
     the screen's banner says so, which is the honest answer to a one-letter
     site name (the field warns first). */
  const name = emptyToNull(seo?.siteName);
  if (name !== null) patch.name = name;
  if (seo?.favicon !== undefined) patch.favicon = emptyToNull(seo.favicon);
  const defaultLocale = emptyToNull(seo?.language);
  if (defaultLocale !== null) patch.defaultLocale = defaultLocale;
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
  if (seo?.allowIndexing !== undefined) patch.allowIndexing = seo.allowIndexing;
  /* Round-trips what the row carried: the editor only previews robots.txt
     (Clone 3397:32076), the dashboard's SEO tab edits it. */
  if (seo?.robotsTxt !== undefined) patch.robotsTxt = emptyToNull(seo.robotsTxt);
  if (seo?.touchIcon !== undefined) patch.touchIcon = emptyToNull(seo.touchIcon);
  if (seo?.socialLinks !== undefined) patch.socialLinks = seo.socialLinks as Record<string, string>;
  if (customCode?.headScripts !== undefined) patch.headCode = customCode.headScripts;
  if (customCode?.bodyScripts !== undefined) patch.bodyCode = customCode.bodyScripts;
  if (publishing?.publishedPassword !== undefined) patch.publishedPassword = publishing.publishedPassword;
  return patch;
}

// ─── Settings Save (Phase B, BE-3) ──────────────────────────────────────────
// The Settings footer's Save writes through the two settings mutations, never
// `sites.saveProject`: Site-column fields → `siteDetail.settings.update`, the
// JSON-only keys (analytics, global CSS, the 404 switch) →
// `siteDetail.projectSettings.update`. A refusal names its fields.

/** What a Settings screen may send to `siteDetail.settings.update` (its id aside). */
export type SiteColumnPatch = Omit<z.input<typeof updateSiteSettingsSchema>, "id">;

/** The Settings path each mirrored Site column is edited at — `extractSiteColumnPatch`
 *  read the other way — so a refused column names the screen's own field. */
const COLUMN_SETTING_PATHS: Readonly<Record<string, string>> = {
  name: "seo.siteName",
  favicon: "seo.favicon",
  defaultLocale: "seo.language",
  metaTitle: "seo.metaTitle",
  metaDescription: "seo.metaDescription",
  metaTitleTemplate: "seo.metaTitleTemplate",
  ogImage: "seo.defaultOgImage",
  allowIndexing: "seo.allowIndexing",
  robotsTxt: "seo.robotsTxt",
  touchIcon: "seo.touchIcon",
  socialLinks: "seo.socialLinks",
  headCode: "customCode.headScripts",
  bodyCode: "customCode.bodyScripts",
  publishedPassword: "publishing.publishedPassword",
};

/**
 * A Settings save the server refused. `fieldErrors` is keyed by the field's
 * `ProjectSettings` path (`seo.defaultOgImage`,
 * `analytics.googleAnalytics.measurementId`), or by the Site column's name for
 * a column with no settings path (`slug`, `canonicalUrl`, `cspPolicy`).
 */
export class SettingsSaveError extends Error {
  constructor(
    message: string,
    public readonly fieldErrors: Readonly<Record<string, string>> = {},
  ) {
    super(message);
    this.name = "SettingsSaveError";
  }
}

/**
 * A Settings save the user called off before anything was sent — General's
 * slug confirm answered Cancel. The shell keeps the edits and the screen as
 * they were: no "Not saved", no banner, no toast.
 */
export class SettingsSaveCancelled extends Error {
  constructor() {
    super("The save was cancelled.");
    this.name = "SettingsSaveCancelled";
  }
}

/** The tRPC error's `data.zodIssues` (server errorFormatter), each path re-keyed by `toField`. */
function refusedFields(err: unknown, toField: (serverPath: string) => string): Record<string, string> {
  const issues = (err as { data?: { zodIssues?: unknown } } | null)?.data?.zodIssues;
  const fields: Record<string, string> = {};
  if (!Array.isArray(issues)) return fields;
  for (const issue of issues) {
    const { path, message } = (issue ?? {}) as { path?: unknown; message?: unknown };
    if (typeof path === "string" && typeof message === "string") fields[toField(path)] ??= message;
  }
  return fields;
}

function asSettingsSaveError(err: unknown, toField: (serverPath: string) => string): SettingsSaveError {
  if (err instanceof SettingsSaveError) return err;
  return new SettingsSaveError(err instanceof Error ? err.message : String(err), refusedFields(err, toField));
}

const columnField = (serverPath: string) => {
  const [column, ...rest] = serverPath.split(".");
  return [COLUMN_SETTING_PATHS[column] ?? column, ...rest].join(".");
};
const projectSettingsField = (serverPath: string) => serverPath.replace(/^patch\./, "");

/** `siteDetail.settings.update` (ADMIN). Refusals throw `SettingsSaveError` with the refused fields. */
export async function updateSiteColumns(siteId: string, patch: SiteColumnPatch) {
  try {
    return await getClient().siteDetail.settings.update.mutate({ id: siteId, ...patch });
  } catch (err) {
    const refused = asSettingsSaveError(err, columnField);
    /* SLUG_TAKEN / PROJECT_NAME_TAKEN come back as a CONFLICT with no field
       path; when the save carried a slug, the slug is the field refused. */
    const code = (err as { data?: { code?: unknown } } | null)?.data?.code;
    if (code === "CONFLICT" && patch.slug !== undefined && Object.keys(refused.fieldErrors).length === 0) {
      throw new SettingsSaveError(refused.message, { slug: refused.message });
    }
    throw refused;
  }
}

/** `siteDetail.projectSettings.update` (EDITOR; ADMIN + Pro for global CSS). Refusals throw `SettingsSaveError`. */
export async function updateProjectSettings(siteId: string, patch: ProjectSettingsPatch) {
  try {
    return await getClient().siteDetail.projectSettings.update.mutate({ siteId, patch });
  } catch (err) {
    throw asSettingsSaveError(err, projectSettingsField);
  }
}

/** What one Settings Save sends, from the composer's settings before and the screen's after. */
export interface SettingsSavePlan {
  /** Mirrored Site columns whose value changed — plus any column with no
   *  settings path a screen's flush adds (`slug`, `canonicalUrl`). */
  columns: SiteColumnPatch;
  /** JSON-only keys that changed, or null. */
  projectSettings: ProjectSettingsPatch | null;
  /**
   * Some other changed key has no settings mutation yet (SEO's Twitter handle,
   * until Lane 1 merges it into Social profiles). The caller must let the
   * project save carry it rather than drop it.
   */
  unrouted: boolean;
}

const sameValue = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

/** `settings` without the keys a settings mutation writes — what is left for the project save. */
function unroutedSettings(settings: ProjectSettings): Record<string, unknown> {
  const rest: Record<string, unknown> = structuredClone({ ...settings, analytics: undefined, redirects: undefined });
  for (const field of [...SITE_COLUMN_FIELDS, "customCode.globalCss"]) {
    const [section, key] = field.split(".");
    const block = rest[section];
    if (isRecord(block)) delete block[key];
  }
  return rest;
}

export function planSettingsSave(before: ProjectSettings, next: ProjectSettings): SettingsSavePlan {
  const patch: ProjectSettingsPatch = {};
  if (next.analytics && !sameValue(before.analytics, next.analytics)) patch.analytics = next.analytics;
  if (!sameValue(before.customCode?.globalCss, next.customCode?.globalCss)) {
    patch.customCode = { globalCss: next.customCode?.globalCss ?? "" };
  }
  if (next.redirects && !sameValue(before.redirects, next.redirects)) patch.redirects = next.redirects;
  return {
    columns: diffSiteColumns(extractSiteColumnPatch(next), extractSiteColumnPatch(before)),
    projectSettings: Object.keys(patch).length > 0 ? patch : null,
    unrouted: !sameValue(unroutedSettings(before), unroutedSettings(next)),
  };
}

/**
 * Run one Settings Save's plan: both mutations at once. Either refusal fails
 * the save with every refused field named; the half that landed is repeated on
 * the retry (both writes are idempotent). Only a fully landed save advances
 * the autosave mirror's baseline — so the next autosave neither re-sends these
 * columns nor, after a partial failure, sends the old values back over them.
 */
export async function saveSiteSettings(
  siteId: string,
  plan: SettingsSavePlan,
): Promise<{ legacyAnalyticsIds: readonly string[] }> {
  const hasColumns = Object.keys(plan.columns).length > 0;
  const [columns, json] = await Promise.allSettled([
    hasColumns ? updateSiteColumns(siteId, plan.columns) : Promise.resolve(null),
    plan.projectSettings ? updateProjectSettings(siteId, plan.projectSettings) : Promise.resolve(null),
  ]);
  const refused = [columns, json].flatMap((r) =>
    r.status === "rejected" ? [asSettingsSaveError(r.reason, (path) => path)] : [],
  );
  if (refused.length > 0) {
    throw new SettingsSaveError(
      refused.map((e) => e.message).join(" "),
      Object.assign({}, ...refused.map((e) => e.fieldErrors)),
    );
  }
  if (hasColumns) _baselineSiteColumns = { ..._baselineSiteColumns, ...plan.columns };
  return { legacyAnalyticsIds: json.status === "fulfilled" && json.value ? json.value.warnings.legacyAnalyticsIds : [] };
}

/**
 * Inverse of extractSiteColumnPatch: Site columns into the editor's
 * projectSettings shape on load. SA-01: the columns are the only source for
 * SITE_COLUMN_FIELDS — a NULL column leaves the field empty, never the
 * project JSON's copy (an edit the ADMIN-only mirror never sent, or a value
 * the dashboard has since cleared).
 */
function mergeSiteColumnsIntoSettings(
  baseSettings: ProjectData["settings"] | undefined,
  siteCols: SiteColumnSettings
): ProjectData["settings"] {
  const settings = { ...(baseSettings ?? {}) };
  const seo = { ...(settings.seo ?? {}) };
  const customCode = { ...(settings.customCode ?? { headScripts: "", bodyScripts: "", globalCss: "" }) };
  const publishing = { ...(settings.publishing ?? {}) };

  seo.siteName = siteCols.name;
  seo.favicon = siteCols.favicon ?? undefined;
  seo.language = siteCols.defaultLocale;
  seo.metaTitle = siteCols.metaTitle ?? undefined;
  seo.metaDescription = siteCols.metaDescription ?? undefined;
  seo.metaTitleTemplate = siteCols.metaTitleTemplate ?? undefined;
  seo.defaultOgImage = siteCols.ogImage ?? undefined;
  seo.allowIndexing = siteCols.allowIndexing;
  seo.robotsTxt = siteCols.robotsTxt ?? undefined;
  seo.touchIcon = siteCols.touchIcon ?? undefined;
  seo.socialLinks = (siteCols.socialLinks ?? undefined) as SiteSEO["socialLinks"];
  // CustomCodeConfig's strings are required: an empty column reads as "".
  customCode.headScripts = siteCols.headCode ?? "";
  customCode.bodyScripts = siteCols.bodyCode ?? "";
  // publishedPassword: the server redacts it on read (always null), so it is
  // never loaded — the user types a new value to change it. The
  // hasPublishedPassword boolean (from server) is the authoritative "is a
  // password set" indicator.
  publishing.publishedPassword = siteCols.publishedPassword || undefined;

  settings.seo = seo;
  settings.customCode = customCode;
  settings.publishing = publishing;
  /* Read-only mirror for the export engine's auto-redirect snippet; the
     Localization screen writes these columns itself. */
  if (siteCols.defaultLocale != null) {
    settings.localization = {
      defaultLocale: siteCols.defaultLocale,
      enabledLocales: siteCols.enabledLocales ?? [siteCols.defaultLocale],
      autoRedirect: siteCols.localeAutoRedirect ?? false,
    };
  }
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

let _editorWorkspaceName: string | null = null;

/** The open site's workspace name, for the Settings workspace doors. Null before load or in the demo. */
export function getEditorWorkspaceName(): string | null {
  return _editorWorkspaceName;
}

/** Duplicate a site (`sites.duplicate`, EDITOR). Throws the server's message
 *  on refusal — e.g. the plan's site limit — so the caller can say it. */
export async function duplicateSite(siteId: string): Promise<{ id: string; name: string }> {
  const copy = await getClient().sites.duplicate.mutate({ id: siteId });
  return { id: copy.id, name: copy.name };
}

/** Delete a site (`sites.delete`, OWNER). The server checks the site's own
 *  name as the confirmation, so the caller passes it once the user has typed
 *  DELETE. Throws the server's message on refusal. */
export async function deleteSite(siteId: string, siteName: string): Promise<void> {
  await getClient().sites.delete.mutate({ id: siteId, confirmName: siteName });
}

/**
 * The dashboard's rows → the editor's ProjectData. Pure: no client, no module
 * state. `loadProject` feeds it the three tRPC reads; the `/share/<token>`
 * draft preview feeds it the same rows from the server, so a shared draft is
 * built by exactly the mapping the editor opens.
 */
export function projectDataFromRows(
  site: unknown,
  pages: unknown,
  siteColumns: unknown,
): ProjectData {
  const siteRow = site as {
    name: string;
    domain?: string;
    publishedUrl?: string | null;
    projectStyles?: unknown;
    projectSettings?: unknown;
    projectCmsBindings?: ProjectData["cmsBindings"] | null;
    dsSchemaVersion?: number;
  };
  // tRPC `pages.list` returns Prisma rows with Json columns typed as
  // JsonValue. Runtime shape matches DashboardPageRow (blocks/settings/meta
  // are persisted typed at write time + validated via shared schemas).
  const sortedPages: DashboardPageRow[] = (pages as DashboardPageRow[])
    .slice()
    .sort((a, b) => a.position - b.position);

  // sites.get returns the full Site row including the projectSettings Json
  // column (Prisma findFirst defaults to selecting all scalars). Pull that
  // as the base so non-mirrored settings (e.g. things only persisted in the
  // JSON blob) survive editor reload from dashboard.
  const baseSettings = siteRow.projectSettings as ProjectData["settings"] | undefined;
  /* No columns (the read failed) still means no JSON copy: SA-01 keeps the
     column-backed fields empty rather than loading a value that may be stale.
     `Site.name` rides on the site row too (the /share rows carry it only
     there) — the same column. */
  const mergedSettings = mergeSiteColumnsIntoSettings(baseSettings, {
    name: siteRow.name,
    ...(siteColumns as SiteColumnSettings | null),
  });

  return {
    version: "1.0",
    pagesOrder: sortedPages.map((p) => p.id),
    pages: sortedPages.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      isHome: p.isHomePage,
      /* A page that has never been saved stores `[]`. Each gets its OWN root,
         with an id derived from the page: one shared DEFAULT_ROOT object
         made every blank page one element, so an edit on one landed on all. */
      root: (p.blocks && typeof p.blocks === "object" && !Array.isArray(p.blocks))
        ? p.blocks
        : (blankPageRoot(p.id) as ElementData),
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
    styles: (Array.isArray(siteRow.projectStyles)
      ? (siteRow.projectStyles as unknown[]).filter(
          (s): s is { selector: string } =>
            s != null &&
            typeof s === "object" &&
            typeof (s as { selector?: unknown }).selector === "string" &&
            (s as { selector: string }).selector.length > 0
        )
      : []) as ProjectData["styles"],
    assets: [],
    settings: mergedSettings,
    dsSchemaVersion: siteRow.dsSchemaVersion ?? 0,
    // Stored by sites.saveProject from exportProject()'s own `cmsBindings`.
    cmsBindings: siteRow.projectCmsBindings ?? undefined,
    metadata: {
      name: siteRow.name,
      domain: siteRow.domain,
      /* Carried so the slug-change warning can ask whether this site is
         reachable at all, instead of reading a per-page field that defaults
         to off. Same loose read as `domain` above — this is the tRPC row,
         not a typed domain object. */
      publishedUrl: siteRow.publishedUrl ?? null,
    },
  };
}

export async function loadProject(siteId: string): Promise<ProjectData> {
  try {
    const client = getClient();
    // P0.2b: pull Site columns alongside core site + pages so editor's view
    // of metaTitle/etc reflects what the dashboard saved.
    // SA-01: retried once — a failed read leaves the column-backed settings empty.
    const readSiteColumns = () => client.siteDetail.settings.get.query({ siteId });
    let columnsLoaded = true;
    const [site, pages, settingsResult] = await Promise.all([
      client.sites.get.query({ id: siteId }),
      client.pages.list.query({ siteId }),
      readSiteColumns()
        .catch(readSiteColumns)
        .catch(() => {
          columnsLoaded = false;
          return null;
        }),
    ]);
    if (columnsLoaded) _siteColumnsMissing.delete(siteId);
    else _siteColumnsMissing.add(siteId);
    const data = projectDataFromRows(site, pages, settingsResult);

    // Capture the workspace plan so plan-gated editor UI reads the real tier.
    _editorPlanTier = mapDashboardPlan((settingsResult as { plan?: unknown } | null)?.plan);
    _editorWorkspaceName = settingsResult?.workspaceName ?? null;

    // 61-conflict: record the load-time version as the save baseline.
    const loadedLastEditedAt = (site as { lastEditedAt?: string | Date | null }).lastEditedAt;
    _baselineLastEditedAt = loadedLastEditedAt ? new Date(loadedLastEditedAt).toISOString() : null;
    clearConflictToken();
    _baselineSiteColumns = extractSiteColumnPatch(data.settings);
    // Same moment, same fact: this site's project is now known-good in memory,
    // which is the only condition under which saving over it is safe.
    _loadedSites.add(siteId);

    return data;
  } catch (cause) {
    const error = cause instanceof Error ? cause : new Error(String(cause));
    if (/not_found/i.test(error.message)) _missingSites.add(siteId);
    throw new Error(`BuildrikSyncProvider.loadProject failed for site ${siteId}: ${error.message}`, { cause: error });
  }
}

/* Saves run one at a time. Two in flight at once (autosave + ⌘S, 180 ms
   apart on the walk) both carried the same `expectedLastEditedAt`; the first
   advanced the server's row, so the second read as another writer's change —
   a false "Conflict — reload" with nobody else on the site. Chained, each save
   leaves with the baseline the previous one returned. */
let _saveChain: Promise<unknown> = Promise.resolve();

export function saveProject(
  siteId: string,
  projectData: ProjectData
): Promise<{ success: boolean; savedAt: Date }> {
  const run = _saveChain.then(
    () => saveProjectNow(siteId, projectData),
    () => saveProjectNow(siteId, projectData),
  );
  _saveChain = run.catch(() => undefined);
  return run;
}

/** The mirrored fields whose value differs from what the server was last
 *  known to hold. Compared as JSON so `socialLinks` (an object) diffs by value. */
function diffSiteColumns(patch: SiteColumnSettings, baseline: SiteColumnSettings): SiteColumnSettings {
  const diff: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (JSON.stringify(value) !== JSON.stringify(baseline[key as keyof SiteColumnSettings])) {
      diff[key] = value;
    }
  }
  return diff as SiteColumnSettings;
}

/**
 * P0.2b dual-save: routes Site-column fields to siteDetail.settings.update
 * (canonical for those fields server-side) and the rest of projectData to
 * sites.saveProject (page tree, element data, non-mirrored config).
 *
 * A-1 / PD-1 (dashboard owns Site columns): the mirror runs only AFTER the
 * project save succeeded — a refused save (SAVE_CONFLICT) sends no settings at
 * all — carries only the fields that changed since load, and is skipped for a
 * member below ADMIN, whom `siteDetail.settings.update` refuses anyway (every
 * EDITOR autosave used to raise a "settings mirror" error for it).
 */
async function saveProjectNow(
  siteId: string,
  projectData: ProjectData
): Promise<{ success: boolean; savedAt: Date }> {
  if (!_loadedSites.has(siteId)) {
    throw new ProjectNotLoadedError(siteId, _missingSites.has(siteId));
  }
  /* A save queued behind the one that was refused carries the same stale
     token — sending it would only be refused again. It is refused here, with
     the same conflict, until the user resolves it (Overwrite / reload). */
  if (_conflictToken !== null) throw announceConflict(_conflictToken);
  const client = getClient();
  /* Never persist a session Object URL: it is a broken image on every later
     open. The live element keeps its preview; once its upload reaches the
     server the element is re-pointed (MediaManager.replaceAssetId) and the
     next save stores the server URL. */
  const persisted: ProjectData = {
    ...projectData,
    pages: projectData.pages.map((page) => {
      if (!page.root || !JSON.stringify(page.root).includes("blob:")) return page;
      const root = structuredClone(page.root);
      dropSessionMediaUrls(root);
      return { ...page, root };
    }),
  };

  let primaryResult: unknown;
  try {
    primaryResult = await client.sites.saveProject.mutate({
      siteId,
      projectData: persisted,
      // 61-conflict: opt into behind-copy detection.
      expectedLastEditedAt: _baselineLastEditedAt,
    });
  } catch (err) {
    // Translate the server's CONFLICT into a typed error the shell can catch to
    // show the conflict dialog (rather than a generic save-failed toast).
    throw raiseSaveConflict(err) ?? err;
  }

  const result = primaryResult as { success: boolean; savedAt: Date };
  // Advance the baseline so the editor's own next save isn't seen as a conflict.
  _baselineLastEditedAt = new Date(result.savedAt).toISOString();

  const changed = diffSiteColumns(extractSiteColumnPatch(persisted.settings), _baselineSiteColumns);
  if (Object.keys(changed).length > 0 && roleAtLeast(await fetchMyRole(), "ADMIN") !== false) {
    /* Awaited on its own: a refused mirror is its own, smaller sentence — the
       pages are already on the server and the chip is about them. */
    try {
      await client.siteDetail.settings.update.mutate({ id: siteId, ...changed });
      _baselineSiteColumns = { ..._baselineSiteColumns, ...changed };
    } catch (e) {
      emitSettingsMirrorError(e instanceof Error ? e.message : String(e));
    }
  }
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
    /** The row's JSON column, passed through whole — `importServerAssets`
     *  reads `tags` (BLOCKERS C3) and `siteFont` (3686:42317) out of it. */
    userMetadata?: unknown;
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
      userMetadata?: unknown;
      width?: number | null;
      height?: number | null;
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

/** Whether this site's project has finished loading this session. The same
 *  `_loadedSites` the write boundary consults, so a panel asking "may I invite
 *  an edit yet?" and the save refusing to overwrite cannot disagree. Reading
 *  it is also what lets a panel remount mid-session without waiting forever
 *  for a PROJECT_LOADED that already fired. */
export function hasProjectLoaded(siteId: string): boolean {
  return _loadedSites.has(siteId);
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

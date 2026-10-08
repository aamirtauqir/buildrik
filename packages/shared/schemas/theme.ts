import { z } from "zod";
import { DarkModeSchema } from "./design-tokens";

/**
 * Shared-theme push (redesign E2-T5b). An agency captures one site's design
 * tokens as the workspace shared theme, then pushes that token set onto its
 * client sites. SSOT for the payloads — services/routers import these.
 *
 * `styles` is the opaque token snapshot (same shape as Site.projectStyles,
 * which the editor pipeline already treats as `z.array(z.unknown())`). We do
 * not re-validate token internals here — the push copies bytes site→workspace
 * →site; the editor owns token-shape validity.
 */
export const captureSharedThemeInput = z.object({
  // Source site whose current tokens become the workspace shared theme.
  sourceSiteId: z.string().min(1),
});
export type CaptureSharedThemeInput = z.infer<typeof captureSharedThemeInput>;

export const pushSharedThemeInput = z.object({
  // Targets. Omit to push to every site in the workspace (locked sites are
  // skipped regardless). Empty array is rejected — that's a no-op mistake.
  siteIds: z.array(z.string().min(1)).min(1).optional(),
});
export type PushSharedThemeInput = z.infer<typeof pushSharedThemeInput>;

export const setSiteThemeLockInput = z.object({
  siteId: z.string().min(1),
  locked: z.boolean(),
});
export type SetSiteThemeLockInput = z.infer<typeof setSiteThemeLockInput>;

// D1: dry-run preview of a push (same target shape as push).
export const previewSharedThemeInput = z.object({
  siteIds: z.array(z.string().min(1)).min(1).optional(),
});
export type PreviewSharedThemeInput = z.infer<typeof previewSharedThemeInput>;

// D2: roll a single site back to its pre-push tokens / list its snapshots.
export const siteThemeSnapshotInput = z.object({
  siteId: z.string().min(1),
});
export type SiteThemeSnapshotInput = z.infer<typeof siteThemeSnapshotInput>;

// D4: save a named brand preset from a site's tokens / reference one by id.
export const saveWorkspacePresetInput = z.object({
  name: z.string().min(1).max(60),
  sourceSiteId: z.string().min(1),
});
export type SaveWorkspacePresetInput = z.infer<typeof saveWorkspacePresetInput>;

export const workspacePresetIdInput = z.object({
  presetId: z.string().min(1),
});
export type WorkspacePresetIdInput = z.infer<typeof workspacePresetIdInput>;

// Brand Part 1c (spec §8): restore points the editor takes before a big brand
// change. `migration` and `theme-push` rows are written by the server only.
export const brandRestorePointReason = z.enum(["generator", "dark-auto", "logo"]);
export const createBrandRestorePointInput = z.object({
  siteId: z.string().min(1),
  reason: brandRestorePointReason,
  designTokens: z.array(z.unknown()).max(2000),
  designPresets: z.array(z.unknown()).max(500).optional(),
  darkMode: DarkModeSchema,
});
export type CreateBrandRestorePointInput = z.infer<typeof createBrandRestorePointInput>;

export const brandRestorePointInput = z.object({ siteId: z.string().min(1), id: z.string().min(1) });
export type BrandRestorePointInput = z.infer<typeof brandRestorePointInput>;

// Brand Part 1c (spec §9): colours and fonts read from a website.
export const extractBrandFromUrlInput = z.object({ siteId: z.string().min(1), url: z.string().trim().min(1).max(2048) });
export type ExtractBrandFromUrlInput = z.infer<typeof extractBrandFromUrlInput>;

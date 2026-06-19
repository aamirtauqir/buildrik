import { z } from "zod";

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

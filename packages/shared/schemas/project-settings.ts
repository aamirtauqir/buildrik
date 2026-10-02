import { z } from "zod";
import {
  ANALYTICS_ID_FIELDS,
  ANALYTICS_ID_PATTERNS,
  ANALYTICS_ID_SAFE,
  type AnalyticsProvider,
} from "./analytics-ids";

/**
 * The JSON-only site settings (Settings Phase B, BE-1): the values in
 * `Site.projectSettings` that have no Site column (§26) — analytics, the global
 * CSS well and the Redirects screen's 404-suggester switch. Everything else a
 * Settings screen edits is a column (`site-column-fields.ts`) and goes through
 * `siteDetail.settings.update`.
 *
 * One schema, three readers: the editor's Settings save builds its patch to it,
 * `siteDetail.projectSettings.update` validates that patch, and the autosave
 * path (`saveProjectData`) keeps the stored value of any key that fails it.
 *
 * Analytics ids are checked against the injection-only `ANALYTICS_ID_SAFE`, not
 * the strict per-provider formats: ids saved under the screen's older, looser
 * rules are still in customers' settings, and refusing them here would lock
 * those sites out of saving. A safe id that misses its strict format comes
 * back as a warning (`legacyAnalyticsIds`), never a refusal.
 */

/** Same cap as `headCode` / `bodyCode` in `updateSiteSettingsSchema`. */
export const GLOBAL_CSS_MAX_LENGTH = 10240;

const providerIdSchema = z
  .string()
  .trim()
  .max(128)
  .refine((id) => id === "" || ANALYTICS_ID_SAFE.test(id), {
    message: "Use only letters, numbers, - and _.",
  });

/** Stamped by the screen's "Check data is arriving"; free-form because older rows carry whatever was written then. */
const verifiedAtSchema = z.string().max(64).optional();

/* The id keys are `ANALYTICS_ID_FIELDS`' — spelled out so each block's type is exact. */
export const analyticsSettingsSchema = z.object({
  googleAnalytics: z.object({ enabled: z.boolean(), measurementId: providerIdSchema, verifiedAt: verifiedAtSchema }).optional(),
  googleTagManager: z.object({ enabled: z.boolean(), containerId: providerIdSchema, verifiedAt: verifiedAtSchema }).optional(),
  facebookPixel: z.object({ enabled: z.boolean(), pixelId: providerIdSchema, verifiedAt: verifiedAtSchema }).optional(),
  microsoftClarity: z.object({ enabled: z.boolean(), projectId: providerIdSchema, verifiedAt: verifiedAtSchema }).optional(),
  googleAds: z.object({ enabled: z.boolean(), conversionId: providerIdSchema }).optional(),
  cookieConsent: z.object({ enabled: z.boolean() }).optional(),
});

/** Only the JSON-only member of `customCode`; head and body are Site columns. */
export const customCodeSettingsSchema = z.object({
  globalCss: z.string().max(GLOBAL_CSS_MAX_LENGTH),
});

export const redirectsSettingsSchema = z.object({
  suggestFrom404s: z.boolean(),
});

/** One sub-schema per JSON-only top-level key — the keys a patch may carry. */
export const PROJECT_SETTINGS_KEY_SCHEMAS = {
  analytics: analyticsSettingsSchema,
  customCode: customCodeSettingsSchema,
  redirects: redirectsSettingsSchema,
} as const;

export type ProjectSettingsKey = keyof typeof PROJECT_SETTINGS_KEY_SCHEMAS;
export const PROJECT_SETTINGS_KEYS = Object.keys(PROJECT_SETTINGS_KEY_SCHEMAS) as ProjectSettingsKey[];

/**
 * A Settings save's JSON half. Strict at the top: this mutation writes the
 * three JSON-only keys and nothing else — not `seo`, not `designTokens`.
 */
export const projectSettingsPatchSchema = z
  .object({
    analytics: analyticsSettingsSchema.optional(),
    customCode: customCodeSettingsSchema.optional(),
    redirects: redirectsSettingsSchema.optional(),
  })
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, { message: "Nothing to save." });

/** `siteDetail.projectSettings.update` (BE-2). */
export const updateProjectSettingsSchema = z.object({
  siteId: z.string(),
  patch: projectSettingsPatchSchema,
});

export type AnalyticsSettings = z.infer<typeof analyticsSettingsSchema>;
export type ProjectSettingsPatch = z.infer<typeof projectSettingsPatchSchema>;
export type UpdateProjectSettingsInput = z.infer<typeof updateProjectSettingsSchema>;

/**
 * Providers whose (safe) id does not match its strict format — the warning the
 * mutation returns so the screen can say "this id looks wrong" without having
 * refused it. Empty ids are "not set", never legacy.
 */
export function legacyAnalyticsIds(analytics: AnalyticsSettings | undefined): AnalyticsProvider[] {
  if (!analytics) return [];
  return (Object.keys(ANALYTICS_ID_FIELDS) as AnalyticsProvider[]).filter((p) => {
    const block = analytics[p] as Record<string, unknown> | undefined;
    const id = block?.[ANALYTICS_ID_FIELDS[p]];
    return typeof id === "string" && id !== "" && !ANALYTICS_ID_PATTERNS[p].test(id);
  });
}

/**
 * Analytics provider ids — two rules with two jobs (I-1c).
 *
 * `ANALYTICS_ID_PATTERNS` are the strict per-provider formats. They are the
 * editor's Save-time hint only (`analyticsIds.ts` refuses Save and shows the
 * field's sentence). They were tightened on 2026-09-14, and ids saved under
 * the screen's earlier, looser rules (GTM-XXXX and up, 6-15 character
 * Clarity) are still in customers' settings. The server must NOT enforce
 * these patterns, or it would silently empty those ids on the next save.
 * Case-insensitive where the screen uppercases as the user types.
 *
 * `ANALYTICS_ID_SAFE` is the server's save-boundary rule (`saveProjectData`),
 * one rule for every provider. It refuses only injection-shaped values. Every
 * real provider id is letters, digits, "-" and "_". Output escaping
 * (`AnalyticsInjector`) covers the rest.
 */

export type AnalyticsProvider = "googleAnalytics" | "googleTagManager" | "facebookPixel" | "microsoftClarity";

export const ANALYTICS_ID_PATTERNS: Readonly<Record<AnalyticsProvider, RegExp>> = {
  googleAnalytics: /^G-[A-Z0-9]{10}$/i,
  googleTagManager: /^GTM-[A-Z0-9]{6,8}$/i,
  facebookPixel: /^\d{15,16}$/,
  microsoftClarity: /^[A-Z0-9]{10}$/i,
};

/** Checked after trimming. */
export const ANALYTICS_ID_SAFE = /^[A-Za-z0-9_-]{1,128}$/;

/** The key the id sits under in each provider's block of `projectSettings.analytics`. */
export const ANALYTICS_ID_FIELDS: Readonly<Record<AnalyticsProvider, string>> = {
  googleAnalytics: "measurementId",
  googleTagManager: "containerId",
  facebookPixel: "pixelId",
  microsoftClarity: "projectId",
};

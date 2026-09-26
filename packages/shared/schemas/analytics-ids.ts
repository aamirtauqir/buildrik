/**
 * The shape each analytics provider's id must have — one list for the
 * editor's Analytics screen (`analyticsIds.ts`, which refuses Save on a
 * malformed id) and the server's save boundary (`saveProjectData`, which
 * drops one), so the two cannot drift apart (I-1c). The ids end up inside
 * every published page's inline <script>, so the server must not trust the
 * client's check.
 *
 * Case-insensitive where the screen uppercases as the user types, so a
 * stored lowercase id is not flagged.
 */

export type AnalyticsProvider = "googleAnalytics" | "googleTagManager" | "facebookPixel" | "microsoftClarity";

export const ANALYTICS_ID_PATTERNS: Readonly<Record<AnalyticsProvider, RegExp>> = {
  googleAnalytics: /^G-[A-Z0-9]{10}$/i,
  googleTagManager: /^GTM-[A-Z0-9]{6,8}$/i,
  facebookPixel: /^\d{15,16}$/,
  microsoftClarity: /^[A-Z0-9]{10}$/i,
};

/** The key the id sits under in each provider's block of `projectSettings.analytics`. */
export const ANALYTICS_ID_FIELDS: Readonly<Record<AnalyticsProvider, string>> = {
  googleAnalytics: "measurementId",
  googleTagManager: "containerId",
  facebookPixel: "pixelId",
  microsoftClarity: "projectId",
};

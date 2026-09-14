/**
 * Settings tab constants — static data
 * @license BSD-3-Clause
 *
 * Project-wide feature flags live in `src/shared/utils/featureFlags.ts`.
 * The settings-tab-local FEATURE_FLAGS object was removed after A1 day-3:
 * domains/integrations/export gates moved to nav inclusion (workspace
 * deep-links + Topbar export) and the local flags had zero consumers.
 */

import type { SettingsNavId } from "./types";

/**
 * The locales the product knows. One list for every place a locale is
 * picked or named: Localization's default/enabled lists and General's
 * `Site Language` select (Clone 3397:32011 — `English (en-US)` is the
 * frame's shape, `<label> (<code>)`). Lived inside LocalizationScreen.tsx
 * until S1 needed it on a second screen.
 */
export const SITE_LOCALES: ReadonlyArray<{ code: string; label: string }> = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "nl", label: "Dutch" },
  { code: "pl", label: "Polish" },
  { code: "sv", label: "Swedish" },
  { code: "da", label: "Danish" },
  { code: "no", label: "Norwegian" },
  { code: "fi", label: "Finnish" },
  { code: "ru", label: "Russian" },
  { code: "zh", label: "Chinese (Simplified)" },
  { code: "zh-TW", label: "Chinese (Traditional)" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "ar", label: "Arabic" },
  { code: "he", label: "Hebrew" },
  { code: "hi", label: "Hindi" },
  { code: "tr", label: "Turkish" },
  { code: "id", label: "Indonesian" },
  { code: "vi", label: "Vietnamese" },
  { code: "th", label: "Thai" },
];

/** `English` for a known code; the code itself, upper-cased, for one the list does not carry. */
export function localeLabel(code: string): string {
  return SITE_LOCALES.find((l) => l.code === code)?.label ?? code.toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// Nav — the Clone sidebar (3397:32011) and the Overview's cards (3397:32915)
// draw the same sixteen rows; this is the one list both read.
// ─────────────────────────────────────────────────────────────────────────────

export type SettingsNavGroupId = "site-setup" | "seo-publishing" | "visitors" | "advanced" | "workspace";

/** Sentence case — the pane header reads `Site setup / General`; the sidebar
 *  and the Overview's cards set it uppercase themselves. */
export const SETTINGS_NAV_GROUPS: Record<SettingsNavGroupId, string> = {
  "site-setup": "Site setup",
  "seo-publishing": "SEO & publishing",
  visitors: "Visitors",
  advanced: "Advanced",
  workspace: "Workspace",
};

export interface SettingsNavDef {
  id: SettingsNavId;
  title: string;
  /** The pane header's second line (screens) or the Overview's static summary (doors). */
  subtitle: string;
  group: SettingsNavGroupId;
  /**
   * `screen` renders in the pane · `door` leaves for another surface (the
   * Brand panel, the Export modal) · `external` opens the dashboard in a new
   * tab (`WORKSPACE_LINKS`).
   */
  kind: "screen" | "door" | "external";
}

/** Sidebar order — the group order the frame draws. The Overview lays the
 *  same groups out as cards in its own order (see OverviewScreen). */
export const SETTINGS_NAV: SettingsNavDef[] = [
  { id: "general", title: "General", subtitle: "Manage your site identity, language and social profiles.", group: "site-setup", kind: "screen" },
  { id: "branding", title: "Fonts & colours", subtitle: "Site fonts and colour tokens", group: "site-setup", kind: "door" },
  { id: "localization", title: "Localization", subtitle: "Locale claim and preview", group: "site-setup", kind: "screen" },
  { id: "seo", title: "SEO defaults", subtitle: "Search & social preview", group: "seo-publishing", kind: "screen" },
  { id: "domains", title: "Domains", subtitle: "Custom domain + DNS", group: "seo-publishing", kind: "screen" },
  { id: "redirects", title: "Redirects", subtitle: "301 / 302 + 404 suggester", group: "seo-publishing", kind: "screen" },
  { id: "export", title: "Export", subtitle: "HTML, ZIP or React", group: "seo-publishing", kind: "door" },
  { id: "analytics", title: "Analytics", subtitle: "GA4, Plausible, PostHog, Pixel", group: "visitors", kind: "screen" },
  { id: "forms", title: "Forms", subtitle: "Submissions inbox + config", group: "visitors", kind: "screen" },
  { id: "custom-code", title: "Custom code", subtitle: "Head, body, CSS injections", group: "advanced", kind: "screen" },
  { id: "headers", title: "Headers", subtitle: "CSP, HSTS, security policy", group: "advanced", kind: "screen" },
  { id: "integrations", title: "Integrations", subtitle: "Third-party OAuth", group: "advanced", kind: "screen" },
  { id: "webhooks", title: "Webhooks", subtitle: "Workspace event deliveries", group: "workspace", kind: "screen" },
  { id: "members", title: "Members", subtitle: "Seats and roles", group: "workspace", kind: "external" },
  { id: "billing", title: "Billing", subtitle: "Plan and invoices", group: "workspace", kind: "external" },
];

/**
 * Workspace deep-links — dashboard pages, opened in a new tab. Only links to
 * pages that actually exist ship here (Members under /dashboard/settings/team,
 * Billing under /dashboard/settings/billing); linking to a 404 silently is
 * worse than not linking at all. Billing is also where every `Upgrade` goes.
 */
export const WORKSPACE_LINKS: Partial<Record<SettingsNavId, string>> = {
  members: "/dashboard/settings/team",
  billing: "/dashboard/settings/billing",
};

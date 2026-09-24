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
 *
 * `native` is the language's own name — the Add locale dialog (3737:44855)
 * lists `<label> — <native>` with the code at the right. The codes stay
 * BARE (`es`, URL prefix `/es`): `enabledLocales` and every page's
 * `translations` are keyed by them, and the frame's region-coded ids would
 * re-key every translation (phase2-backend.md §1, recorded on the row).
 */
export const SITE_LOCALES: ReadonlyArray<{ code: string; label: string; native: string }> = [
  { code: "en", label: "English", native: "English" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "fr", label: "French", native: "Français" },
  { code: "de", label: "German", native: "Deutsch" },
  { code: "it", label: "Italian", native: "Italiano" },
  { code: "pt", label: "Portuguese", native: "Português" },
  { code: "nl", label: "Dutch", native: "Nederlands" },
  { code: "pl", label: "Polish", native: "Polski" },
  { code: "sv", label: "Swedish", native: "Svenska" },
  { code: "da", label: "Danish", native: "Dansk" },
  { code: "no", label: "Norwegian", native: "Norsk" },
  { code: "fi", label: "Finnish", native: "Suomi" },
  { code: "ru", label: "Russian", native: "Русский" },
  { code: "zh", label: "Chinese (Simplified)", native: "简体中文" },
  { code: "zh-TW", label: "Chinese (Traditional)", native: "繁體中文" },
  { code: "ja", label: "Japanese", native: "日本語" },
  { code: "ko", label: "Korean", native: "한국어" },
  { code: "ar", label: "Arabic", native: "العربية" },
  { code: "he", label: "Hebrew", native: "עברית" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "ur", label: "Urdu", native: "اردو" },
  { code: "tr", label: "Turkish", native: "Türkçe" },
  { code: "id", label: "Indonesian", native: "Bahasa Indonesia" },
  { code: "vi", label: "Vietnamese", native: "Tiếng Việt" },
  { code: "th", label: "Thai", native: "ไทย" },
];

/** Written right-to-left — the Translation checklist (3737:44869) says so before its page list. */
export const RTL_LOCALES: ReadonlySet<string> = new Set(["ar", "he", "fa", "ur"]);

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
  { id: "branding", title: "Brand ↗", subtitle: "Colours, fonts, spacing and presets", group: "site-setup", kind: "door" },
  { id: "localization", title: "Localization", subtitle: "Locale claim and preview", group: "site-setup", kind: "screen" },
  { id: "seo", title: "SEO defaults", subtitle: "Search & social preview", group: "seo-publishing", kind: "screen" },
  { id: "domains", title: "Domains", subtitle: "Custom domain + DNS", group: "seo-publishing", kind: "screen" },
  { id: "redirects", title: "Redirects", subtitle: "301 / 302 + 404 suggester", group: "seo-publishing", kind: "screen" },
  { id: "export", title: "Export…", subtitle: "HTML, ZIP or React", group: "seo-publishing", kind: "door" },
  { id: "analytics", title: "Analytics", subtitle: "Google Analytics, Meta Pixel, Clarity, Tag Manager", group: "visitors", kind: "screen" },
  { id: "forms", title: "Forms", subtitle: "Submissions inbox + config", group: "visitors", kind: "screen" },
  { id: "custom-code", title: "Custom code", subtitle: "Head, body, CSS injections", group: "advanced", kind: "screen" },
  { id: "headers", title: "Headers", subtitle: "CSP, HSTS, security policy", group: "advanced", kind: "screen" },
  { id: "integrations", title: "Integrations", subtitle: "Third-party OAuth", group: "advanced", kind: "screen" },
  { id: "webhooks", title: "Webhooks", subtitle: "Workspace event deliveries", group: "advanced", kind: "screen" },
  { id: "members", title: "Members", subtitle: "Seats and roles", group: "workspace", kind: "external" },
  { id: "billing", title: "Billing", subtitle: "Plan and invoices", group: "workspace", kind: "external" },
];

/**
 * Workspace deep-links — dashboard pages, opened in a new tab. Only links to
 * pages that actually exist ship here (Members under /dashboard/settings/team,
 * Billing under /dashboard/settings/billing); linking to a 404 silently is
 * worse than not linking at all. Billing is also where every `Upgrade` goes.
 */
/** 3950:26309 / 3951:26319 / 3951:26607 — the banner a screen draws when
 *  its Save fails; the shell sets it after a refused Save, Domains and
 *  Redirects after a refused row action. Other screens get the same
 *  sentence with their own name in it. */
export const SAVE_ERROR_MESSAGES: Partial<Record<SettingsNavId, string>> = {
  general: "Site settings were not saved. Your changes are still here. Review the values, then retry.",
  seo: "SEO defaults were not saved. Your changes are still here. Review the values, then retry.",
  "custom-code": "Custom code was not saved. Your changes are still here. Review the values, then retry.",
  domains: "Domain changes were not saved. Your changes are still here. Review the values, then retry.",
  analytics: "Analytics settings were not saved. Your changes are still here. Review the values, then retry.",
  localization: "Localization settings were not saved. Your changes are still here. Review the values, then retry.",
  redirects: "Redirect changes were not saved. Your changes are still here. Review the values, then retry.",
  headers: "Header changes were not saved. Your changes are still here. Review the values, then retry.",
  webhooks: "Couldn't save the webhook. Your endpoint is still here. Check the connection and retry.",
};

export const WORKSPACE_LINKS: Partial<Record<SettingsNavId, string>> = {
  members: "/dashboard/settings/team",
  billing: "/dashboard/settings/billing",
};

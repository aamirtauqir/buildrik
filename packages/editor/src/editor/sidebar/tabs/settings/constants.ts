/**
 * Settings tab constants — static data
 * @license BSD-3-Clause
 *
 * Project-wide feature flags live in `src/shared/utils/featureFlags.ts`.
 * The settings-tab-local FEATURE_FLAGS object was removed after A1 day-3:
 * domains/integrations/export gates moved to nav inclusion (workspace
 * deep-links + Topbar export) and the local flags had zero consumers.
 */

import type { WorkspaceRole } from "@/services/RoleService";
import type {
  SettingsNavId,
  SettingsPaneId,
  SettingsSaveModel,
  SettingsScope,
  SettingsScreenId,
  SettingsWorkspaceDoorId,
} from "./types";

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
// Nav — Settings Phase B (proposal §25, plan M0): the sidebar and the
// Overview's cards draw the same rows; this is the one list both read.
// ─────────────────────────────────────────────────────────────────────────────

export type SettingsNavGroupId =
  | "site"
  | "search-sharing"
  | "publishing"
  | "visitors"
  | "advanced"
  | "danger-zone"
  | "workspace";

/** Sentence case — the pane header reads `Site / General`; the sidebar and the
 *  Overview's cards set it uppercase themselves. `workspace` is the footer
 *  group under the separator: rows that leave for the dashboard. */
export const SETTINGS_NAV_GROUPS: Record<SettingsNavGroupId, string> = {
  site: "Site",
  "search-sharing": "Search & sharing",
  publishing: "Publishing",
  visitors: "Visitors",
  advanced: "Advanced",
  "danger-zone": "Danger zone",
  workspace: "Managed in workspace settings",
};

/** Sidebar order, top to bottom. */
export const SETTINGS_NAV_GROUP_ORDER: readonly SettingsNavGroupId[] = [
  "site",
  "search-sharing",
  "publishing",
  "visitors",
  "advanced",
  "danger-zone",
  "workspace",
];

interface SettingsNavRow {
  title: string;
  /** The pane header's second line (screens) or the Overview's static summary (doors). */
  subtitle: string;
  group: SettingsNavGroupId;
}

/**
 * `screen` renders in the pane · `door` leaves for another editor surface
 * (the Brand panel) · `workspace` opens a door card in the pane that leads to
 * the dashboard's workspace settings (8139:217358, `WORKSPACE_LINKS`).
 */
export type SettingsNavDef =
  | (SettingsNavRow & { kind: "screen"; id: Exclude<SettingsScreenId, "overview"> })
  | (SettingsNavRow & { kind: "workspace"; id: SettingsWorkspaceDoorId })
  | (SettingsNavRow & { kind: "door"; id: "branding" });

/** Sidebar order within each group. */
export const SETTINGS_NAV: SettingsNavDef[] = [
  { id: "general", title: "General", subtitle: "The site's name, icons and author.", group: "site", kind: "screen" },
  { id: "localization", title: "Languages", subtitle: "Default language and the languages the site is published in.", group: "site", kind: "screen" },
  { id: "branding", title: "Brand ↗", subtitle: "Colours, fonts, spacing and presets", group: "site", kind: "door" },
  { id: "seo", title: "SEO", subtitle: "Search defaults, social profiles and indexing.", group: "search-sharing", kind: "screen" },
  { id: "domains", title: "Domains", subtitle: "Custom domains, the primary address and DNS.", group: "publishing", kind: "screen" },
  { id: "redirects", title: "Redirects", subtitle: "301 / 302 rules and 404 suggestions.", group: "publishing", kind: "screen" },
  { id: "access", title: "Access", subtitle: "Password protection and share links.", group: "publishing", kind: "screen" },
  { id: "analytics", title: "Analytics", subtitle: "Google Analytics, Tag Manager, Meta Pixel, Clarity.", group: "visitors", kind: "screen" },
  { id: "forms", title: "Form submissions", subtitle: "What visitors sent through your forms.", group: "visitors", kind: "screen" },
  { id: "custom-code", title: "Custom code", subtitle: "Head, body and CSS injections.", group: "advanced", kind: "screen" },
  { id: "headers", title: "Security headers", subtitle: "CSP, HSTS and security policy.", group: "advanced", kind: "screen" },
  { id: "danger-zone", title: "Danger zone", subtitle: "Archive, transfer or delete this site.", group: "danger-zone", kind: "screen" },
  { id: "members", title: "Members", subtitle: "Seats and roles", group: "workspace", kind: "workspace" },
  { id: "billing", title: "Billing", subtitle: "Plan and invoices", group: "workspace", kind: "workspace" },
  { id: "webhooks", title: "Integrations & webhooks", subtitle: "Apps, Vercel and webhook deliveries", group: "workspace", kind: "workspace" },
];

/** The ids that render in the pane, in sidebar order — what a deep link may name. */
export const SETTINGS_SCREEN_IDS: readonly SettingsScreenId[] = [
  "overview",
  ...SETTINGS_NAV.flatMap((n) => (n.kind === "screen" ? [n.id] : [])),
];

export function isSettingsScreenId(id: string): id is SettingsScreenId {
  return (SETTINGS_SCREEN_IDS as readonly string[]).includes(id);
}

const WORKSPACE_DOOR_IDS: readonly SettingsWorkspaceDoorId[] = ["members", "billing", "webhooks"];

export function isSettingsPaneId(id: string): id is SettingsPaneId {
  return isSettingsScreenId(id) || (WORKSPACE_DOOR_IDS as readonly string[]).includes(id);
}

/**
 * The role a screen needs to CHANGE anything on it (SA-21, plan M2). Below it
 * the screen still opens — read-only, with a banner saying who can change it.
 * Mirrors the server: Site columns (General, Languages, SEO, Access, Custom
 * code, Security headers) and domains are ADMIN; redirects, analytics and form
 * submissions are EDITOR; the Danger zone is the OWNER's (PD-3). The Overview
 * changes nothing and needs no row.
 */
export const SCREEN_MIN_ROLE: Record<Exclude<SettingsScreenId, "overview">, WorkspaceRole> = {
  general: "ADMIN",
  localization: "ADMIN",
  seo: "ADMIN",
  domains: "ADMIN",
  redirects: "EDITOR",
  access: "ADMIN",
  analytics: "EDITOR",
  forms: "EDITOR",
  "custom-code": "ADMIN",
  headers: "ADMIN",
  "danger-zone": "OWNER",
};

/**
 * §27: fields save from the footer through the settings mutations; objects
 * (domains, redirects, submissions, the Danger zone's actions) apply at once
 * through their own dialogs. Languages is `footer` — its default locale is a
 * field; its locales table applies immediately inside it.
 */
export const SCREEN_SAVE_MODEL: Record<Exclude<SettingsScreenId, "overview">, SettingsSaveModel> = {
  general: "footer",
  localization: "footer",
  seo: "footer",
  domains: "immediate",
  redirects: "immediate",
  access: "footer",
  analytics: "footer",
  forms: "immediate",
  "custom-code": "footer",
  headers: "footer",
  "danger-zone": "immediate",
};

/** The scope line under each screen's title (plan M1). */
export const SCREEN_SCOPE: Record<Exclude<SettingsScreenId, "overview">, SettingsScope> = {
  general: "publish",
  localization: "publish",
  seo: "publish",
  domains: "live",
  redirects: "publish",
  access: "publish",
  analytics: "publish",
  forms: "live",
  "custom-code": "publish",
  headers: "publish",
  "danger-zone": "lifecycle",
};

/** M1 (8134:212121 / 8134:212529): the next-publish line names the site; the live one does not;
 *  the lifecycle line is the Overview's and the Danger zone's (8137:216346 / 8137:216600). */
export function scopeLine(scope: SettingsScope, siteName: string): string {
  if (scope === "publish") return `${siteName} · all pages · applies on next publish`;
  if (scope === "lifecycle") return `${siteName} · site lifecycle · changes apply immediately`;
  return "Live immediately · no publish needed";
}

/**
 * The read-only notice's sentence where "Only <role> can change <screen>"
 * would be wrong (M2). The Danger zone's actions do not share one rule — the
 * creator may transfer (Q-B5) — so it says each (8137:216834).
 */
export const READ_ONLY_NOTICE: Partial<Record<Exclude<SettingsScreenId, "overview">, string>> = {
  "danger-zone": "Only the workspace owner can archive or delete this site. Only the workspace owner or site creator can transfer it.",
};

/** 8139:217358: a workspace door's line. */
export const workspaceScopeLine = (workspaceName: string) => `${workspaceName} · all sites · managed in workspace settings`;

/** The door card's two sentences per workspace row (8139:217358's shape). */
export const WORKSPACE_DOOR_COPY: Record<SettingsWorkspaceDoorId, { what: string; managed: string }> = {
  members: {
    what: "Invite people and choose their roles across your workspace.",
    managed: "Members are managed in workspace settings.",
  },
  billing: {
    what: "See your plan, invoices and payment method.",
    managed: "Billing is managed in workspace settings.",
  },
  webhooks: {
    what: "Connect apps and manage webhooks for your workspace.",
    managed: "These connections are managed in workspace settings.",
  },
};

/** 3950:26309 / 3951:26319 / 3951:26607 — the banner a screen draws when
 *  its Save fails; the shell sets it after a refused Save, Domains and
 *  Redirects after a refused row action. Screens without a row get the same
 *  sentence with their own title in it. */
export const SAVE_ERROR_MESSAGES: Partial<Record<SettingsNavId, string>> = {
  general: "Site settings were not saved. Your changes are still here. Review the values, then retry.",
  seo: "SEO settings were not saved. Your changes are still here. Review the values, then retry.",
  "custom-code": "Custom code was not saved. Your changes are still here. Review the values, then retry.",
  domains: "Domain changes were not saved. Your changes are still here. Review the values, then retry.",
  analytics: "Analytics settings were not saved. Your changes are still here. Review the values, then retry.",
  localization: "Language settings were not saved. Your changes are still here. Review the values, then retry.",
  redirects: "Redirect changes were not saved. Your changes are still here. Review the values, then retry.",
  headers: "Security headers were not saved. Your changes are still here. Review the values, then retry.",
  access: "Access settings were not saved. Your changes are still here. Review the values, then retry.",
};

/**
 * Workspace doors — dashboard pages, opened in a new tab. Only pages that
 * exist ship here; Billing is also where every `Upgrade` goes. "Integrations &
 * webhooks" is the dashboard's Settings › Integrations, where webhooks moved
 * (A-12) beside Vercel and the apps.
 */
export const WORKSPACE_LINKS: Partial<Record<SettingsNavId, string>> = {
  members: "/dashboard/settings/team",
  billing: "/dashboard/settings/billing",
  webhooks: "/dashboard/settings/integrations",
};

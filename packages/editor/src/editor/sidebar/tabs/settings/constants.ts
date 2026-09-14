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
 * Integration catalog — metadata for third-party service cards.
 * Moved from IntegrationsScreen.tsx to keep UI files free of business data.
 */
export const INTEGRATION_CATALOG = [
  {
    id: "formspree",
    name: "Formspree",
    description: "Simple form backend. Receive form submissions by email.",
    docsUrl: "https://formspree.io/",
    category: "forms" as const,
  },
  {
    id: "netlify-forms",
    name: "Netlify Forms",
    description: "Collect form submissions directly in your Netlify dashboard.",
    docsUrl: "https://docs.netlify.com/forms/setup/",
    category: "forms" as const,
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Accept payments online with the world's leading payment platform.",
    docsUrl: "https://stripe.com/docs",
    category: "payments" as const,
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Email marketing platform to grow your audience.",
    docsUrl: "https://mailchimp.com/developer/",
    category: "email" as const,
  },
  {
    id: "convertkit",
    name: "ConvertKit",
    description: "Email marketing for creators and small businesses.",
    docsUrl: "https://developers.convertkit.com/",
    category: "email" as const,
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect your site to 5000+ apps without code.",
    docsUrl: "https://zapier.com/apps",
    category: "automation" as const,
  },
] as const;

export type IntegrationId = (typeof INTEGRATION_CATALOG)[number]["id"];
export type IntegrationCategory = (typeof INTEGRATION_CATALOG)[number]["category"];

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

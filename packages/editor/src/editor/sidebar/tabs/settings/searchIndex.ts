/**
 * searchIndex — the static registry behind the sidebar's "Search site
 * settings" filter (6816:60270).
 *
 * One entry per nav row (every destination but the Overview) and one per
 * labelled FIELD on a screen, in sidebar order with each section followed by
 * its own fields — that order is the ranking. A section's title, description
 * and group are the nav's own (`SETTINGS_NAV`); a field's title is its label,
 * its description the card it sits in, its `group` the section it belongs to.
 *
 * `fieldId` is the field's label slug — the stem the screens' `Field` uses for
 * `set-field-<slug>` and the `id` a screen sets on the control — so the shell
 * can scroll it into view once the screen is open.
 *
 * @license BSD-3-Clause
 */

import { SETTINGS_NAV, SETTINGS_NAV_GROUPS } from "./constants";
import type { SettingsNavId } from "./types";

export type SettingsSearchScreen = Exclude<SettingsNavId, "overview">;

export interface SearchEntry {
  /** Unique: the nav id for a section, `<screen>/<fieldId>` for a field. */
  id: string;
  title: string;
  description: string;
  /** Drawn uppercase at the row's right: the nav group for a section, the section's own title for a field. */
  group: string;
  /** The nav id the row opens. */
  screen: SettingsSearchScreen;
  /** A field's anchor on its screen. Absent on a section. */
  fieldId?: string;
  /** Other words people use for it ("url" for the slug, "localization" for Languages) — matched, never drawn. */
  aliases?: readonly string[];
}

/** `[title, description, fieldId, aliases?]` — the field's label, the card it sits in, its anchor, other names. */
type FieldDef = [title: string, description: string, fieldId: string, aliases?: readonly string[]];

interface SectionDef {
  screen: SettingsSearchScreen;
  fields?: FieldDef[];
  aliases?: readonly string[];
}

/**
 * Phase B (§25): each section's title, description and group come from the
 * nav itself (`SETTINGS_NAV`), so search cannot name a row the sidebar does
 * not have. The `fieldId`s of fields that moved here in Phase B (touch icon,
 * slug, social profiles, indexing, set primary, CSV, password, Danger zone)
 * are the anchors their screens must set — see the plan's Lane 0 contract.
 */
const SECTIONS: SectionDef[] = [
  {
    screen: "general",
    aliases: ["site identity"],
    fields: [
      ["Site name", "Site identity", "site-name", ["title", "rename"]],
      ["Favicon", "Site identity", "favicon-url", ["icon", "browser tab"]],
      ["Touch icon", "Site identity", "touch-icon", ["apple touch icon", "home screen icon"]],
      ["Author", "Site identity", "site-author"],
      ["URL slug", "Advanced", "site-slug", ["url", "address", "subdomain", "slug"]],
    ],
  },
  {
    screen: "localization",
    aliases: ["localization", "locale", "translation", "i18n", "multilingual"],
    fields: [
      ["Default language", "Default", "default-locale", ["site language", "default locale"]],
      ["Languages", "Published languages and translation progress", "locales", ["locales"]],
    ],
  },
  { screen: "branding", aliases: ["design", "colours", "colors", "fonts", "theme"] },
  {
    screen: "seo",
    aliases: ["search engine", "meta"],
    fields: [
      ["Meta title", "Search defaults", "seo-meta-title"],
      ["Meta description", "Search defaults", "seo-meta-description"],
      ["Default OG image", "Search defaults", "seo-og", ["open graph", "share image"]],
      ["Twitter / X", "Social profiles", "social-twitter", ["twitter handle", "x.com"]],
      ["Facebook", "Social profiles", "social-facebook"],
      ["LinkedIn", "Social profiles", "social-linkedin"],
      ["Instagram", "Social profiles", "social-instagram"],
      ["YouTube", "Social profiles", "social-youtube"],
      ["GitHub", "Social profiles", "social-github"],
      ["Allow search indexing", "Indexing", "seo-allow-indexing", ["noindex", "hide from google"]],
      ["Canonical URL", "Indexing", "seo-canonical", ["canonical"]],
      ["robots.txt", "Indexing", "seo-robots", ["robots", "crawl"]],
    ],
  },
  {
    screen: "domains",
    aliases: ["custom domain", "dns"],
    fields: [
      ["Domain", "Custom domain", "dom-domain"],
      ["Primary domain", "Custom domain", "dom-primary", ["set as primary", "main domain"]],
      ["Force HTTPS", "Custom domain", "dom-force-https", ["ssl"]],
      ["DNS records", "Records to add at your registrar", "dom-dns-records"],
    ],
  },
  {
    screen: "redirects",
    aliases: ["301", "302", "404"],
    fields: [
      ["Redirect rules", "From path, to URL and type", "rd-rules"],
      ["Suggest redirects from 404s", "404 suggester", "rd-suggest-from-404s"],
      ["Import CSV", "Redirect rules", "rd-import-csv", ["upload redirects", "bulk"]],
      ["Export CSV", "Redirect rules", "rd-export-csv", ["download redirects"]],
    ],
  },
  {
    screen: "access",
    aliases: ["private", "protect", "lock"],
    fields: [
      ["Password protection", "Site password", "access-password", ["site password", "password"]],
      ["Share links", "Preview links for people outside the workspace", "access-share-links", ["share", "preview link"]],
    ],
  },
  {
    screen: "analytics",
    aliases: ["tracking", "ga4", "gtm", "pixel"],
    // Clone 3397:32295's rows in its card order; each id is the control's
    // own `id` (the switches included), or the row's `set-field-*` anchor
    // for the two status lines that have no control.
    fields: [
      ["Enable Google Analytics", "Google Analytics", "enable-google-analytics"],
      ["Google Analytics ID", "Google Analytics", "google-analytics-id"],
      ["Connection status", "Google Analytics", "connection-status"],
      ["Last received data", "Google Analytics", "last-received-data"],
      ["Enable Google Tag Manager", "Google Tag Manager", "enable-google-tag-manager"],
      ["GTM Container ID", "Google Tag Manager", "gtm-container-id"],
      ["Enable Meta Pixel", "Meta Pixel", "enable-meta-pixel"],
      ["Pixel ID", "Meta Pixel", "pixel-id"],
      ["Enable Microsoft Clarity", "Microsoft Clarity", "enable-microsoft-clarity"],
      ["Clarity Project ID", "Microsoft Clarity", "clarity-project-id"],
    ],
  },
  {
    screen: "forms",
    aliases: ["forms", "inbox", "leads", "entries"],
    fields: [["Form", "Select a form to view its submissions inbox.", "form"]],
  },
  {
    screen: "custom-code",
    aliases: ["scripts", "html", "css", "embed"],
    fields: [
      ["Head scripts", "<head>", "code-head"],
      ["Body scripts (end)", "</body>", "code-body"],
      ["Global CSS", "styles", "code-css"],
    ],
  },
  {
    screen: "headers",
    aliases: ["headers", "csp", "hsts", "security"],
    // Clone 3397:32602's rows in its card order; each id is the control's
    // own `id` (the S3 brief's `set-hd-*` testids), so Search lands on the
    // control itself. Permissions-Policy is the code's card below the frame's.
    fields: [
      ["CSP header value", "Content Security Policy", "set-hd-csp"],
      ["Policy", "X-Frame-Options", "set-hd-xfo"],
      ["Policy", "Referrer-Policy", "set-hd-referrer"],
      ["Enable HSTS", "HSTS (HTTP Strict Transport Security)", "set-hd-hsts-enable"],
      ["Max age", "HSTS (HTTP Strict Transport Security)", "set-hd-hsts-max"],
      ["Header value", "Permissions-Policy", "set-hd-permissions"],
    ],
  },
  {
    screen: "danger-zone",
    aliases: ["delete site", "remove site"],
    fields: [
      ["Archive site", "Danger zone", "danger-archive", ["hide site", "unarchive"]],
      ["Transfer site", "Danger zone", "danger-transfer", ["change owner", "hand over"]],
      ["Delete site", "Danger zone", "danger-delete", ["remove", "destroy"]],
    ],
  },
  { screen: "members", aliases: ["team", "seats", "roles", "invite"] },
  { screen: "billing", aliases: ["plan", "invoices", "upgrade", "subscription"] },
  { screen: "webhooks", aliases: ["integrations", "apps", "zapier", "slack", "vercel"] },
];

export const SETTINGS_SEARCH_INDEX: SearchEntry[] = SECTIONS.flatMap(({ screen, fields = [], aliases }): SearchEntry[] => {
  const nav = SETTINGS_NAV.find((n) => n.id === screen);
  if (!nav) return [];
  const title = nav.title.replace(/ ↗$/, "");
  return [
    { id: screen, title, description: nav.subtitle, group: SETTINGS_NAV_GROUPS[nav.group], screen, ...(aliases ? { aliases } : {}) },
    ...fields.map(
      ([fieldTitle, fieldDescription, fieldId, fieldAliases]): SearchEntry => ({
        id: `${screen}/${fieldId}`,
        title: fieldTitle,
        description: fieldDescription,
        group: title,
        screen,
        fieldId,
        ...(fieldAliases ? { aliases: fieldAliases } : {}),
      }),
    ),
  ];
});

/**
 * Case-insensitive substring over title, description, group and aliases, in
 * registry order. An empty query is the section list — the destinations, no
 * fields.
 */
export function searchSettings(query: string): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return SETTINGS_SEARCH_INDEX.filter((entry) => entry.fieldId === undefined);
  return SETTINGS_SEARCH_INDEX.filter((entry) =>
    [entry.title, entry.description, entry.group, ...(entry.aliases ?? [])].some((text) => text.toLowerCase().includes(q)),
  );
}

/**
 * searchIndex — the static registry behind Search settings (Clone 3737:46109).
 *
 * One entry per nav SECTION (the fifteen destinations the Overview's cards
 * list — Overview itself is where the search lives, so it is not a result)
 * and one per labelled FIELD on a screen, in the Clone's nav order with each
 * section followed by its own fields. That order is the ranking: the frame
 * draws `Domains` and then the Domains fields under it, not every section
 * before every field.
 *
 * Copy, per the brief: a section's title is the Clone's nav label and its
 * description the Clone's pane subtitle where a frame shows one, else the
 * shell's own `NAV` subtitle. Two of those subtitles named things their
 * screens do not have (`Plausible, PostHog` — the Analytics screen has GA4,
 * Meta Pixel, Clarity and Tag Manager; `OAuth` — Integrations links out to
 * each provider's setup), so those two say what is on the screen instead:
 * this registry's whole job is to say what is where. A field's title is its
 * label, its description the card it sits in (Custom code's three cards ARE
 * the fields, so their description is the row label the frame draws beside
 * each editor: `<head>`, `</body>`, `styles`), and its `group` the section it
 * belongs to — the frame's `DNS records · … · DOMAINS`. (The frame's
 * `Force HTTPS` row was left out until S2 built the control on 3397:32206;
 * a result that opens a screen to nothing is a fake state.)
 *
 * `fieldId` is the field's label slug — the stem the screens' `Field` uses
 * for `set-field-<slug>` and the `id` the S1 screens set on the control — so
 * the shell can scroll it into view once the screen is open. S1's ids are the
 * brief's; the rest derive from their labels by the same slug rule.
 *
 * @license BSD-3-Clause
 */

export type SettingsSearchScreen =
  | "general"
  | "branding"
  | "localization"
  | "seo"
  | "domains"
  | "redirects"
  | "export"
  | "analytics"
  | "forms"
  | "custom-code"
  | "headers"
  | "integrations"
  | "webhooks"
  | "members"
  | "billing";

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
}

/** `[title, description, fieldId]` — the field's label, the card it sits in, its anchor. */
type FieldDef = [title: string, description: string, fieldId: string];

interface SectionDef {
  screen: SettingsSearchScreen;
  title: string;
  description: string;
  group: string;
  fields?: FieldDef[];
}

const SITE_SETUP = "Site setup";
const SEO_PUBLISHING = "SEO & publishing";
const VISITORS = "Visitors";
const ADVANCED = "Advanced";
const WORKSPACE = "Workspace";

const SECTIONS: SectionDef[] = [
  {
    screen: "general",
    title: "General",
    description: "Manage your site identity, language and social profiles.",
    group: SITE_SETUP,
    fields: [
      ["Site name", "Site identity", "site-name"],
      ["Favicon URL", "Site identity", "favicon-url"],
      ["Site Language", "Site identity", "site-language"],
      ["Author", "Site identity", "site-author"],
      ["Twitter", "Social links", "social-twitter"],
      ["Facebook", "Social links", "social-facebook"],
      ["LinkedIn", "Social links", "social-linkedin"],
      ["Grid size", "Canvas", "canvas-grid-size"],
      ["Snap to grid", "Canvas", "canvas-snap"],
    ],
  },
  { screen: "branding", title: "Fonts & colours", description: "Site fonts and colour tokens", group: SITE_SETUP },
  {
    screen: "localization",
    title: "Localization",
    description: "Locale claim and preview",
    group: SITE_SETUP,
    fields: [["Default locale", "Default", "default-locale"]],
  },
  {
    screen: "seo",
    title: "SEO defaults",
    description: "Search & social preview",
    group: SEO_PUBLISHING,
    fields: [
      ["Meta title", "Site SEO", "seo-meta-title"],
      ["Meta description", "Site SEO", "seo-meta-description"],
      ["Twitter Handle", "Site SEO", "seo-twitter"],
      ["Default OG Image URL", "Site SEO", "seo-og"],
      ["Allow search indexing", "Indexing", "seo-allow-indexing"],
      ["robots.txt", "Indexing", "seo-robots"],
    ],
  },
  {
    screen: "domains",
    title: "Domains",
    description: "Custom domain + DNS",
    group: SEO_PUBLISHING,
    fields: [
      ["Domain", "Custom domain", "dom-domain"],
      ["Force HTTPS", "Custom domain", "dom-force-https"],
      ["DNS records", "Records to add at your registrar", "dom-dns-records"],
    ],
  },
  {
    screen: "redirects",
    title: "Redirects",
    description: "301 / 302 redirects",
    group: SEO_PUBLISHING,
    fields: [
      ["From path", "Add redirect", "from-path"],
      ["To URL", "Add redirect", "to-url"],
      ["Type", "Add redirect", "type"],
    ],
  },
  { screen: "export", title: "Export", description: "HTML, ZIP or React", group: SEO_PUBLISHING },
  {
    screen: "analytics",
    title: "Analytics",
    description: "Google Analytics, Meta Pixel, Clarity, Tag Manager",
    group: VISITORS,
    fields: [
      ["Google Analytics ID", "Google Analytics", "google-analytics-id"],
      ["Enable Google Analytics", "Google Analytics", "enable-google-analytics"],
      ["Pixel ID", "Meta Pixel", "pixel-id"],
      ["Enable Meta Pixel", "Meta Pixel", "enable-meta-pixel"],
      ["Clarity Project ID", "Microsoft Clarity", "clarity-project-id"],
      ["Enable Microsoft Clarity", "Microsoft Clarity", "enable-microsoft-clarity"],
      ["GTM Container ID", "Google Tag Manager", "gtm-container-id"],
      ["Enable Google Tag Manager", "Google Tag Manager", "enable-google-tag-manager"],
      ["Show cookie banner (stored, not yet shown)", "Consent", "show-cookie-banner-stored-not-yet-shown"],
    ],
  },
  {
    screen: "forms",
    title: "Forms",
    description: "Submissions inbox + config",
    group: VISITORS,
    fields: [["Form", "Select a form to view its submissions inbox.", "form"]],
  },
  {
    screen: "custom-code",
    title: "Custom code",
    description: "Head, body, CSS injections",
    group: ADVANCED,
    fields: [
      ["Head scripts", "<head>", "code-head"],
      ["Body scripts (end)", "</body>", "code-body"],
      ["Global CSS", "styles", "code-css"],
    ],
  },
  {
    screen: "headers",
    title: "Headers",
    description: "CSP, HSTS, security policy",
    group: ADVANCED,
    fields: [
      ["CSP header value", "Content Security Policy", "csp-header-value"],
      ["Max age", "HSTS (HTTP Strict Transport Security)", "max-age"],
      ["Policy", "X-Frame-Options", "x-frame-policy"],
      ["Policy", "Referrer-Policy", "referrer-policy"],
      ["Header value", "Permissions-Policy", "header-value"],
    ],
  },
  { screen: "integrations", title: "Integrations", description: "Third-party services", group: ADVANCED },
  {
    screen: "webhooks",
    title: "Webhooks",
    description: "Workspace event deliveries",
    group: WORKSPACE,
    fields: [
      ["Endpoint URL", "Endpoint", "endpoint-url"],
      ["Events", "Endpoint", "events"],
      ["Signing secret", "Endpoint", "signing-secret"],
    ],
  },
  { screen: "members", title: "Members", description: "Members, roles & seats", group: WORKSPACE },
  { screen: "billing", title: "Billing", description: "Invoices & payment method", group: WORKSPACE },
];

export const SETTINGS_SEARCH_INDEX: SearchEntry[] = SECTIONS.flatMap(
  ({ screen, title, description, group, fields = [] }): SearchEntry[] => [
    { id: screen, title, description, group, screen },
    ...fields.map(
      ([fieldTitle, fieldDescription, fieldId]): SearchEntry => ({
        id: `${screen}/${fieldId}`,
        title: fieldTitle,
        description: fieldDescription,
        group: title,
        screen,
        fieldId,
      }),
    ),
  ],
);

/**
 * Case-insensitive substring over title, description and group, in registry
 * order. An empty query is the section list — the fifteen destinations, no
 * fields — which is what the dialog opens on.
 */
export function searchSettings(query: string): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return SETTINGS_SEARCH_INDEX.filter((entry) => entry.fieldId === undefined);
  return SETTINGS_SEARCH_INDEX.filter((entry) =>
    [entry.title, entry.description, entry.group].some((text) => text.toLowerCase().includes(q)),
  );
}

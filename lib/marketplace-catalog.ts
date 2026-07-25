// Static first-party/partner app catalog. Lives in lib/ (not components/) so the
// marketplace service can validate app ids against it without a service →
// components import. Curated content only — per-workspace install state is real
// data and lives in the WorkspaceApp table.
export type AppCategory = "Analytics" | "Commerce" | "Marketing" | "Forms" | "SEO";

/** "Install" = first-party feature we can toggle per workspace (real, backed by
 *  WorkspaceApp). "Connect" = third-party OAuth integration, which is owned by
 *  Settings › Integrations — the marketplace card links there rather than
 *  pretending to connect. */
export type AppAction = "Connect" | "Install";

/** One config input rendered in the Configure dialog for a configurable app.
 *  `key` maps to a field on the app's config schema in
 *  packages/shared/schemas/marketplace.ts. */
export interface AppConfigField {
  key: string;
  label: string;
  hint?: string;
  placeholder?: string;
  /** When true the field may be left blank (the app's schema decides validity,
   *  e.g. Site Verification needs any one of several optional codes). */
  optional?: boolean;
}

export interface CatalogApp {
  id: string;
  name: string;
  category: AppCategory;
  description: string;
  /** lucide icon name resolved in the consumer's iconMap */
  icon: string;
  action: AppAction;
  /** Brand tile colour. Used at low alpha for the tile fill and solid for the
   *  glyph. Per-app branding, NOT an accent — see DESIGN.md §Marketplace tiles. */
  color: string;
  /** Present when the app injects a workspace-wide head script that needs
   *  config (e.g. Live Chat). Drives the Configure dialog; absent = the app is
   *  a plain install with no settings. */
  configFields?: readonly AppConfigField[];
}

export const MARKETPLACE_CATEGORIES: readonly AppCategory[] = ["Analytics", "Commerce", "Marketing", "Forms", "SEO"];

export const FEATURED_APP = {
  name: "Analytics Pro",
  category: "Analytics" as AppCategory,
  description: "Funnels, retention cohorts and real-time dashboards — built for agencies managing many client sites.",
  cta: "Get Analytics Pro",
};

export const CATALOG_APPS: readonly CatalogApp[] = [
  { id: "google-analytics", name: "Google Analytics", category: "Analytics", description: "Traffic, events and conversion tracking on every published site.", icon: "BarChart3", action: "Connect", color: "#EA8E1E" },
  { id: "commerce", name: "Commerce", category: "Commerce", description: "Products, carts and Stripe checkout — turn any site into a store.", icon: "ShoppingCart", action: "Install", color: "#7C5CF6" },
  { id: "mailchimp", name: "Mailchimp", category: "Marketing", description: "Sync form submissions straight into your email audiences.", icon: "Mail", action: "Connect", color: "#2D6DFF" },
  { id: "typeform", name: "Typeform", category: "Forms", description: "Embed conversational forms and pipe responses to Submissions.", icon: "FileText", action: "Install", color: "#0D94A6" },
  { id: "search-console", name: "Search Console", category: "SEO", description: "Monitor indexing, queries and Core Web Vitals per site.", icon: "Search", action: "Connect", color: "#DB508C" },
  {
    id: "live-chat",
    name: "Live Chat",
    category: "Marketing",
    description: "Add a Tawk.to chat widget to every published site and route conversations to your inbox.",
    icon: "MessageSquare",
    action: "Install",
    color: "#0D94A6",
    configFields: [
      { key: "propertyId", label: "Tawk.to Property ID", hint: "Tawk.to → Administration → Channels → Chat Widget. The first code in the widget URL.", placeholder: "5f9a1b2c3d4e5f6a7b8c9d0e" },
      { key: "widgetId", label: "Widget ID", hint: "The second code in the widget URL (often 1abc2def3, or “default”).", placeholder: "1abc2def3" },
    ],
  },
  { id: "memberships", name: "Memberships", category: "Marketing", description: "Gate content with paid tiers and logins.", icon: "Lock", action: "Install", color: "#EA8E1E" },
  {
    id: "hubspot",
    name: "HubSpot",
    category: "Marketing",
    description: "Load the HubSpot tracking code on every site — capture leads and analytics into your CRM.",
    icon: "Users",
    action: "Install",
    color: "#FF7A59",
    configFields: [
      { key: "portalId", label: "Hub ID (Portal ID)", hint: "HubSpot → Settings → Tracking Code. The numeric Hub ID.", placeholder: "1234567" },
    ],
  },
  {
    id: "linkedin-insight",
    name: "LinkedIn Insight Tag",
    category: "Marketing",
    description: "Track conversions and build retargeting audiences for LinkedIn Ads across your sites.",
    icon: "TrendingUp",
    action: "Install",
    color: "#0A66C2",
    configFields: [
      { key: "partnerId", label: "Partner ID", hint: "LinkedIn Campaign Manager → Analyze → Insight Tag. The numeric partner ID.", placeholder: "1234567" },
    ],
  },
  {
    id: "tiktok-pixel",
    name: "TikTok Pixel",
    category: "Marketing",
    description: "Measure TikTok ad performance and build audiences with the TikTok pixel.",
    icon: "Video",
    action: "Install",
    color: "#010101",
    configFields: [
      { key: "pixelId", label: "Pixel ID", hint: "TikTok Events Manager → your pixel → the pixel code.", placeholder: "C4A1B2C3D4E5F6G7H8I9" },
    ],
  },
  {
    id: "pinterest-tag",
    name: "Pinterest Tag",
    category: "Marketing",
    description: "Track Pinterest conversions and reach shoppers who saved your pins.",
    icon: "Pin",
    action: "Install",
    color: "#E60023",
    configFields: [
      { key: "tagId", label: "Tag ID", hint: "Pinterest → Ads → Conversions → Pinterest Tag. The numeric tag ID.", placeholder: "2612345678901" },
    ],
  },
  {
    id: "site-verification",
    name: "Site Verification",
    category: "SEO",
    description: "Prove you own your sites for Google, Bing and Pinterest — needed before you can see search data.",
    icon: "ShieldCheck",
    action: "Install",
    color: "#1A8917",
    configFields: [
      { key: "google", label: "Google Search Console code", hint: "Search Console → add property → HTML tag method → the content value.", placeholder: "abc123…", optional: true },
      { key: "bing", label: "Bing Webmaster code", hint: "Bing Webmaster Tools → HTML meta tag → the content value.", placeholder: "ABC123…", optional: true },
      { key: "pinterest", label: "Pinterest verification code", hint: "Pinterest → Claim website → the content value.", placeholder: "abc123…", optional: true },
    ],
  },
];

/** The subset a workspace can actually install. Connect-type apps are OAuth
 *  integrations and are never written to WorkspaceApp. */
export function isInstallableApp(appId: string): boolean {
  return CATALOG_APPS.some((a) => a.id === appId && a.action === "Install");
}

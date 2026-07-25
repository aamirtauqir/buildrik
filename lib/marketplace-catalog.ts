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
];

/** The subset a workspace can actually install. Connect-type apps are OAuth
 *  integrations and are never written to WorkspaceApp. */
export function isInstallableApp(appId: string): boolean {
  return CATALOG_APPS.some((a) => a.id === appId && a.action === "Install");
}

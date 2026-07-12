// Static first-party/partner app catalog. Shared by the Marketplace and Apps
// screens. Curated content (no user data) — "installed" is a display seed until
// per-workspace install state ships.
export type AppCategory = "Analytics" | "Commerce" | "Marketing" | "Forms" | "SEO";

export interface CatalogApp {
  id: string;
  name: string;
  category: AppCategory;
  description: string;
  /** lucide icon name resolved in the consumer's iconMap */
  icon: string;
  action: "Connect" | "Install";
  installed: boolean;
}

export const MARKETPLACE_CATEGORIES: readonly AppCategory[] = ["Analytics", "Commerce", "Marketing", "Forms", "SEO"];

export const FEATURED_APP = {
  name: "Analytics Pro",
  category: "Analytics" as AppCategory,
  description: "Funnels, retention cohorts and real-time dashboards — built for agencies managing many client sites.",
  cta: "Get Analytics Pro",
};

export const CATALOG_APPS: readonly CatalogApp[] = [
  { id: "google-analytics", name: "Google Analytics", category: "Analytics", description: "Traffic, events and conversion tracking on every published site.", icon: "BarChart3", action: "Connect", installed: true },
  { id: "commerce", name: "Commerce", category: "Commerce", description: "Products, carts and Stripe checkout — turn any site into a store.", icon: "ShoppingCart", action: "Install", installed: false },
  { id: "mailchimp", name: "Mailchimp", category: "Marketing", description: "Sync form submissions straight into your email audiences.", icon: "Mail", action: "Connect", installed: false },
  { id: "typeform", name: "Typeform", category: "Forms", description: "Embed conversational forms and pipe responses to Submissions.", icon: "FileText", action: "Install", installed: true },
  { id: "search-console", name: "Search Console", category: "SEO", description: "Monitor indexing, queries and Core Web Vitals per site.", icon: "Search", action: "Connect", installed: true },
  { id: "live-chat", name: "Live Chat", category: "Marketing", description: "Add a chat widget and route conversations to your inbox.", icon: "MessageSquare", action: "Install", installed: false },
  { id: "memberships", name: "Memberships", category: "Marketing", description: "Gate content with paid tiers and logins.", icon: "Lock", action: "Install", installed: false },
];

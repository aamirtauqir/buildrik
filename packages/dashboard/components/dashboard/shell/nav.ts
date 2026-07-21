// Nav SSOT — IA v2: 6 destinations + 2 support items (spec
// docs/superpowers/specs/2026-07-16-dashboard-ia-v2-design.md). Top-level product
// areas (Marketplace/Learn/Resources) live in the top nav, NOT here.
// Pure module (no React/client deps) so the sidebar, the command palette and the
// contract tests can all import it without a cycle.

export type NavIcon =
  | "Home"
  | "LayoutGrid"
  | "Users"
  | "Image"
  | "LayoutTemplate"
  | "Settings"
  | "Shield"
  | "HelpCircle";

export type NavItem = { label: string; href: string; icon: NavIcon; agencyOnly?: boolean };
export type NavGroup = { label?: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  { items: [
    { label: "Home", href: "/dashboard", icon: "Home" },
    // Setup is part of the product, not "support" — it lives in the main group,
    // right under Home, rather than filed away beside Help.
    { label: "Getting started", href: "/dashboard/getting-started", icon: "Shield" },
    // "Sites", not "Projects": the rest of the product never stopped saying site
    // (create site, publish site, /dashboard/sites/[id], help copy). The list
    // route stays /dashboard/projects; only the vocabulary reverts.
    { label: "Sites", href: "/dashboard/projects", icon: "LayoutGrid" },
    { label: "Agency", href: "/dashboard/agency", icon: "Users", agencyOnly: true },
    { label: "Media", href: "/dashboard/media", icon: "Image" },
    { label: "Templates", href: "/dashboard/templates", icon: "LayoutTemplate" },
    { label: "Settings", href: "/dashboard/settings", icon: "Settings" },
  ] },
  // No Support group: Help centre moved out of the workspace sidebar into
  // Resources (the ecosystem launcher), where it sits beside Learn, API & tokens
  // and Getting started. Help is reference material, not a workspace destination.
  // /dashboard/help still exists; Resources links to it.
];

export function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  // Site-detail keeps its /dashboard/sites/[id] URLs; its nav parent is Projects.
  if (href === "/dashboard/projects" && pathname.startsWith("/dashboard/sites")) return true;
  return pathname.startsWith(href);
}

// The ecosystem areas — top-level product surfaces that are NOT workspace
// destinations. They live in the top nav, and (unlike every workspace page) they
// render full-width with no sidebar. Declared here, not in top-nav.tsx, because
// two consumers need it: the top nav (labels + the Dashboard link's active state)
// and DashboardShell (whether to show the sidebar). One list, no drift.
export const ECOSYSTEM_NAV = [
  { label: "Marketplace", href: "/dashboard/marketplace" },
  { label: "Learn", href: "/dashboard/learn" },
  { label: "Resources", href: "/dashboard/resources" },
] as const;

/** True on an ecosystem page (Marketplace/Learn/Resources). These go full-width;
 *  everything else under /dashboard keeps the workspace sidebar. The single
 *  predicate behind both the sidebar's visibility and the topbar's "Dashboard"
 *  active state, so the two can never disagree about what "the workspace" is. */
export function isEcosystemRoute(pathname: string): boolean {
  return ECOSYSTEM_NAV.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"));
}

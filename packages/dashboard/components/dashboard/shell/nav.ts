// Nav SSOT — IA v2 (spec docs/superpowers/specs/2026-07-16-dashboard-ia-v2-design.md).
// Workspace destinations live in NAV_GROUPS (the sidebar). Top-level ecosystem
// areas (Marketplace/Learn/Resources/Templates) live in the top nav, NOT here —
// they're browse/discover surfaces, not workspace pages, and render full-width.
// Pure module (no React/client deps) so the sidebar, the command palette and the
// contract tests can all import it without a cycle.

export type NavIcon =
  | "Home"
  | "LayoutGrid"
  | "Users"
  | "Image"
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
  // Templates is a browse-the-catalog surface, not a workspace destination — it
  // sits with the other ecosystem tabs, so its full-width layout is coherent
  // (you don't "manage" templates, you browse them; you USE one in sites/new).
  { label: "Templates", href: "/dashboard/templates" },
] as const;

// Every route that renders FULL-WIDTH with no workspace sidebar: the ecosystem
// tabs above (Marketplace/Learn/Resources/Templates), plus reference pages
// reached from them (Help). The ecosystem hrefs are folded in via the map, so a
// new ecosystem tab is full-width automatically.
const FULL_WIDTH_ROUTES = [...ECOSYSTEM_NAV.map((n) => n.href), "/dashboard/help"];

/** True on a full-width page (the ecosystem tabs + Help). These drop the workspace
 *  sidebar; everything else under /dashboard keeps it. The single predicate behind
 *  both the sidebar's visibility and the topbar's "Dashboard" active state, so the
 *  two can never disagree about what "the workspace" is. */
export function isFullWidthRoute(pathname: string): boolean {
  return FULL_WIDTH_ROUTES.some((href) => pathname === href || pathname.startsWith(href + "/"));
}

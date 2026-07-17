// Nav SSOT — IA v2: 6 destinations + 2 support items (spec
// docs/superpowers/specs/2026-07-16-dashboard-ia-v2-design.md). Top-level product
// areas (Marketplace/Learn/Resources) live in the top nav, NOT here.
// Pure module (no React/client deps) so the sidebar, the command palette and the
// contract tests can all import it without a cycle.

export type NavIcon =
  | "LayoutDashboard"
  | "FolderKanban"
  | "Briefcase"
  | "Image"
  | "Library"
  | "Settings"
  | "Rocket"
  | "HelpCircle";

export type NavItem = { label: string; href: string; icon: NavIcon; agencyOnly?: boolean };
export type NavGroup = { label?: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  { items: [
    { label: "Home", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "Projects", href: "/dashboard/projects", icon: "FolderKanban" },
    { label: "Agency", href: "/dashboard/agency", icon: "Briefcase", agencyOnly: true },
    { label: "Media", href: "/dashboard/media", icon: "Image" },
    { label: "Templates", href: "/dashboard/templates", icon: "Library" },
    { label: "Settings", href: "/dashboard/settings", icon: "Settings" },
  ] },
  { label: "Support", items: [
    { label: "Getting started", href: "/dashboard/getting-started", icon: "Rocket" },
    { label: "Help center", href: "/dashboard/help", icon: "HelpCircle" },
  ] },
];

export function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  // Site-detail keeps its /dashboard/sites/[id] URLs; its nav parent is Projects.
  if (href === "/dashboard/projects" && pathname.startsWith("/dashboard/sites")) return true;
  return pathname.startsWith(href);
}

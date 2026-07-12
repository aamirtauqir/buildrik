"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FolderKanban, Globe, Image as ImageIcon, Rocket, Briefcase, ClipboardCheck,
  MessageSquare, Palette, Gift, Blocks, Library, Users, CreditCard, Tag, Activity, Link2,
  Settings, HelpCircle, ArrowUpRight,
} from "lucide-react";
import { cn } from "@lib/utils";
import { trpc } from "@lib/trpc/client";
import { MetricValue, ProgressBar } from "@/components/dashboard/primitives";

const PLAN_LABELS: Record<string, string> = { FREE: "Free", PRO: "Pro", BUSINESS: "Business" };

const iconMap = {
  LayoutDashboard, FolderKanban, Globe, Image: ImageIcon, Rocket, Briefcase, ClipboardCheck,
  MessageSquare, Palette, Gift, Blocks, Library, Users, CreditCard, Tag, Activity, Link2,
  Settings, HelpCircle,
} as const;

type NavItem = { label: string; href: string; icon: keyof typeof iconMap; agencyOnly?: boolean };
type NavGroup = { label: string | null; items: NavItem[] };

// Sidebar SSOT — workspace/operational destinations only. Top-level product
// areas (Marketplace/Learn/Resources) live in the top nav, NOT here.
export const NAV_GROUPS: NavGroup[] = [
  { label: null, items: [
    { label: "Home", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "All projects", href: "/dashboard/projects", icon: "FolderKanban" },
    { label: "My Sites", href: "/dashboard/sites", icon: "Globe" },
    { label: "Media", href: "/dashboard/media", icon: "Image" },
    { label: "Getting started", href: "/dashboard/getting-started", icon: "Rocket" },
  ] },
  { label: "Agency", items: [
    { label: "Clients", href: "/dashboard/clients", icon: "Briefcase", agencyOnly: true },
    { label: "Reviews", href: "/dashboard/reviews", icon: "ClipboardCheck", agencyOnly: true },
    { label: "Comments", href: "/dashboard/comments", icon: "MessageSquare", agencyOnly: true },
    { label: "Shared theme", href: "/dashboard/theme", icon: "Palette", agencyOnly: true },
    { label: "Partner program", href: "/dashboard/partner", icon: "Gift", agencyOnly: true },
  ] },
  { label: "Extend", items: [
    { label: "Apps", href: "/dashboard/apps", icon: "Blocks" },
    { label: "Libraries & Templates", href: "/dashboard/libraries", icon: "Library" },
  ] },
  { label: "Workspace", items: [
    { label: "Team", href: "/dashboard/team", icon: "Users" },
    { label: "Billing", href: "/dashboard/billing", icon: "CreditCard" },
    { label: "Plans", href: "/dashboard/plans", icon: "Tag" },
    { label: "Usage", href: "/dashboard/usage", icon: "Activity" },
    { label: "Domains", href: "/dashboard/domains", icon: "Link2" },
    { label: "Settings", href: "/dashboard/settings", icon: "Settings" },
    { label: "Help", href: "/dashboard/help", icon: "HelpCircle" },
  ] },
];

const MOBILE_ITEMS: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Sites", href: "/dashboard/sites", icon: "Globe" },
  { label: "Media", href: "/dashboard/media", icon: "Image" },
  { label: "Team", href: "/dashboard/team", icon: "Users" },
  { label: "Settings", href: "/dashboard/settings", icon: "Settings" },
];

function useVisibleGroups(): NavGroup[] {
  const features = trpc.features.list.useQuery(undefined, { staleTime: 60_000 });
  const agency = !!features.data?.agency_layer;
  return NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((it) => !it.agencyOnly || agency) }))
    .filter((g) => g.items.length > 0);
}

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-14 items-center justify-around border-t bg-white lg:hidden" style={{ borderColor: "var(--color-border-default)" }}>
      {MOBILE_ITEMS.map((item) => {
        const active = isActiveRoute(pathname, item.href);
        const Icon = iconMap[item.icon];
        return (
          <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors", active ? "text-[var(--color-primary)]" : "text-[var(--color-text-secondary)]")}>
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const groups = useVisibleGroups();
  const health = trpc.dashboard.health.useQuery(undefined, { staleTime: 60_000 });

  const plan = health.data?.plan ?? "FREE";
  const sitesUsed = health.data?.sites.used ?? 0;
  const sitesLimit = health.data?.sites.limit ?? 0;
  const usagePct = sitesLimit > 0 ? Math.min((sitesUsed / sitesLimit) * 100, 100) : 0;

  return (
    <>
      <aside
        className="fixed left-0 z-30 hidden w-[var(--sidebar-w)] flex-col border-r bg-white lg:flex"
        style={{ top: "var(--topnav-h)", height: "calc(100vh - var(--topnav-h))", borderColor: "var(--color-border-default)" }}
      >
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {groups.map((group, gi) => (
            <div key={group.label ?? `g${gi}`} className={gi > 0 ? "mt-4" : undefined}>
              {group.label && (
                <p className="px-3 pb-1 text-eyebrow uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{group.label}</p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActiveRoute(pathname, item.href);
                  const Icon = iconMap[item.icon];
                  return (
                    <li key={item.href}>
                      <Link href={item.href} className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-body font-medium transition-colors",
                        active ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)]"
                      )}>
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="shrink-0 border-t px-4 py-3 space-y-2" style={{ borderColor: "var(--color-border-default)" }}>
          <div className="flex items-center justify-between">
            <p className="text-body-sm font-medium" style={{ color: "var(--color-text-primary)" }}>My Workspace</p>
            <span className="rounded-pill px-2 py-0.5 text-eyebrow font-semibold" style={{
              backgroundColor: plan === "FREE" ? "var(--color-bg-subtle)" : "var(--color-primary-subtle)",
              color: plan === "FREE" ? "var(--color-text-secondary)" : "var(--color-primary)",
            }}>{PLAN_LABELS[plan] ?? plan}</span>
          </div>
          {!health.isLoading && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-body-sm">
                <span style={{ color: "var(--color-text-secondary)" }}>Sites</span>
                <span className="font-medium" style={{ color: "var(--color-text-primary)" }}><MetricValue>{sitesUsed}/{sitesLimit}</MetricValue></span>
              </div>
              <ProgressBar pct={usagePct} tone="auto" />
            </div>
          )}
          {plan === "FREE" && (
            <Link href="/dashboard/plans" className="flex items-center gap-1 text-body-sm font-medium hover:underline" style={{ color: "var(--color-primary)" }}>
              Upgrade <ArrowUpRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </aside>

      <MobileTabBar />
    </>
  );
}

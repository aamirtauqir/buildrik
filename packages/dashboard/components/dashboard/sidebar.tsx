"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Globe, Briefcase, Users, CreditCard, Settings, ArrowUpRight } from "lucide-react";
import { cn } from "@lib/utils";
import { trpc } from "@lib/trpc/client";

const PLAN_LABELS: Record<string, string> = {
  FREE: "Free",
  PRO: "Pro",
  BUSINESS: "Business",
};

export const SIDEBAR_NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "My Sites", href: "/dashboard/sites", icon: "Globe" },
  { label: "Team", href: "/dashboard/team", icon: "Users" },
  { label: "Billing", href: "/dashboard/billing", icon: "CreditCard" },
  { label: "Settings", href: "/dashboard/settings", icon: "Settings" },
] as const;

const iconMap = { LayoutDashboard, Globe, Briefcase, Users, CreditCard, Settings } as const;

// Nav items including the agency "Clients" entry, surfaced only when the
// agency_layer flag is on (ships dark for solo workspaces — no empty agency
// chrome). Inserted after "My Sites" so the hierarchy reads Sites › Clients.
function useNavItems(): ReadonlyArray<{ label: string; href: string; icon: string }> {
  const features = trpc.features.list.useQuery(undefined, { staleTime: 60_000 });
  if (!features.data?.agency_layer) return SIDEBAR_NAV_ITEMS;
  return [
    SIDEBAR_NAV_ITEMS[0],
    SIDEBAR_NAV_ITEMS[1],
    { label: "Clients", href: "/dashboard/clients", icon: "Briefcase" },
    ...SIDEBAR_NAV_ITEMS.slice(2),
  ];
}

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

function MobileTabBar() {
  const pathname = usePathname();
  const navItems = useNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-14 items-center justify-around border-t bg-white lg:hidden" style={{ borderColor: "var(--color-border-default)" }}>
      {navItems.map((item) => {
        const active = isActiveRoute(pathname, item.href);
        const Icon = iconMap[item.icon as keyof typeof iconMap];
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors",
              active ? "text-[var(--color-primary)]" : "text-[var(--color-text-secondary)]"
            )}
          >
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
  const navItems = useNavItems();
  const health = trpc.dashboard.health.useQuery(undefined, {
    staleTime: 60_000,
  });

  const plan = health.data?.plan ?? "FREE";
  const sitesUsed = health.data?.sites.used ?? 0;
  const sitesLimit = health.data?.sites.limit ?? 0;
  const usagePct = sitesLimit > 0 ? Math.min((sitesUsed / sitesLimit) * 100, 100) : 0;

  return (
    <>
      {/* Desktop sidebar — hidden below lg */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[220px] flex-col border-r bg-white lg:flex" style={{ borderColor: "var(--color-border-default)" }}>
        <div className="flex h-14 items-center px-5">
          <Link href="/dashboard" className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>Buildrik</Link>
        </div>
        <nav className="flex-1 px-3 py-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = isActiveRoute(pathname, item.href);
              const Icon = iconMap[item.icon as keyof typeof iconMap];
              return (
                <li key={item.href}>
                  <Link href={item.href} className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-red-50 text-[var(--color-primary)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)]"
                  )}>
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t px-4 py-3 space-y-2" style={{ borderColor: "var(--color-border-default)" }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>My Workspace</p>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{
              backgroundColor: plan === "FREE" ? "var(--color-bg-subtle)" : "#FEF2F2",
              color: plan === "FREE" ? "var(--color-text-secondary)" : "var(--color-primary)",
            }}>
              {PLAN_LABELS[plan] ?? plan}
            </span>
          </div>
          {!health.isLoading && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>Sites</span>
                <span className="text-[11px] font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {sitesUsed}/{sitesLimit}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border-default)]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${usagePct}%`,
                    backgroundColor: usagePct >= 85 ? "#EF4444" : usagePct >= 60 ? "#EAB308" : "var(--color-success)",
                  }}
                />
              </div>
            </div>
          )}
          {plan === "FREE" && (
            <Link
              href="/dashboard/billing"
              className="flex items-center gap-1 text-[11px] font-medium hover:underline"
              style={{ color: "var(--color-primary)" }}
            >
              Upgrade
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile bottom tab bar — hidden at lg and above */}
      <MobileTabBar />
    </>
  );
}

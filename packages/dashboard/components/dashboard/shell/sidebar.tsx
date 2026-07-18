"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, LayoutGrid, Image as ImageIcon, Shield, Users, LayoutTemplate,
  Settings, HelpCircle, ArrowUpRight,
} from "lucide-react";
import { cn } from "@lib/utils";
import { trpc } from "@lib/trpc/client";
import { PLAN_LIMITS } from "@lib/constants/plan-limits";
import { MetricValue, Pill, ProgressBar } from "@/components/dashboard/primitives";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { NAV_GROUPS, isActiveRoute, type NavGroup, type NavIcon } from "./nav";

const PLAN_LABELS: Record<string, string> = { FREE: "Free", PRO: "Pro", BUSINESS: "Business" };

const iconMap: Record<NavIcon, typeof Home> = {
  Home, LayoutGrid, Users, Image: ImageIcon, LayoutTemplate,
  Settings, Shield, HelpCircle,
};

// Mobile carries the same 6 destinations — derived, not a second hardcoded list.
const MOBILE_ITEMS = NAV_GROUPS[0].items;

function useAgencyEnabled(): boolean {
  const features = trpc.features.list.useQuery(undefined, { staleTime: 60_000 });
  return !!features.data?.agency_layer;
}

function useVisibleGroups(): NavGroup[] {
  const agency = useAgencyEnabled();
  return NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((it) => !it.agencyOnly || agency) }))
    .filter((g) => g.items.length > 0);
}

function MobileTabBar() {
  const pathname = usePathname();
  const agency = useAgencyEnabled();
  const items = MOBILE_ITEMS.filter((it) => !it.agencyOnly || agency);
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-14 items-center justify-around border-t bg-white lg:hidden" style={{ borderColor: "var(--color-border-default)" }}>
      {items.map((item) => {
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

// Bottom-pinned plan card (design: Shell.dc.html). Plan comes from the same
// dashboard.usage query the old storage card read; site usage reuses the
// totalSites count the sidebar already fetches for the Projects nav badge —
// no new query, just PLAN_LIMITS (existing client-side constant) for the cap.
function PlanCard({ totalSites }: { totalSites: number | undefined }) {
  const usage = trpc.dashboard.usage.useQuery(undefined, { staleTime: 60_000 });
  const plan = usage.data?.plan ?? "FREE";
  const limit = PLAN_LIMITS[plan].sites as number;
  const used = totalSites ?? 0;
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  return (
    <div className="border-t px-5 pt-3.5 pb-4" style={{ borderColor: "var(--color-border-default)" }}>
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold" style={{ color: "var(--color-text-primary)" }}>Plan</p>
        <Pill tone="neutral">{PLAN_LABELS[plan] ?? plan}</Pill>
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>Sites</span>
        <span className="text-[12px] font-medium" style={{ color: "var(--color-text-primary)" }}>
          <MetricValue>{used} / {limit > 0 ? limit : "∞"}</MetricValue>
        </span>
      </div>
      <ProgressBar pct={pct} className="mt-1.5" />
      <Link
        href="/dashboard/settings/plans"
        className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-medium hover:underline"
        style={{ color: "var(--color-primary)" }}
      >
        Upgrade <ArrowUpRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const groups = useVisibleGroups();
  // Projects count badge. Reuses the same stats query the Home page runs, so
  // react-query dedupes it there; elsewhere it's one 60s-cached call.
  const stats = trpc.dashboard.stats.useQuery(undefined, { staleTime: 60_000 });
  const navCount: Record<string, number | undefined> = {
    "/dashboard/projects": stats.data?.totalSites,
  };

  return (
    <>
      <aside
        className="fixed left-0 z-30 hidden w-[var(--sidebar-w)] flex-col border-r bg-white lg:flex"
        style={{ top: "var(--topnav-h)", height: "calc(100vh - var(--topnav-h))", borderColor: "var(--color-border-default)" }}
      >
        <div className="shrink-0 px-3.5 pt-3.5">
          <WorkspaceSwitcher />
        </div>

        <nav className="flex-1 overflow-y-auto px-3.5 py-3">
          {groups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? "mt-3 border-t pt-3" : undefined} style={gi > 0 ? { borderColor: "var(--color-border-default)" } : undefined}>
              {group.label && (
                <p className="mb-1 px-2.5 text-eyebrow font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActiveRoute(pathname, item.href);
                  const Icon = iconMap[item.icon];
                  const count = navCount[item.href];
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex h-11 items-center gap-[14px] rounded-lg px-[15px] text-[13.5px] transition-colors",
                          active ? "font-semibold" : "font-normal hover:bg-[var(--color-bg-subtle)]"
                        )}
                        style={{
                          backgroundColor: active ? "var(--color-nav-item-active-bg)" : "transparent",
                          boxShadow: active ? "inset 3px 0 0 var(--color-primary)" : undefined,
                          color: active ? "var(--color-nav-label-active)" : "var(--color-nav-label)",
                        }}
                      >
                        <Icon
                          className="h-[18px] w-[18px] shrink-0"
                          style={{ color: active ? "var(--color-primary)" : "var(--color-text-primary)" }}
                        />
                        {item.label}
                        {count != null && count > 0 && (
                          <span
                            className="ml-auto rounded-full px-2 py-0.5 text-eyebrow font-semibold tabular-nums"
                            style={{ backgroundColor: active ? "var(--color-bg-surface)" : "var(--color-bg-subtle)", color: "var(--color-text-muted)" }}
                          >
                            {count}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0">
          <PlanCard totalSites={stats.data?.totalSites} />
        </div>
      </aside>

      <MobileTabBar />
    </>
  );
}

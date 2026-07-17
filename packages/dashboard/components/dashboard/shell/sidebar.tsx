"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FolderKanban, Image as ImageIcon, Rocket, Briefcase, Library,
  Settings, HelpCircle, ArrowUpRight, Search,
} from "lucide-react";
import { cn } from "@lib/utils";
import { trpc } from "@lib/trpc/client";
import { MetricValue, ProgressBar } from "@/components/dashboard/primitives";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { CommandPalette } from "@/components/search/command-palette";
import { NAV_GROUPS, isActiveRoute, type NavGroup, type NavIcon } from "./nav";

const iconMap: Record<NavIcon, typeof LayoutDashboard> = {
  LayoutDashboard, FolderKanban, Image: ImageIcon, Rocket, Briefcase, Library,
  Settings, HelpCircle,
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

function StorageCard() {
  const usage = trpc.dashboard.usage.useQuery(undefined, { staleTime: 60_000 });
  const storage = usage.data?.metrics.find((m) => m.key === "storage");
  const plan = usage.data?.plan ?? "FREE";
  const used = storage?.used ?? 0;
  const limit = storage?.limit ?? 0;
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
      <div className="flex items-center justify-between">
        <p className="text-body-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Storage</p>
        <span className="text-eyebrow" style={{ color: "var(--color-text-secondary)" }}>
          <MetricValue>{used} / {limit > 0 ? limit : "∞"} GB</MetricValue>
        </span>
      </div>
      <ProgressBar pct={pct} tone="accent" className="mt-2" />
      {plan === "FREE" && (
        <Link href="/dashboard/settings/plans" className="mt-2 flex items-center gap-1 text-body-sm font-semibold hover:underline" style={{ color: "var(--color-primary)" }}>
          Upgrade plan <ArrowUpRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const groups = useVisibleGroups();
  const [paletteOpen, setPaletteOpen] = useState(false);
  // Projects count badge. Reuses the same stats query the Home page runs, so
  // react-query dedupes it there; elsewhere it's one 60s-cached call.
  const stats = trpc.dashboard.stats.useQuery(undefined, { staleTime: 60_000 });
  const navCount: Record<string, number | undefined> = {
    "/dashboard/projects": stats.data?.totalSites,
  };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setPaletteOpen((o) => !o); }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <aside
        className="fixed left-0 z-30 hidden w-[var(--sidebar-w)] flex-col border-r bg-white lg:flex"
        style={{ top: "var(--topnav-h)", height: "calc(100vh - var(--topnav-h))", borderColor: "var(--color-border-default)" }}
      >
        <div className="shrink-0 space-y-2 px-3.5 pt-3.5">
          <WorkspaceSwitcher />
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex h-9 w-full items-center gap-2 rounded-lg border px-2.5 text-body transition-colors hover:bg-[var(--color-bg-subtle)]"
            style={{ color: "var(--color-text-placeholder)", borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-subtle)" }}
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Search…</span>
            <kbd className="rounded border bg-white px-1.5 text-eyebrow" style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-muted)" }}>⌘K</kbd>
          </button>
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
                      <Link href={item.href} className={cn(
                        "flex items-center gap-[11px] rounded-lg px-[9px] py-2 text-[13.5px] transition-colors",
                        active ? "bg-[var(--color-primary-subtle)] font-semibold text-[var(--color-primary)]" : "font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)]"
                      )}>
                        <Icon className="h-[18px] w-[18px] shrink-0" />
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

        <div className="shrink-0 p-3.5">
          <StorageCard />
        </div>
      </aside>

      <MobileTabBar />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}

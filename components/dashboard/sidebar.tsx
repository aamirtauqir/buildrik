"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Globe, Users, CreditCard, Settings, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";

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

const iconMap = { LayoutDashboard, Globe, Users, CreditCard, Settings } as const;

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  const health = trpc.dashboard.health.useQuery(undefined, {
    staleTime: 60_000,
  });

  const plan = health.data?.plan ?? "FREE";
  const sitesUsed = health.data?.sites.used ?? 0;
  const sitesLimit = health.data?.sites.limit ?? 5;
  const usagePct = sitesLimit > 0 ? Math.min((sitesUsed / sitesLimit) * 100, 100) : 0;

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[220px] flex-col border-r bg-white" style={{ borderColor: "#E8E8E8" }}>
      <div className="flex h-14 items-center px-5">
        <Link href="/dashboard" className="text-lg font-bold" style={{ color: "#0D0D0D" }}>Buildrik</Link>
      </div>
      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {SIDEBAR_NAV_ITEMS.map((item) => {
            const active = isActiveRoute(pathname, item.href);
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            return (
              <li key={item.href}>
                <Link href={item.href} className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-red-50 text-[#E42313]" : "text-[#7A7A7A] hover:bg-[#F4F4F4] hover:text-[#0D0D0D]"
                )}>
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t px-4 py-3 space-y-2" style={{ borderColor: "#E8E8E8" }}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium" style={{ color: "#0D0D0D" }}>My Workspace</p>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{
            backgroundColor: plan === "FREE" ? "#F4F4F4" : "#FEF2F2",
            color: plan === "FREE" ? "#7A7A7A" : "#E42313",
          }}>
            {PLAN_LABELS[plan] ?? plan}
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px]" style={{ color: "#7A7A7A" }}>Sites</span>
            <span className="text-[11px] font-medium" style={{ color: "#0D0D0D" }}>
              {sitesUsed}/{sitesLimit}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E8E8E8]">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${usagePct}%`,
                backgroundColor: usagePct >= 85 ? "#EF4444" : usagePct >= 60 ? "#EAB308" : "#22C55E",
              }}
            />
          </div>
        </div>
        {plan === "FREE" && (
          <Link
            href="/dashboard/billing"
            className="flex items-center gap-1 text-[11px] font-medium hover:underline"
            style={{ color: "#E42313" }}
          >
            Upgrade
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </aside>
  );
}

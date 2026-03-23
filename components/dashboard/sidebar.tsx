"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Globe, Users, CreditCard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

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
      <div className="border-t px-4 py-3" style={{ borderColor: "#E8E8E8" }}>
        <p className="text-xs font-medium" style={{ color: "#7A7A7A" }}>My Workspace</p>
        <p className="text-xs" style={{ color: "#B0B0B0" }}>Free Plan</p>
      </div>
    </aside>
  );
}

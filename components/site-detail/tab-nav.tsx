"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const SITE_DETAIL_TABS = [
  { label: "Overview", segment: "overview" },
  { label: "Settings", segment: "settings" },
  { label: "SEO", segment: "seo" },
  { label: "Domains", segment: "domains" },
  { label: "Access", segment: "access" },
  { label: "Analytics", segment: "analytics" },
] as const;

export function TabNav({ siteId }: { siteId: string }) {
  const pathname = usePathname();
  const base = `/dashboard/sites/${siteId}`;
  return (
    <nav className="border-b" style={{ borderColor: "#E8E8E8" }}>
      <ul className="flex gap-0">
        {SITE_DETAIL_TABS.map((tab) => {
          const href = tab.segment === "overview" ? base : `${base}/${tab.segment}`;
          const isActive = tab.segment === "overview"
            ? pathname === base || pathname === `${base}/overview`
            : pathname.startsWith(`${base}/${tab.segment}`);
          return (
            <li key={tab.segment}>
              <Link href={href} className={cn(
                "inline-block px-4 py-2.5 text-sm font-medium transition-colors",
                isActive ? "border-b-2 border-[#E42313] text-[#E42313]" : "text-[#7A7A7A] hover:text-[#0D0D0D]"
              )}>{tab.label}</Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

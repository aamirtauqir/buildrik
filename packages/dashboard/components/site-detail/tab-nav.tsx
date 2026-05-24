"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@lib/utils";
import { ChevronDown } from "lucide-react";

export const SITE_DETAIL_TABS = [
  { label: "Overview", segment: "overview" },
  { label: "Settings", segment: "settings" },
  { label: "SEO", segment: "seo" },
  { label: "Domains", segment: "domains" },
  { label: "Access", segment: "access" },
  { label: "Analytics", segment: "analytics" },
] as const;

function getTabHref(base: string, segment: string) {
  return segment === "overview" ? base : `${base}/${segment}`;
}

function isTabActive(pathname: string, base: string, segment: string) {
  if (segment === "overview") {
    return pathname === base || pathname === `${base}/overview`;
  }
  return pathname.startsWith(`${base}/${segment}`);
}

export function TabNav({ siteId }: { siteId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/dashboard/sites/${siteId}`;

  const activeTab = SITE_DETAIL_TABS.find((tab) => isTabActive(pathname, base, tab.segment)) ?? SITE_DETAIL_TABS[0];

  return (
    <>
      {/* Desktop / Tablet: horizontal tabs with scroll */}
      <nav className="hidden border-b md:block" style={{ borderColor: "#E8E8E8" }}>
        <ul className="flex gap-0 overflow-x-auto">
          {SITE_DETAIL_TABS.map((tab) => {
            const href = getTabHref(base, tab.segment);
            const isActive = isTabActive(pathname, base, tab.segment);
            return (
              <li key={tab.segment} className="shrink-0">
                <Link href={href} className={cn(
                  "inline-block px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
                  isActive ? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]" : "text-[#7A7A7A] hover:text-[#0D0D0D]"
                )}>{tab.label}</Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile: dropdown selector */}
      <div className="relative border-b md:hidden" style={{ borderColor: "#E8E8E8" }}>
        <select
          value={activeTab.segment}
          onChange={(e) => router.push(getTabHref(base, e.target.value))}
          className="w-full appearance-none bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-[#0D0D0D] focus:outline-none"
        >
          {SITE_DETAIL_TABS.map((tab) => (
            <option key={tab.segment} value={tab.segment}>
              {tab.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A7A7A]" />
      </div>
    </>
  );
}

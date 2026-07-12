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
  { label: "Redirects", segment: "redirects" },
  { label: "Submissions", segment: "feedback" },
  { label: "Sharing", segment: "access" },
  { label: "Traffic", segment: "analytics" },
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
      <nav className="hidden border-b md:block" style={{ borderColor: "var(--color-border-default)" }}>
        <ul className="flex gap-0 overflow-x-auto">
          {SITE_DETAIL_TABS.map((tab) => {
            const href = getTabHref(base, tab.segment);
            const isActive = isTabActive(pathname, base, tab.segment);
            return (
              <li key={tab.segment} className="shrink-0">
                <Link href={href} className={cn(
                  "inline-block px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
                  isActive ? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                )}>{tab.label}</Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile: dropdown selector */}
      <div className="relative border-b md:hidden" style={{ borderColor: "var(--color-border-default)" }}>
        <select
          value={activeTab.segment}
          onChange={(e) => router.push(getTabHref(base, e.target.value))}
          className="w-full appearance-none bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-[var(--color-text-primary)] focus:outline-none"
        >
          {SITE_DETAIL_TABS.map((tab) => (
            <option key={tab.segment} value={tab.segment}>
              {tab.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
      </div>
    </>
  );
}

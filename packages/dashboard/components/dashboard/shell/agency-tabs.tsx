"use client";

import Link from "next/link";
import { cn } from "@lib/utils";
import { useSectionTabActive, sectionTabClass } from "./section-tab-active";

type AgencyTab = { label: string; href: string; index?: boolean };

// Agency section tabs (spec D5): flat horizontal row, scrolls on overflow.
const AGENCY_TABS: AgencyTab[] = [
  { label: "Clients", href: "/dashboard/agency", index: true },
  { label: "Reviews", href: "/dashboard/agency/reviews" },
  { label: "Handover", href: "/dashboard/agency/handover" },
  { label: "Library", href: "/dashboard/agency/library" },
  { label: "Shared theme", href: "/dashboard/agency/theme" },
  { label: "Partner", href: "/dashboard/agency/partner" },
];

function AgencyTabLink({ tab }: { tab: AgencyTab }) {
  const active = useSectionTabActive(tab.href, tab.index ? { index: true } : undefined);
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={cn(sectionTabClass.base, active ? sectionTabClass.active : sectionTabClass.inactive)}
    >
      {tab.label}
    </Link>
  );
}

export function AgencyTabs() {
  return (
    <nav aria-label="Agency sections" className="flex items-center gap-1 overflow-x-auto">
      {AGENCY_TABS.map((tab) => (
        <AgencyTabLink key={tab.href} tab={tab} />
      ))}
    </nav>
  );
}

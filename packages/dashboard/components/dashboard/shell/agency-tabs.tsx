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
  /* Partner is deliberately absent. The tab renders commission tiers
     (15/20/25%), "MRR influenced" and a "Get referral link" button — and
     `prisma.referral` has exactly one consumer in the repo, a `findMany` read
     at `partner.service.ts:31`. Nothing writes a `Referral` row; nothing reads
     the `?ref=` param the button hands out. It is a financial promise with no
     fulfilment path. The code stays; the door does not, until the commercial
     program exists (`partner.service.ts:22-23` says it does not yet). */
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

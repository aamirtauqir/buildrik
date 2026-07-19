"use client";

import Link from "next/link";
import { cn } from "@lib/utils";
import { useSectionTabActive, sectionTabClass } from "./section-tab-active";

type RailItem = { label: string; href: string; index?: boolean };

// Settings rail structure (spec D6): 4 labeled subgroups + isolated Danger.
const RAIL_GROUPS: { label: string; items: RailItem[] }[] = [
  {
    label: "Workspace",
    items: [
      { label: "Workspace", href: "/dashboard/settings/workspace" },
      { label: "Team", href: "/dashboard/settings/team" },
      { label: "Domains", href: "/dashboard/settings/domains" },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "Integrations", href: "/dashboard/settings/integrations" },
      { label: "AI & Credits", href: "/dashboard/settings/ai" },
      { label: "API tokens", href: "/dashboard/settings/api-tokens" },
    ],
  },
  {
    label: "Billing",
    items: [
      { label: "Plans", href: "/dashboard/settings/plans" },
      { label: "Billing", href: "/dashboard/settings/billing" },
      { label: "Usage", href: "/dashboard/settings/usage" },
    ],
  },
  {
    label: "Personal",
    items: [
      { label: "Account", href: "/dashboard/settings/account" },
      { label: "Profile", href: "/dashboard/settings/profile" },
      { label: "Security", href: "/dashboard/settings/security" },
      { label: "Notifications", href: "/dashboard/settings/notifications" },
    ],
  },
];

const DANGER: RailItem = { label: "Danger zone", href: "/dashboard/settings/danger" };

// Every destination the rail links to — asserted against the real route table
// by the settings-smoke contract test (spec test #9: no silent 404 from a move).
export const SETTINGS_RAIL_HREFS: string[] = [
  ...RAIL_GROUPS.flatMap((g) => g.items),
  DANGER,
].map((i) => i.href);

function RailLink({ item }: { item: RailItem }) {
  const active = useSectionTabActive(item.href, item.index ? { index: true } : undefined);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(sectionTabClass.base, active ? sectionTabClass.active : sectionTabClass.inactive)}
    >
      {item.label}
    </Link>
  );
}

/** Horizontal settings tab bar above the section content: the 4 labeled
 *  subgroups render inline as a wrapping row with their eyebrows as dividers,
 *  Danger isolated at the end. Same token classes + active rule as AgencyTabs
 *  (section-tab SSOT), so both sections navigate identically. */
export function SettingsRail() {
  return (
    <nav
      aria-label="Settings sections"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b pb-3"
      style={{ borderColor: "var(--color-border-default)" }}
    >
      {RAIL_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-wrap items-center gap-1">
          <span
            className="shrink-0 px-1 text-eyebrow font-semibold uppercase tracking-wide"
            style={{ color: "var(--color-text-muted)" }}
          >
            {group.label}
          </span>
          <ul className="flex flex-wrap items-center gap-1">
            {group.items.map((item) => (
              <li key={item.href} className="shrink-0">
                <RailLink item={item} />
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div
        className="flex shrink-0 items-center border-l pl-3"
        style={{ borderColor: "var(--color-border-default)" }}
      >
        <RailLink item={DANGER} />
      </div>
    </nav>
  );
}

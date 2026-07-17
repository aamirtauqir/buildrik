"use client";

import Link from "next/link";
import { Plus, UserPlus, LayoutTemplate } from "lucide-react";

// Fixed destinations, reusing the hrefs the dynamic quick-action list already
// pointed at (create-site flow, team invite, template start). Left-aligned with
// a leading icon per the IA-fixed design.
const ACTIONS = [
  { label: "Create a site", href: "/dashboard/sites/new", variant: "primary" as const, icon: Plus },
  { label: "Invite teammate", href: "/dashboard/settings/team", variant: "outline" as const, icon: UserPlus },
  { label: "Browse templates", href: "/dashboard/sites/new?method=template", variant: "outline" as const, icon: LayoutTemplate },
];

export function QuickActions() {
  return (
    <div className="flex flex-col gap-[9px]">
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return action.variant === "primary" ? (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-[9px] rounded-[9px] bg-[var(--color-primary)] px-[14px] py-[11px] text-[13.5px] font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
          >
            <Icon className="h-4 w-4" strokeWidth={2} /> {action.label}
          </Link>
        ) : (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-[9px] rounded-[9px] border px-[14px] py-[11px] text-[13.5px] font-semibold transition-colors hover:border-[var(--color-primary)]"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
          >
            <Icon className="h-4 w-4" strokeWidth={2} /> {action.label}
          </Link>
        );
      })}
    </div>
  );
}

"use client";

import Link from "next/link";

// Fixed destinations, reusing the hrefs the dynamic quick-action list already
// pointed at (create-site flow, team invite, template start).
const ACTIONS = [
  { label: "Create a site", href: "/dashboard/sites/new", variant: "primary" as const },
  { label: "Invite teammate", href: "/dashboard/team", variant: "outline" as const },
  { label: "Browse templates", href: "/dashboard/sites/new?method=template", variant: "outline" as const },
];

export function QuickActions() {
  return (
    <div className="flex flex-col gap-2">
      {ACTIONS.map((action) =>
        action.variant === "primary" ? (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-body font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)]"
          >
            {action.label}
          </Link>
        ) : (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center justify-center rounded-lg border px-4 py-2.5 text-body font-medium transition-colors hover:border-[var(--color-primary)]"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
          >
            {action.label}
          </Link>
        )
      )}
    </div>
  );
}

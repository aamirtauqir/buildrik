"use client";

import Link from "next/link";

type CTA = {
  label: string;
  href: string;
};

type EmptyStateConfig = {
  heading: string;
  description: string;
  ctas: CTA[];
};

export const EMPTY_STATE_CONFIGS: Record<string, EmptyStateConfig> = {
  owner_new: {
    heading: "Welcome to Buildrik",
    description: "You're all set. Start by creating your first site.",
    ctas: [
      { label: "Create a site", href: "/dashboard/sites/new" },
      { label: "Invite teammates", href: "/dashboard/settings/team" },
      { label: "Browse templates", href: "/dashboard/templates" },
    ],
  },
  owner_empty: {
    heading: "Your workspace is empty",
    description: "No sites yet. Create one to get started.",
    ctas: [
      { label: "Create a site", href: "/dashboard/sites/new" },
      { label: "Import a site", href: "/dashboard/sites/import" },
      { label: "Browse templates", href: "/dashboard/templates" },
    ],
  },
  editor: {
    heading: "No sites assigned",
    description: "You haven't been assigned to any sites yet.",
    ctas: [{ label: "View Team", href: "/dashboard/settings/team" }],
  },
  viewer: {
    heading: "No published sites",
    description: "There are no published sites to view right now.",
    ctas: [],
  },
};

type EmptyStateProps = {
  variant: keyof typeof EMPTY_STATE_CONFIGS;
};

export function EmptyState({ variant }: EmptyStateProps) {
  const config = EMPTY_STATE_CONFIGS[variant];

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E8E8E8] bg-[#F4F4F4] px-8 py-16 text-center">
      <h2 className="text-xl font-semibold text-[#0D0D0D]">{config.heading}</h2>
      <p className="mt-2 text-sm text-[#7A7A7A]">{config.description}</p>
      {config.ctas.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {config.ctas.map((cta, i) => (
            <Link
              key={cta.href}
              href={cta.href}
              className={
                i === 0
                  ? "rounded-lg bg-[#E42313] px-4 py-2 text-sm font-medium text-white hover:bg-[#c91e0f]"
                  : "rounded-lg border border-[#E8E8E8] bg-white px-4 py-2 text-sm font-medium text-[#0D0D0D] hover:bg-[#F4F4F4]"
              }
            >
              {cta.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

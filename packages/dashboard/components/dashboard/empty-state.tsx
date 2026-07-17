"use client";

import Link from "next/link";
import { Sparkles, LayoutTemplate, FileText, Users, Eye } from "lucide-react";

type CTA = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

type EmptyStateConfig = {
  icon: React.ReactNode;
  heading: string;
  description: string;
  ctas: CTA[];
  showVideoArea?: boolean;
};

const ICON_CLASS = "h-10 w-10 text-[var(--color-text-secondary)]";

function getConfig(variant: EmptyStateVariant): EmptyStateConfig {
  switch (variant) {
    case "owner_new":
      return {
        icon: <Sparkles className={ICON_CLASS} />,
        heading: "Welcome to Buildrick!",
        description: "Build your first site in under 5 minutes.",
        showVideoArea: true,
        ctas: [
          { label: "AI Generate", href: "/dashboard/sites/new?method=ai", icon: <Sparkles className="h-4 w-4" /> },
          { label: "Use Template", href: "/dashboard/sites/new?method=template", icon: <LayoutTemplate className="h-4 w-4" /> },
          { label: "Start Blank", href: "/dashboard/sites/new", icon: <FileText className="h-4 w-4" /> },
        ],
      };
    case "owner_empty":
      return {
        icon: <FileText className={ICON_CLASS} />,
        heading: "Your workspace is empty",
        description: "Ready for something new?",
        ctas: [
          { label: "AI Generate", href: "/dashboard/sites/new?method=ai", icon: <Sparkles className="h-4 w-4" /> },
          { label: "Use Template", href: "/dashboard/sites/new?method=template", icon: <LayoutTemplate className="h-4 w-4" /> },
          { label: "Start Blank", href: "/dashboard/sites/new", icon: <FileText className="h-4 w-4" /> },
        ],
      };
    case "editor_no_sites":
      return {
        icon: <Users className={ICON_CLASS} />,
        heading: "No sites assigned",
        description: "You haven't been assigned to any sites yet. Ask your workspace admin to give you access.",
        ctas: [
          { label: "View Team \u2192", href: "/dashboard/settings/team" },
        ],
      };
    case "viewer":
      return {
        icon: <Eye className={ICON_CLASS} />,
        heading: "No published sites to view yet",
        description: "Your team is still building!",
        ctas: [],
      };
  }
}

export type EmptyStateVariant = "owner_new" | "owner_empty" | "editor_no_sites" | "viewer";

export const EMPTY_STATE_CONFIGS: Record<string, EmptyStateConfig> = {
  owner_new: getConfig("owner_new"),
  owner_empty: getConfig("owner_empty"),
  editor: getConfig("editor_no_sites"),
  viewer: getConfig("viewer"),
};

type EmptyStateProps = {
  variant: EmptyStateVariant;
};

export function EmptyState({ variant }: EmptyStateProps) {
  const config = getConfig(variant);

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] px-8 py-16 text-center">
      <div className="mb-4">{config.icon}</div>
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{config.heading}</h2>
      <p className="mt-2 max-w-md text-sm text-[var(--color-text-secondary)]">{config.description}</p>

      {config.showVideoArea && (
        <div className="mt-6 h-40 w-72 rounded-lg border border-dashed border-[var(--color-border-default)] bg-white" />
      )}

      {config.ctas.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {config.ctas.map((cta, i) => (
            <Link
              key={cta.href}
              href={cta.href}
              className={
                i === 0
                  ? "flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
                  : "flex items-center gap-2 rounded-lg border border-[var(--color-border-default)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)]"
              }
            >
              {cta.icon}
              {cta.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

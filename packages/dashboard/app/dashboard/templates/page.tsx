"use client";

import { useState } from "react";
import Link from "next/link";
import { Library, Globe } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { StateEmpty, LoadingSkeleton, ErrorState } from "@/components/states";
import { PageHeader, FilterTabs } from "@/components/dashboard/primitives";

const TABS = [
  { value: "templates", label: "Templates" },
  { value: "libraries", label: "Libraries" },
] as const;

type Tab = (typeof TABS)[number]["value"];

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

// Mirrors the create-flow gallery's card (components/templates/template-card.tsx)
// so a template reads the same in both places.
const DIFFICULTY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  BEGINNER: { bg: "#DCFCE7", text: "#166534", label: "Beginner" },
  INTERMEDIATE: { bg: "#DBEAFE", text: "#1E40AF", label: "Intermediate" },
  ADVANCED: { bg: "#FEF3C7", text: "#92400E", label: "Advanced" },
};

/** The Templates tab used to render four hardcoded cards (SaaS Landing, Portfolio
 *  Grid…) that matched no real template, under a permanently-disabled "Coming
 *  soon" button. The real templates and the apply flow already exist at
 *  /dashboard/sites/new?method=template; this tab now reads the same list and
 *  links each card straight into that flow, so the nav destination is real
 *  rather than a decorative dead end. The Libraries tab is unchanged. */
function TemplatesTab() {
  const templates = trpc.templates.list.useQuery(
    { category: "ALL", page: 1, perPage: 20, sort: "popular" },
    { staleTime: 60_000 }
  );

  if (templates.isLoading) return <LoadingSkeleton rows={2} variant="card" />;
  if (templates.isError) {
    return (
      <ErrorState
        title="Couldn't load templates"
        description="Something went wrong on our end. Refresh to try again."
        onRetry={() => templates.refetch()}
      />
    );
  }

  const items = templates.data?.data ?? [];
  if (items.length === 0) {
    return (
      <StateEmpty
        title="No templates yet"
        description="Starter templates will appear here once they're published."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
      {items.map((t) => {
        const diff = DIFFICULTY_STYLES[t.difficulty] ?? DIFFICULTY_STYLES.BEGINNER;
        return (
          <Link
            key={t.id}
            href="/dashboard/sites/new?method=template"
            className="group overflow-hidden rounded-xl border shadow-card transition-shadow hover:shadow-md"
            style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
          >
            <div className="flex h-[196px] items-center justify-center" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
              <Globe className="h-10 w-10" style={{ color: "var(--color-text-muted)" }} />
            </div>
            <div className="px-3.5 py-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-[13.5px] font-semibold" style={{ color: "var(--color-text-primary)" }}>{t.name}</h2>
                <span className="shrink-0 text-body-sm font-semibold opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--color-primary)" }}>
                  Use →
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: "var(--color-bg-subtle)", color: "var(--color-text-secondary)" }}>
                  {t.category.toLowerCase()}
                </span>
                <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: diff.bg, color: diff.text }}>
                  {diff.label}
                </span>
                <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{formatCount(t.usageCount)} sites</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function LibrariesPage() {
  const [tab, setTab] = useState<Tab>("templates");

  return (
    <div>
      <PageHeader title="Libraries & Templates" description="Reusable starting points and shared design systems." />

      <div className="mb-5">
        <FilterTabs value={tab} onChange={setTab} options={TABS} />
      </div>

      {tab === "templates" ? (
        <TemplatesTab />
      ) : (
        <StateEmpty
          icon={<Library className="h-7 w-7" />}
          title="No shared libraries yet"
          description="Capture a site's colors, type and components as a shared design system to reuse across every Buildrick site in this workspace."
        />
      )}
    </div>
  );
}

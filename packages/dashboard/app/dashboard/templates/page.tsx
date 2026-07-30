"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { cn, coverFromSeed } from "@lib/utils";
import { LoadingSkeleton, ErrorState, StateEmpty } from "@/components/states";
import { TemplateFilterRail } from "@/components/templates/template-filter-rail";
import { paginationRange } from "@/components/templates/pagination-range";
import {
  type TemplateFilters,
  templateFiltersFromParams,
  templateFiltersToQuery,
} from "./filters";

const PER_PAGE = 12;

const DIFFICULTY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  BEGINNER: { bg: "#DEF7EC", text: "#166534", label: "Beginner" },
  INTERMEDIATE: { bg: "#DBEAFE", text: "#1E40AF", label: "Intermediate" },
  ADVANCED: { bg: "#FDFDEA", text: "#92400E", label: "Advanced" },
};

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export default function TemplatesBrowserPage() {
  return (
    <Suspense fallback={null}>
      <TemplatesBrowserInner />
    </Suspense>
  );
}

function TemplatesBrowserInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo<TemplateFilters>(
    () => templateFiltersFromParams(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  function applyFilters(patch: Partial<TemplateFilters>) {
    const next = { ...filters, ...patch };
    router.replace(pathname + templateFiltersToQuery(next), { scroll: false });
  }

  const list = trpc.templates.list.useQuery(
    {
      category: filters.category as "ALL" | "PORTFOLIO" | "BUSINESS" | "BLOG" | "AGENCY" | "ECOMMERCE" | "RESTAURANT",
      difficulty: filters.difficulty as "ALL" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
      sort: filters.sort as "popular" | "newest" | "alphabetical",
      search: filters.search || undefined,
      page: filters.page,
      perPage: PER_PAGE,
    },
    { staleTime: 30_000 }
  );

  const items = list.data?.data ?? [];
  const totalPages = list.data?.totalPages ?? 0;
  const pages = paginationRange(filters.page, totalPages);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-6">
      {/* Top row — this is an ecosystem tab (like Marketplace); the topbar's
          "Dashboard" link is the way back to the workspace, so no in-page back. */}
      <div className="mb-5 flex items-center gap-4">
        <h1 className="text-[19px] font-[680] tracking-tight" style={{ color: "var(--color-text-primary)" }}>
          Templates
        </h1>
        <div className="ml-auto flex h-9 w-[280px] items-center gap-2 rounded-lg border px-3"
          style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}>
          <Search className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
          <input
            value={filters.search}
            onChange={(e) => applyFilters({ search: e.target.value, page: 1 })}
            placeholder="Search templates…"
            className="w-full bg-transparent text-[13px] outline-none"
            style={{ color: "var(--color-text-primary)" }}
          />
        </div>
      </div>

      <div className="flex gap-8">
        <TemplateFilterRail filters={filters} onChange={applyFilters} />

        <div className="flex-1">
          {list.isLoading ? (
            <LoadingSkeleton rows={3} variant="card" />
          ) : list.isError ? (
            <ErrorState
              title="Couldn't load templates"
              description="Something went wrong on our end. Refresh to try again."
              onRetry={() => list.refetch()}
            />
          ) : items.length === 0 ? (
            <StateEmpty
              title="No templates match these filters"
              description="Try clearing a filter or searching for something else."
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((t) => {
                  const diff = DIFFICULTY_STYLES[t.difficulty] ?? DIFFICULTY_STYLES.BEGINNER;
                  const cover = coverFromSeed(t.id);
                  return (
                    <Link
                      key={t.id}
                      href={`/dashboard/templates/${t.id}`}
                      className="group overflow-hidden rounded-xl border shadow-card transition-shadow hover:shadow-md"
                      style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
                    >
                      {/* Deterministic tinted cover with the template initial so the
                          gallery isn't a wall of identical grey globes (audit B1). */}
                      <div className="flex h-[172px] items-center justify-center" style={{ backgroundColor: cover.bg }}>
                        <span className="text-[42px] font-bold leading-none" style={{ color: cover.fg }}>
                          {t.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="px-3.5 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <h2 className="truncate text-[13.5px] font-semibold" style={{ color: "var(--color-text-primary)" }}>{t.name}</h2>
                          <span className="shrink-0 text-body-sm font-semibold opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--color-primary)" }}>
                            View →
                          </span>
                        </div>
                        {/* Two fixed rows (pills, then usage) so a wider difficulty
                            pill can't shove the count onto a second line and make
                            cards different heights (audit T2). */}
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: "var(--color-bg-subtle)", color: "var(--color-text-secondary)" }}>
                            {t.category.toLowerCase()}
                          </span>
                          <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: diff.bg, color: diff.text }}>
                            {diff.label}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[11px]" style={{ color: "var(--color-text-muted)" }}>{formatCount(t.usageCount)} {t.usageCount === 1 ? "site" : "sites"}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-1">
                  {pages.map((p, i) =>
                    p === "…" ? (
                      <span key={`gap-${i}`} className="px-2 text-[13px]" style={{ color: "var(--color-text-muted)" }}>…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => applyFilters({ page: p })}
                        className={cn(
                          "min-w-8 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                          p === filters.page ? "bg-[var(--color-primary)] text-white" : "hover:bg-[var(--color-bg-subtle)]"
                        )}
                        style={p === filters.page ? undefined : { color: "var(--color-text-secondary)" }}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

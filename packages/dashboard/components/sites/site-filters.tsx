"use client";
import { ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@lib/utils";
import { trpc } from "@lib/trpc/client";
import { FilterChip as ChipButton, MetricValue } from "@/components/dashboard/primitives";

export const SORT_OPTIONS = [
  { value: "lastEdited", label: "Last edited" },
  { value: "name", label: "Name" },
  { value: "created", label: "Created date" },
  { value: "traffic", label: "Traffic" },
  { value: "pages", label: "Pages count" },
  { value: "published", label: "Last published" },
] as const;

export const STATUS_FILTER_OPTIONS = [
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Draft" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

const DATE_RANGE_OPTIONS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
] as const;

const TRAFFIC_OPTIONS = [
  { value: "none", label: "None" },
  { value: "1-100", label: "1-100" },
  { value: "100-1000", label: "100-1K" },
  { value: "1000+", label: "1K+" },
] as const;

interface SiteFiltersProps {
  status: string | undefined;
  onStatusChange: (v: string | undefined) => void;
  sort: string;
  onSortChange: (v: string) => void;
  createdBy: string | undefined;
  onCreatedByChange: (v: string | undefined) => void;
  dateRange: "7d" | "30d" | "90d" | undefined;
  onDateRangeChange: (v: "7d" | "30d" | "90d" | undefined) => void;
  templateUsed: string | undefined;
  onTemplateUsedChange: (v: string | undefined) => void;
  hasCustomDomain: boolean | undefined;
  onHasCustomDomainChange: (v: boolean | undefined) => void;
  hasTraffic: "none" | "1-100" | "100-1000" | "1000+" | undefined;
  onHasTrafficChange: (v: "none" | "1-100" | "100-1000" | "1000+" | undefined) => void;
  archivedCount?: number;
  /** Rendered at the head of the filter row. The search box used to sit on its
   *  own row above this one, which gave Sites four stacked control rows before
   *  any content (header actions, folder cards, search, filters). One strip. */
  search?: ReactNode;
}


export function SiteFilters({
  status, onStatusChange,
  sort, onSortChange,
  createdBy, onCreatedByChange,
  dateRange, onDateRangeChange,
  templateUsed, onTemplateUsedChange,
  hasCustomDomain, onHasCustomDomainChange,
  hasTraffic, onHasTrafficChange,
  archivedCount,
  search,
}: SiteFiltersProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [createdByOpen, setCreatedByOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);

  const teamQuery = trpc.team.list.useQuery({ page: 1, perPage: 50 }, { enabled: advancedOpen });
  const templatesQuery = trpc.templates.list.useQuery({ category: "ALL" }, { enabled: advancedOpen });

  const members = teamQuery.data?.data ?? [];
  const templates = templatesQuery.data?.data ?? [];

  const hasAdvancedFilters = createdBy || dateRange || templateUsed || hasCustomDomain !== undefined || hasTraffic;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {search}
        {/* Status chips */}
        <div className="flex gap-1.5">
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <ChipButton key={opt.value} active={status === opt.value} onClick={() => onStatusChange(status === opt.value ? undefined : opt.value)}>
              {opt.value === "ARCHIVED" && archivedCount !== undefined ? (
                <>{opt.label} · <MetricValue>{archivedCount}</MetricValue></>
              ) : (
                opt.label
              )}
            </ChipButton>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Sort dropdown */}
          <div className="relative">
            <button onClick={() => setSortOpen(!sortOpen)} className="flex items-center gap-1 rounded-pill border px-3 py-1 text-body-sm font-medium transition-colors" style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)", backgroundColor: "var(--color-bg-surface)" }}>
              {SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Sort"}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-lg border bg-white py-1 shadow-card" style={{ borderColor: "var(--color-border-default)" }}>
                {SORT_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => { onSortChange(opt.value); setSortOpen(false); }} className="block w-full px-3 py-1.5 text-left text-body-sm hover:bg-[var(--color-bg-subtle)]" style={{ color: sort === opt.value ? "var(--color-primary)" : "var(--color-text-primary)" }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Advanced filters toggle */}
          <button
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="flex items-center gap-1 rounded-pill border px-3 py-1 text-body-sm font-medium transition-colors"
            style={hasAdvancedFilters
              ? { borderColor: "var(--color-primary)", color: "var(--color-primary)", backgroundColor: "var(--color-primary-subtle)" }
              : { borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)", backgroundColor: "var(--color-bg-surface)" }}
          >
            Filters
            {advancedOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Advanced filters row */}
      {advancedOpen && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3" style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-subtle)" }}>
          {/* Created by dropdown */}
          <div className="relative">
            <button onClick={() => setCreatedByOpen(!createdByOpen)} className="flex items-center gap-1 rounded-md border bg-white px-3 py-1.5 text-body-sm font-medium" style={{ borderColor: "var(--color-border-default)", color: createdBy ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}>
              {createdBy ? members.find((m: { userId: string; fullName: string; email: string }) => m.userId === createdBy)?.fullName ?? "Member" : "Created by"}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {createdByOpen && (
              <div className="absolute left-0 top-full z-10 mt-1 w-48 rounded-lg border bg-white py-1 shadow-card" style={{ borderColor: "var(--color-border-default)" }}>
                <button onClick={() => { onCreatedByChange(undefined); setCreatedByOpen(false); }} className="block w-full px-3 py-1.5 text-left text-body-sm hover:bg-[var(--color-bg-subtle)]" style={{ color: !createdBy ? "var(--color-primary)" : "var(--color-text-primary)" }}>
                  All members
                </button>
                {members.map((m: { userId: string; fullName: string; email: string }) => (
                  <button key={m.userId} onClick={() => { onCreatedByChange(m.userId); setCreatedByOpen(false); }} className="block w-full truncate px-3 py-1.5 text-left text-body-sm hover:bg-[var(--color-bg-subtle)]" style={{ color: createdBy === m.userId ? "var(--color-primary)" : "var(--color-text-primary)" }}>
                    {m.fullName || m.email}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date range chips */}
          <div className="flex gap-1.5">
            {DATE_RANGE_OPTIONS.map((opt) => (
              <ChipButton key={opt.value} active={dateRange === opt.value} onClick={() => onDateRangeChange(dateRange === opt.value ? undefined : opt.value)}>
                {opt.label}
              </ChipButton>
            ))}
          </div>

          {/* Template dropdown */}
          <div className="relative">
            <button onClick={() => setTemplateOpen(!templateOpen)} className="flex items-center gap-1 rounded-md border bg-white px-3 py-1.5 text-body-sm font-medium" style={{ borderColor: "var(--color-border-default)", color: templateUsed ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}>
              {templateUsed ? templates.find((t: { id: string; name: string }) => t.id === templateUsed)?.name ?? "Template" : "Template"}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {templateOpen && (
              <div className="absolute left-0 top-full z-10 mt-1 w-48 rounded-lg border bg-white py-1 shadow-card" style={{ borderColor: "var(--color-border-default)" }}>
                <button onClick={() => { onTemplateUsedChange(undefined); setTemplateOpen(false); }} className="block w-full px-3 py-1.5 text-left text-body-sm hover:bg-[var(--color-bg-subtle)]" style={{ color: !templateUsed ? "var(--color-primary)" : "var(--color-text-primary)" }}>
                  All templates
                </button>
                {templates.map((t: { id: string; name: string }) => (
                  <button key={t.id} onClick={() => { onTemplateUsedChange(t.id); setTemplateOpen(false); }} className="block w-full truncate px-3 py-1.5 text-left text-body-sm hover:bg-[var(--color-bg-subtle)]" style={{ color: templateUsed === t.id ? "var(--color-primary)" : "var(--color-text-primary)" }}>
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Has custom domain toggle */}
          <button
            onClick={() => {
              if (hasCustomDomain === undefined) onHasCustomDomainChange(true);
              else if (hasCustomDomain === true) onHasCustomDomainChange(false);
              else onHasCustomDomainChange(undefined);
            }}
            className="flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-body-sm font-medium"
            style={{ borderColor: hasCustomDomain !== undefined ? "var(--color-primary)" : "var(--color-border-default)", color: hasCustomDomain !== undefined ? "var(--color-primary)" : "var(--color-text-secondary)" }}
          >
            {hasCustomDomain !== undefined ? (
              <ToggleRight className="h-4 w-4" style={{ color: hasCustomDomain ? "var(--color-success)" : "var(--color-primary)" }} />
            ) : (
              <ToggleLeft className="h-4 w-4" />
            )}
            {hasCustomDomain === true ? "Has domain" : hasCustomDomain === false ? "No domain" : "Custom domain"}
          </button>

          {/* Traffic chips */}
          <div className="flex gap-1.5">
            {TRAFFIC_OPTIONS.map((opt) => (
              <ChipButton key={opt.value} active={hasTraffic === opt.value} onClick={() => onHasTrafficChange(hasTraffic === opt.value ? undefined : opt.value)}>
                {opt.label}
              </ChipButton>
            ))}
          </div>

          {/* Clear all */}
          {hasAdvancedFilters && (
            <button
              onClick={() => {
                onCreatedByChange(undefined);
                onDateRangeChange(undefined);
                onTemplateUsedChange(undefined);
                onHasCustomDomainChange(undefined);
                onHasTrafficChange(undefined);
              }}
              className="text-body-sm font-medium underline"
              style={{ color: "var(--color-primary)" }}
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}

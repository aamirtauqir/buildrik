"use client";
import { Search, ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@lib/utils";
import { trpc } from "@lib/trpc/client";

export const SORT_OPTIONS = [
  { value: "lastEdited", label: "Last edited" },
  { value: "name", label: "Name" },
  { value: "created", label: "Created date" },
  { value: "traffic", label: "Traffic" },
  { value: "pages", label: "Pages count" },
  { value: "published", label: "Last published" },
] as const;

export const STATUS_FILTER_OPTIONS = [
  { value: "PUBLISHED", label: "Published", color: "#22C55E" },
  { value: "DRAFT", label: "Draft", color: "#EAB308" },
  { value: "ARCHIVED", label: "Archived", color: "#EA580C" },
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
  search: string;
  onSearchChange: (v: string) => void;
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
}

export function SiteFilters({
  search, onSearchChange,
  status, onStatusChange,
  sort, onSortChange,
  createdBy, onCreatedByChange,
  dateRange, onDateRangeChange,
  templateUsed, onTemplateUsedChange,
  hasCustomDomain, onHasCustomDomainChange,
  hasTraffic, onHasTrafficChange,
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
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "#B0B0B0" }} />
          <input type="text" value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search sites..." className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm" style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }} />
        </div>
        {/* Status chips */}
        <div className="flex gap-1">
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => onStatusChange(status === opt.value ? undefined : opt.value)} className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors", status === opt.value ? "text-white" : "border")} style={status === opt.value ? { backgroundColor: opt.color } : { borderColor: "#E8E8E8", color: "#7A7A7A" }}>
              {opt.label}
            </button>
          ))}
        </div>
        {/* Sort dropdown */}
        <div className="relative">
          <button onClick={() => setSortOpen(!sortOpen)} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium" style={{ borderColor: "#E8E8E8", color: "#7A7A7A" }}>
            {SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Sort"}
            <ChevronDown className="h-3 w-3" />
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-lg border bg-white py-1 shadow-lg" style={{ borderColor: "#E8E8E8" }}>
              {SORT_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => { onSortChange(opt.value); setSortOpen(false); }} className="block w-full px-3 py-1.5 text-left text-xs hover:bg-[#F4F4F4]" style={{ color: sort === opt.value ? "var(--color-primary)" : "#0D0D0D" }}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Advanced filters toggle */}
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className={cn("flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors", hasAdvancedFilters && "border-[var(--color-primary)] text-[var(--color-primary)]")}
          style={hasAdvancedFilters ? undefined : { borderColor: "#E8E8E8", color: "#7A7A7A" }}
        >
          Filters
          {advancedOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Advanced filters row */}
      {advancedOpen && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3" style={{ borderColor: "#E8E8E8", backgroundColor: "#FAFAFA" }}>
          {/* Created by dropdown */}
          <div className="relative">
            <button onClick={() => setCreatedByOpen(!createdByOpen)} className="flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium" style={{ borderColor: "#E8E8E8", color: createdBy ? "#0D0D0D" : "#7A7A7A" }}>
              {createdBy ? members.find((m: { userId: string; fullName: string; email: string }) => m.userId === createdBy)?.fullName ?? "Member" : "Created by"}
              <ChevronDown className="h-3 w-3" />
            </button>
            {createdByOpen && (
              <div className="absolute left-0 top-full z-10 mt-1 w-48 rounded-lg border bg-white py-1 shadow-lg" style={{ borderColor: "#E8E8E8" }}>
                <button onClick={() => { onCreatedByChange(undefined); setCreatedByOpen(false); }} className="block w-full px-3 py-1.5 text-left text-xs hover:bg-[#F4F4F4]" style={{ color: !createdBy ? "var(--color-primary)" : "#0D0D0D" }}>
                  All members
                </button>
                {members.map((m: { userId: string; fullName: string; email: string }) => (
                  <button key={m.userId} onClick={() => { onCreatedByChange(m.userId); setCreatedByOpen(false); }} className="block w-full truncate px-3 py-1.5 text-left text-xs hover:bg-[#F4F4F4]" style={{ color: createdBy === m.userId ? "var(--color-primary)" : "#0D0D0D" }}>
                    {m.fullName || m.email}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date range chips */}
          <div className="flex gap-1">
            {DATE_RANGE_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => onDateRangeChange(dateRange === opt.value ? undefined : opt.value)} className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors", dateRange === opt.value ? "bg-[#0D0D0D] text-white" : "border bg-white")} style={dateRange === opt.value ? undefined : { borderColor: "#E8E8E8", color: "#7A7A7A" }}>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Template dropdown */}
          <div className="relative">
            <button onClick={() => setTemplateOpen(!templateOpen)} className="flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium" style={{ borderColor: "#E8E8E8", color: templateUsed ? "#0D0D0D" : "#7A7A7A" }}>
              {templateUsed ? templates.find((t: { id: string; name: string }) => t.id === templateUsed)?.name ?? "Template" : "Template"}
              <ChevronDown className="h-3 w-3" />
            </button>
            {templateOpen && (
              <div className="absolute left-0 top-full z-10 mt-1 w-48 rounded-lg border bg-white py-1 shadow-lg" style={{ borderColor: "#E8E8E8" }}>
                <button onClick={() => { onTemplateUsedChange(undefined); setTemplateOpen(false); }} className="block w-full px-3 py-1.5 text-left text-xs hover:bg-[#F4F4F4]" style={{ color: !templateUsed ? "var(--color-primary)" : "#0D0D0D" }}>
                  All templates
                </button>
                {templates.map((t: { id: string; name: string }) => (
                  <button key={t.id} onClick={() => { onTemplateUsedChange(t.id); setTemplateOpen(false); }} className="block w-full truncate px-3 py-1.5 text-left text-xs hover:bg-[#F4F4F4]" style={{ color: templateUsed === t.id ? "var(--color-primary)" : "#0D0D0D" }}>
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
            className="flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium"
            style={{ borderColor: hasCustomDomain !== undefined ? "#0D0D0D" : "#E8E8E8", color: hasCustomDomain !== undefined ? "#0D0D0D" : "#7A7A7A" }}
          >
            {hasCustomDomain !== undefined ? (
              <ToggleRight className="h-4 w-4" style={{ color: hasCustomDomain ? "#22C55E" : "var(--color-primary)" }} />
            ) : (
              <ToggleLeft className="h-4 w-4" />
            )}
            {hasCustomDomain === true ? "Has domain" : hasCustomDomain === false ? "No domain" : "Custom domain"}
          </button>

          {/* Traffic chips */}
          <div className="flex gap-1">
            {TRAFFIC_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => onHasTrafficChange(hasTraffic === opt.value ? undefined : opt.value)} className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors", hasTraffic === opt.value ? "bg-[#0D0D0D] text-white" : "border bg-white")} style={hasTraffic === opt.value ? undefined : { borderColor: "#E8E8E8", color: "#7A7A7A" }}>
                {opt.label}
              </button>
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
              className="text-xs font-medium underline"
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

"use client";
import { Search, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

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

interface SiteFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  status: string | undefined;
  onStatusChange: (v: string | undefined) => void;
  sort: string;
  onSortChange: (v: string) => void;
}

export function SiteFilters({ search, onSearchChange, status, onStatusChange, sort, onSortChange }: SiteFiltersProps) {
  const [sortOpen, setSortOpen] = useState(false);
  return (
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
              <button key={opt.value} onClick={() => { onSortChange(opt.value); setSortOpen(false); }} className="block w-full px-3 py-1.5 text-left text-xs hover:bg-[#F4F4F4]" style={{ color: sort === opt.value ? "#E42313" : "#0D0D0D" }}>
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

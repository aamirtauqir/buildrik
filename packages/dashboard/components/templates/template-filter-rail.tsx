"use client";

import { cn } from "@lib/utils";
import {
  type TemplateFilters,
  TEMPLATE_CATEGORY_OPTIONS,
  TEMPLATE_DIFFICULTY_OPTIONS,
  TEMPLATE_SORT_OPTIONS,
} from "@/app/dashboard/templates/filters";

type Props = {
  filters: TemplateFilters;
  onChange: (patch: Partial<TemplateFilters>) => void;
};

function Section({
  title,
  options,
  active,
  onPick,
}: {
  title: string;
  options: readonly { value: string; label: string }[];
  active: string;
  onPick: (value: string) => void;
}) {
  return (
    <div className="mb-6">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.11em]" style={{ color: "var(--color-text-muted)" }}>
        {title}
      </p>
      <div className="flex flex-col gap-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onPick(o.value)}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-left text-[13px] font-medium transition-colors",
              active === o.value ? "bg-[var(--color-primary-subtle)]" : "hover:bg-[var(--color-bg-subtle)]"
            )}
            style={{ color: active === o.value ? "var(--color-primary)" : "var(--color-text-secondary)" }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TemplateFilterRail({ filters, onChange }: Props) {
  return (
    <aside className="w-[220px] shrink-0">
      <Section
        title="Category"
        options={TEMPLATE_CATEGORY_OPTIONS}
        active={filters.category}
        onPick={(value) => onChange({ category: value, page: 1 })}
      />
      <Section
        title="Difficulty"
        options={TEMPLATE_DIFFICULTY_OPTIONS}
        active={filters.difficulty}
        onPick={(value) => onChange({ difficulty: value, page: 1 })}
      />
      <Section
        title="Sort by"
        options={TEMPLATE_SORT_OPTIONS}
        active={filters.sort}
        onPick={(value) => onChange({ sort: value, page: 1 })}
      />
    </aside>
  );
}

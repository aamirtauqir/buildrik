"use client";

import { cn } from "@lib/utils";
import { Check } from "lucide-react";

interface OnbCardProps {
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  /** Optional pill shown top-right (e.g. "Recommended"). */
  badge?: string;
}

/** Single-select onboarding card (S2 org-type, S3 path chooser). Sits in a flex
 *  row and grows to fill it. Selected = 2px primary ring + tint fill + check;
 *  unselected shows no check affordance at all. Rings are inset shadows so the
 *  1px→2px swap on select doesn't shift the row. */
export function OnbCard({ title, description, selected, onSelect, badge }: OnbCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "relative flex flex-1 flex-col gap-2 rounded-onb p-5 text-left transition-colors",
        selected
          ? "bg-onb-primary-tint shadow-[inset_0_0_0_2px_var(--color-onb-primary)]"
          : "bg-white shadow-[inset_0_0_0_1px_var(--color-onb-line)] hover:shadow-[inset_0_0_0_1px_var(--color-onb-subtle)]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-bold text-onb-text">{title}</span>
        {selected ? (
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-onb-primary text-white">
            <Check className="h-[9px] w-[9px]" strokeWidth={3} />
          </span>
        ) : null}
      </div>
      <span className="text-[12.5px] leading-[1.45] text-onb-muted">{description}</span>
      {badge ? (
        <span className="absolute -top-2 right-3 rounded-full bg-onb-primary px-2 py-0.5 text-[10px] font-semibold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

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

/** Single-select onboarding card (S2 org-type, and any radio-card list). Selected
 *  state = primary border + tint fill + check, per spec §3/§5. */
export function OnbCard({ title, description, selected, onSelect, badge }: OnbCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "relative w-full text-left rounded-onb border p-4 transition-colors",
        selected
          ? "border-onb-primary bg-onb-primary-tint"
          : "border-onb-line bg-white hover:border-onb-subtle"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-onb-ink">{title}</p>
          <p className="mt-0.5 text-xs text-onb-muted leading-relaxed">{description}</p>
        </div>
        <span
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
            selected ? "border-onb-primary bg-onb-primary text-white" : "border-onb-line"
          )}
        >
          {selected ? <Check className="h-3 w-3" /> : null}
        </span>
      </div>
      {badge ? (
        <span className="absolute -top-2 right-3 rounded-full bg-onb-primary px-2 py-0.5 text-[10px] font-semibold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

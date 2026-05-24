"use client";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@lib/utils";

export const VIEW_MODES = [
  { value: "grid", icon: "LayoutGrid", label: "Grid view" },
  { value: "list", icon: "List", label: "List view" },
] as const;

const iconMap = { LayoutGrid, List } as const;

export function ViewToggle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex rounded-lg border" style={{ borderColor: "var(--color-border-default)" }}>
      {VIEW_MODES.map((mode) => {
        const Icon = iconMap[mode.icon as keyof typeof iconMap];
        return (
          <button key={mode.value} onClick={() => onChange(mode.value)} className={cn("p-2 transition-colors", value === mode.value ? "bg-[var(--color-bg-subtle)]" : "hover:bg-[var(--color-bg-subtle)]")} aria-label={mode.label} title={mode.label}>
            <Icon className="h-4 w-4" style={{ color: value === mode.value ? "var(--color-text-primary)" : "var(--color-text-secondary)" }} />
          </button>
        );
      })}
    </div>
  );
}

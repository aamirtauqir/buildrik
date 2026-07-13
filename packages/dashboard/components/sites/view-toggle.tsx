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
    <div
      className="flex items-center gap-0.5 rounded-md border p-0.5"
      style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
    >
      {VIEW_MODES.map((mode) => {
        const Icon = iconMap[mode.icon as keyof typeof iconMap];
        const active = value === mode.value;
        return (
          <button
            key={mode.value}
            onClick={() => onChange(mode.value)}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-sm transition-colors"
            style={{
              backgroundColor: active ? "var(--color-primary-subtle)" : "transparent",
              color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
            }}
            aria-label={mode.label}
            aria-pressed={active}
            title={mode.label}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}

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
    <div className="flex rounded-lg border" style={{ borderColor: "#E8E8E8" }}>
      {VIEW_MODES.map((mode) => {
        const Icon = iconMap[mode.icon as keyof typeof iconMap];
        return (
          <button key={mode.value} onClick={() => onChange(mode.value)} className={cn("p-2 transition-colors", value === mode.value ? "bg-[#F4F4F4]" : "hover:bg-[#F4F4F4]")} aria-label={mode.label} title={mode.label}>
            <Icon className="h-4 w-4" style={{ color: value === mode.value ? "#0D0D0D" : "#7A7A7A" }} />
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Feather, SlidersHorizontal } from "lucide-react";
import { cn } from "@lib/utils";

// 04-role-select: this seeds editor control DENSITY — a reversible preference,
// never a permission. Simple = "fewer" controls, Advanced = "full" controls.
export const ONBOARDING_DENSITIES = [
  {
    value: "fewer",
    label: "Simple",
    description: "The essentials, nothing more. Best for getting started fast.",
    icon: "Feather",
  },
  {
    value: "full",
    label: "Advanced",
    description: "Every control on screen. Best if you know your way around.",
    icon: "SlidersHorizontal",
  },
] as const;

type DensityValue = (typeof ONBOARDING_DENSITIES)[number]["value"];

const iconMap = { Feather, SlidersHorizontal } as const;

interface OnboardingRoleSelectProps {
  onContinue: (density: DensityValue) => void;
  loading?: boolean;
}

export function OnboardingRoleSelect({ onContinue, loading }: OnboardingRoleSelectProps) {
  const [selected, setSelected] = useState<DensityValue | null>(null);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-md px-4">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2 text-center font-[family-name:var(--font-space-grotesk)]">
          How much do you want to see?
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] text-center mb-8">
          Pick a starting view. It&apos;s a preference, not a limit — switch any time.
        </p>

        <div className="space-y-3 mb-6">
          {ONBOARDING_DENSITIES.map((d) => {
            const Icon = iconMap[d.icon as keyof typeof iconMap];
            const isSelected = selected === d.value;
            return (
              <button
                key={d.value}
                onClick={() => setSelected(d.value)}
                className={cn(
                  "w-full flex items-center gap-4 rounded-xl border-2 px-5 py-4 text-left transition-all",
                  isSelected
                    ? "border-[var(--color-primary)] bg-red-50"
                    : "border-[var(--color-border-default)] bg-white hover:border-[#C0C0C0]"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg",
                    isSelected ? "bg-[var(--color-primary)]" : "bg-[var(--color-bg-subtle)]"
                  )}
                >
                  <Icon
                    className={cn("h-5 w-5", isSelected ? "text-white" : "text-[var(--color-text-secondary)]")}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{d.label}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{d.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => selected && onContinue(selected)}
          disabled={!selected || loading}
          className={cn(
            "w-full rounded-xl py-3 text-sm font-semibold transition-colors",
            selected && !loading
              ? "bg-[var(--color-primary)] text-white hover:bg-[#c91d0e]"
              : "bg-[var(--color-border-default)] text-[var(--color-text-muted)] cursor-not-allowed"
          )}
        >
          {loading ? "Saving…" : "Continue"}
        </button>
        <button
          onClick={() => onContinue("fewer")}
          disabled={loading}
          className="mt-3 w-full text-center text-sm text-[var(--color-text-secondary)] hover:underline disabled:opacity-50"
        >
          Skip — start Simple
        </button>
      </div>
    </div>
  );
}

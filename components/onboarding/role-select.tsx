"use client";

import { useState } from "react";
import { User, Users, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const ONBOARDING_ROLES = [
  {
    value: "FREELANCER",
    label: "Freelancer",
    description: "Independent professional",
    icon: "User",
  },
  {
    value: "SMALL_TEAM",
    label: "Small Team",
    description: "2-10 people",
    icon: "Users",
  },
  {
    value: "AGENCY",
    label: "Agency",
    description: "Client work at scale",
    icon: "Building2",
  },
] as const;

type RoleValue = (typeof ONBOARDING_ROLES)[number]["value"];

const iconMap = { User, Users, Building2 } as const;

interface OnboardingRoleSelectProps {
  onContinue: (role: RoleValue) => void;
  loading?: boolean;
}

export function OnboardingRoleSelect({ onContinue, loading }: OnboardingRoleSelectProps) {
  const [selected, setSelected] = useState<RoleValue | null>(null);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-md px-4">
        <h1 className="text-2xl font-bold text-[#0D0D0D] mb-2 text-center font-[family-name:var(--font-space-grotesk)]">
          How will you use Buildrik?
        </h1>
        <p className="text-sm text-[#7A7A7A] text-center mb-8">
          This helps us personalise your experience.
        </p>

        <div className="space-y-3 mb-8">
          {ONBOARDING_ROLES.map((role) => {
            const Icon = iconMap[role.icon as keyof typeof iconMap];
            const isSelected = selected === role.value;
            return (
              <button
                key={role.value}
                onClick={() => setSelected(role.value)}
                className={cn(
                  "w-full flex items-center gap-4 rounded-xl border-2 px-5 py-4 text-left transition-all",
                  isSelected
                    ? "border-[#E42313] bg-red-50"
                    : "border-[#E8E8E8] bg-white hover:border-[#C0C0C0]"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg",
                    isSelected ? "bg-[#E42313]" : "bg-[#F4F4F4]"
                  )}
                >
                  <Icon
                    className={cn("h-5 w-5", isSelected ? "text-white" : "text-[#7A7A7A]")}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0D0D0D]">{role.label}</p>
                  <p className="text-xs text-[#7A7A7A]">{role.description}</p>
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
              ? "bg-[#E42313] text-white hover:bg-[#c91d0e]"
              : "bg-[#E8E8E8] text-[#B0B0B0] cursor-not-allowed"
          )}
        >
          {loading ? "Saving…" : "Continue"}
        </button>
      </div>
    </div>
  );
}

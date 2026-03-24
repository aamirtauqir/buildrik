"use client";

import { cn } from "@/lib/utils";

const ONBOARDING_STEPS = [
  { id: "ROLE_SELECT", label: "Choose role" },
  { id: "PROJECT_SETUP", label: "Project setup" },
  { id: "SITE_CREATION", label: "Create site" },
] as const;

interface OnboardingSidebarProps {
  currentStep?: string;
}

export function OnboardingSidebar({ currentStep }: OnboardingSidebarProps) {
  const currentIdx = ONBOARDING_STEPS.findIndex((s) => s.id === currentStep);

  return (
    <aside
      className="fixed left-0 top-0 z-30 flex h-screen w-[72px] flex-col items-center py-6"
      style={{ backgroundColor: "#0D0D0D" }}
    >
      {/* Logo */}
      <div className="mb-8 flex h-9 w-9 items-center justify-center rounded-lg bg-[#E42313]">
        <span className="text-sm font-bold text-white">B</span>
      </div>

      {/* Step indicators */}
      <nav className="flex flex-col items-center gap-4">
        {ONBOARDING_STEPS.map((step, idx) => {
          const done = currentIdx > idx;
          const active = currentIdx === idx;
          return (
            <div key={step.id} className="relative flex flex-col items-center">
              <div
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  active
                    ? "bg-[#E42313]"
                    : done
                    ? "bg-white"
                    : "bg-[#3A3A3A]"
                )}
              />
              {idx < ONBOARDING_STEPS.length - 1 && (
                <div className="mt-1 h-6 w-px" style={{ backgroundColor: done ? "#FFFFFF40" : "#2A2A2A" }} />
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

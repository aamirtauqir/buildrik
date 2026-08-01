"use client";

import { Plus, PanelsTopLeft, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@lib/utils";
import { WizardShell } from "@/components/onboarding/wizard/wizard-shell";
import { OnbButton } from "@/components/onboarding/wizard/onb-button";
import { OnbBack } from "@/components/onboarding/wizard/onb-back";
import { useWizard } from "@/components/onboarding/wizard/wizard-context";
import { useOnboardingComplete } from "@/components/onboarding/wizard/use-onboarding-complete";

type Path = "ai" | "template" | "blank";

const ROUTE: Record<Path, string> = {
  ai: "/onboarding/ai/basics",
  template: "/onboarding/template",
  blank: "/onboarding/blank",
};

const ROLE_LABEL: Record<string, string> = {
  freelancer: "Freelancer",
  agency: "Agency",
  "in-house": "In-house",
  student: "Student",
  other: "your role",
};

// Which path we nudge, by the role captured at S1. Everyone else → AI Draft.
const RECOMMEND: Record<string, Path> = {
  freelancer: "ai",
  agency: "ai",
  "in-house": "template",
  student: "blank",
  other: "ai",
};

const CARDS: { path: Path; title: string; description: string; cta: string; icon: LucideIcon }[] = [
  {
    path: "ai",
    title: "AI Draft",
    description: "Answer a few questions and Buildrick creates a first draft with pages, sections, and copy.",
    cta: "Start AI Draft",
    icon: Sparkles,
  },
  {
    path: "template",
    title: "Template",
    description: "Pick a professional layout and customize it in the editor.",
    cta: "Browse Templates",
    icon: PanelsTopLeft,
  },
  {
    path: "blank",
    title: "Blank Canvas",
    description: "Start from zero with full design control.",
    cta: "Open Blank Canvas",
    icon: Plus,
  },
];

/** S3 · How do you want to start? Three build paths; the one matching the S1
 *  role is highlighted + mirrored by the bottom CTA. Back → S2. */
export default function PathPage() {
  const { data, saveAndGo } = useWizard();
  const { skipSetup, skipping } = useOnboardingComplete();

  const role = data.workspace?.role ?? "";
  const recommended = RECOMMEND[role] ?? "ai";
  const recCard = CARDS.find((c) => c.path === recommended)!;

  const choose = (path: Path) => saveAndGo(ROUTE[path], { path });

  return (
    <WizardShell chrome={{ variant: "stepper", step: 3 }} onSkip={skipSetup} skipping={skipping} padY={60}>
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-onb-title text-onb-text">How do you want to start?</h1>
        <p className="max-w-[560px] text-sm leading-[1.5] text-onb-muted">
          Choose the fastest way to create your first site.
        </p>
      </div>

      {/* The 3×320 card row (992px) is wider than the 480px wizard column, so it
          breaks out of it and re-centres on the viewport. */}
      <div className="relative left-1/2 mt-12 flex w-[992px] max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-start justify-center gap-4">
        {CARDS.map((c) => {
          const isRec = c.path === recommended;
          const Icon = c.icon;
          return (
            <div
              key={c.path}
              className={cn(
                "flex min-h-80 w-80 flex-col justify-between gap-4 rounded-lg bg-white p-6",
                "transition-shadow duration-150",
                "hover:shadow-[0_4px_12px_rgba(0,0,0,0.03),inset_0_0_0_2px_var(--color-onb-primary)]",
                isRec
                  ? "shadow-[0_4px_12px_rgba(0,0,0,0.03),inset_0_0_0_2px_var(--color-onb-primary)]"
                  : "shadow-[0_4px_12px_rgba(0,0,0,0.03),inset_0_0_0_1px_var(--color-onb-line)]"
              )}
            >
              <div className="flex flex-col gap-4 self-stretch">
                <div className="flex items-start justify-between">
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-onb",
                      isRec ? "bg-onb-primary-tint" : "bg-onb-surface"
                    )}
                  >
                    <Icon
                      size={20}
                      strokeWidth={1.7}
                      className={isRec ? "text-onb-primary" : "text-onb-muted"}
                    />
                  </span>
                  {isRec ? (
                    <span className="rounded-pill bg-onb-primary px-2.5 py-1 text-[10px] font-bold text-white">
                      Recommended
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-lg font-semibold text-onb-text">{c.title}</span>
                  <span className="text-[13px] leading-[1.5] text-onb-muted">{c.description}</span>
                </div>

                {isRec ? (
                  <span className="text-[11px] font-medium text-onb-primary">
                    Recommended because you selected {ROLE_LABEL[role] ?? "your role"}.
                  </span>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => choose(c.path)}
                className={cn(
                  "flex h-onb-input items-center justify-center rounded-onb bg-white",
                  "text-sm font-semibold transition-colors",
                  isRec
                    ? "text-onb-primary shadow-[inset_0_0_0_1px_var(--color-onb-primary)] hover:bg-onb-primary-tint"
                    : "text-onb-text shadow-[inset_0_0_0_1px_var(--color-onb-line)] hover:bg-onb-surface"
                )}
              >
                {c.cta}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-12 flex flex-col items-center gap-3">
        <OnbButton onClick={() => choose(recommended)}>{recCard.cta}</OnbButton>
        <span className="text-xs text-onb-subtle">Based on your selection above</span>
      </div>

      <div className="mt-12 flex justify-center">
        <OnbBack to="/onboarding/site" />
      </div>
    </WizardShell>
  );
}

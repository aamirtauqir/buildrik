"use client";

import { useRouter } from "next/navigation";
import { cn } from "@lib/utils";
import { WizardShell } from "@/components/onboarding/wizard/wizard-shell";
import { OnbButton } from "@/components/onboarding/wizard/onb-button";
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

const CARDS: { path: Path; title: string; description: string; cta: string }[] = [
  {
    path: "ai",
    title: "AI Draft",
    description: "Answer a few questions and Buildrick creates a first draft with pages, sections, and copy.",
    cta: "Start AI Draft",
  },
  {
    path: "template",
    title: "Template",
    description: "Pick a professional layout and customize it in the editor.",
    cta: "Browse Templates",
  },
  {
    path: "blank",
    title: "Blank Canvas",
    description: "Start from zero with full design control.",
    cta: "Open Blank Canvas",
  },
];

/** S3 · How do you want to start? Three build paths; the one matching the S1
 *  role is highlighted + mirrored by the bottom CTA. Back → S2. */
export default function PathPage() {
  const router = useRouter();
  const { data, saveAndGo } = useWizard();
  const { skipSetup, skipping } = useOnboardingComplete();

  const role = data.workspace?.role ?? "";
  const recommended = RECOMMEND[role] ?? "ai";
  const recCard = CARDS.find((c) => c.path === recommended)!;

  const choose = (path: Path) => saveAndGo(ROUTE[path], { path });

  return (
    <WizardShell chrome={{ variant: "stepper", step: 3 }} onSkip={skipSetup} skipping={skipping}>
      <div className="text-center mb-8">
        <h1 className="text-onb-title font-bold text-onb-ink">How do you want to start?</h1>
        <p className="mt-2 text-sm text-onb-muted">Choose the fastest way to create your first site.</p>
      </div>

      <div className="flex flex-col gap-3">
        {CARDS.map((c) => {
          const isRec = c.path === recommended;
          return (
            <div
              key={c.path}
              className={cn(
                "relative rounded-onb border p-5",
                isRec ? "border-onb-primary bg-onb-primary-tint border-l-4" : "border-onb-line bg-white"
              )}
            >
              {isRec ? (
                <span className="absolute -top-2 left-4 rounded-full bg-onb-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                  Recommended
                </span>
              ) : null}
              <p className="text-base font-semibold text-onb-ink">{c.title}</p>
              <p className="mt-1 text-sm text-onb-muted leading-relaxed">{c.description}</p>
              {isRec ? (
                <p className="mt-1 text-xs font-medium text-onb-primary">
                  Recommended because you selected {ROLE_LABEL[role] ?? "your role"}.
                </p>
              ) : null}
              <OnbButton
                variant={isRec ? "primary" : "secondary"}
                className="mt-3.5"
                onClick={() => choose(c.path)}
              >
                {c.cta}
              </OnbButton>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col items-center gap-1">
        <OnbButton onClick={() => choose(recommended)}>{recCard.cta}</OnbButton>
        <span className="text-xs text-onb-subtle">Based on your selection above</span>
      </div>

      <button
        type="button"
        onClick={() => router.push("/onboarding/site")}
        className="mt-5 w-full text-center text-sm text-onb-muted hover:text-onb-text"
      >
        Back
      </button>
    </WizardShell>
  );
}

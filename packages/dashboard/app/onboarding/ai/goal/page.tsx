"use client";

import { useState } from "react";
import { WizardShell } from "@/components/onboarding/wizard/wizard-shell";
import { OnbField } from "@/components/onboarding/wizard/onb-field";
import { OnbChips } from "@/components/onboarding/wizard/onb-chips";
import { OnbButton } from "@/components/onboarding/wizard/onb-button";
import { OnbBack } from "@/components/onboarding/wizard/onb-back";
import { useWizard } from "@/components/onboarding/wizard/wizard-context";
import { useOnboardingComplete } from "@/components/onboarding/wizard/use-onboarding-complete";
import { GOALS, SUGGESTED_PAGES } from "@lib/onboarding/wizard-options";

/** A2 · Goal, audience & pages (AI Draft 2/3). Home is always included. → A3. */
export default function AiGoalPage() {
  const { data, saveAndGo, saving } = useWizard();
  const { skipSetup, skipping } = useOnboardingComplete();

  const [goal, setGoal] = useState(data.ai?.goal ?? "");
  const [audience, setAudience] = useState(data.ai?.audience ?? "");
  const [cta, setCta] = useState(data.ai?.cta ?? "");
  // Stored pages exclude the always-on Home; UI selects the extras.
  const [pages, setPages] = useState<string[]>(data.ai?.pages?.filter((p) => p !== "Home") ?? ["About", "Services", "Contact"]);
  const [err, setErr] = useState<string>();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!goal) {
      setErr("Pick a main goal to continue.");
      return;
    }
    await saveAndGo("/onboarding/ai/brand", {
      ai: { ...data.ai, goal, audience: audience.trim(), cta: cta.trim(), pages: ["Home", ...pages] },
    });
  }

  return (
    <WizardShell
      chrome={{ variant: "progress", step: 2, label: "AI Draft" }}
      onSkip={skipSetup}
      skipping={skipping}
      padY={40}
    >
      <div className="-mx-[30px] flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-onb-title font-bold text-onb-text">What should this website achieve?</h1>
          <p className="max-w-[560px] text-sm leading-[1.5] text-onb-muted">
            Pick a main goal, audience, and pages.
          </p>
        </div>

        <form onSubmit={submit} className="flex w-full flex-col gap-10">
          <div className="flex flex-col gap-6">
            <OnbChips label="Main goal" options={GOALS} value={goal} onChange={(v) => setGoal(v as string)} />
            <OnbField
              label="Target audience"
              placeholder="Small business owners and event planners"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            />
            <OnbField label="Main CTA text" placeholder="Book a call" value={cta} onChange={(e) => setCta(e.target.value)} />
            <OnbChips
              label="Pages (Home is always included)"
              options={SUGGESTED_PAGES}
              value={pages}
              onChange={(v) => setPages(v as string[])}
              multi
            />
          </div>

          <div className="flex flex-col gap-6">
            {err ? (
              <p className="text-center text-sm text-onb-error" role="alert">
                {err}
              </p>
            ) : null}
            <OnbButton type="submit" loading={saving} disabled={saving}>
              Continue
            </OnbButton>
            <OnbBack to="/onboarding/ai/basics" />
          </div>
        </form>
      </div>
    </WizardShell>
  );
}

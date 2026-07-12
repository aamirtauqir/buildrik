"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WizardShell } from "@/components/onboarding/wizard/wizard-shell";
import { OnbField } from "@/components/onboarding/wizard/onb-field";
import { OnbChips } from "@/components/onboarding/wizard/onb-chips";
import { OnbButton } from "@/components/onboarding/wizard/onb-button";
import { useWizard } from "@/components/onboarding/wizard/wizard-context";
import { useOnboardingComplete } from "@/components/onboarding/wizard/use-onboarding-complete";

const GOALS = [
  { value: "leads", label: "Get leads" },
  { value: "calls", label: "Book calls" },
  { value: "sell", label: "Sell products" },
  { value: "portfolio", label: "Show portfolio" },
  { value: "inform", label: "Share information" },
];

const PAGES = ["About", "Services", "Pricing", "Portfolio", "Contact", "Blog", "FAQ"].map((p) => ({
  value: p,
  label: p,
}));

/** A2 · Goal, audience & pages (AI Draft 2/3). Home is always included. → A3. */
export default function AiGoalPage() {
  const router = useRouter();
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
    >
      <div className="text-center mb-8">
        <h1 className="text-onb-title font-bold text-onb-ink">What should this website achieve?</h1>
        <p className="mt-2 text-sm text-onb-muted">Pick a main goal, audience, and pages.</p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-5">
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
          options={PAGES}
          value={pages}
          onChange={(v) => setPages(v as string[])}
          multi
        />

        {err ? <p className="text-sm text-onb-error text-center" role="alert">{err}</p> : null}

        <OnbButton type="submit" loading={saving} disabled={saving} className="mt-1">
          Continue
        </OnbButton>
        <button type="button" onClick={() => router.push("/onboarding/ai/basics")} className="text-sm text-onb-muted hover:text-onb-text">
          Back
        </button>
      </form>
    </WizardShell>
  );
}

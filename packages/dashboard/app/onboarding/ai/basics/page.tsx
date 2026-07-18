"use client";

import { useState } from "react";
import { WizardShell } from "@/components/onboarding/wizard/wizard-shell";
import { OnbField } from "@/components/onboarding/wizard/onb-field";
import { OnbChips } from "@/components/onboarding/wizard/onb-chips";
import { OnbButton } from "@/components/onboarding/wizard/onb-button";
import { OnbBack } from "@/components/onboarding/wizard/onb-back";
import { useWizard } from "@/components/onboarding/wizard/wizard-context";
import { useOnboardingComplete } from "@/components/onboarding/wizard/use-onboarding-complete";

const INDUSTRIES = [
  { value: "restaurant", label: "Restaurant" },
  { value: "clinic", label: "Clinic / Medical" },
  { value: "agency", label: "Agency / Services" },
  { value: "shop", label: "Shop" },
  { value: "portfolio", label: "Portfolio" },
  { value: "events", label: "Events" },
  { value: "saas", label: "SaaS" },
  { value: "other", label: "Other" },
];

/** A1 · Business basics (AI Draft 1/3). Captures industry + name + description
 *  into wizardData.ai. → A2. Back → S3.
 *
 *  The A-frames draw a 540px form column — wider than the shell's 480px
 *  (`max-w-onb`), which the S/B frames use — so the body breaks out by 30px
 *  a side. */
export default function AiBasicsPage() {
  const { data, saveAndGo, saving } = useWizard();
  const { skipSetup, skipping } = useOnboardingComplete();

  const [industry, setIndustry] = useState(data.ai?.industry ?? "");
  const [name, setName] = useState(data.ai?.name ?? data.site?.name ?? "");
  const [desc, setDesc] = useState(data.ai?.desc ?? "");
  const [location, setLocation] = useState(data.ai?.location ?? "");
  const [err, setErr] = useState<string>();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!industry || name.trim().length < 2 || !desc.trim()) {
      setErr("Add a business type, name, and one-line description to continue.");
      return;
    }
    await saveAndGo("/onboarding/ai/goal", {
      ai: { ...data.ai, industry, name: name.trim(), desc: desc.trim(), location: location.trim() },
    });
  }

  return (
    <WizardShell
      chrome={{ variant: "progress", step: 1, label: "AI Draft" }}
      onSkip={skipSetup}
      skipping={skipping}
      padY={40}
    >
      <div className="-mx-[30px] flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-onb-title font-bold text-onb-text">Tell us about the business</h1>
          <p className="max-w-[560px] text-sm leading-[1.5] text-onb-muted">
            This helps Buildrick create the right structure and copy.
          </p>
        </div>

        <form onSubmit={submit} className="flex w-full flex-col gap-10">
          <div className="flex flex-col gap-6">
            <OnbChips
              label="Business type / industry"
              options={INDUSTRIES}
              value={industry}
              onChange={(v) => setIndustry(v as string)}
            />
            <OnbField
              label="Business name"
              placeholder="Bright Events"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <OnbField
              label="One-line description"
              placeholder="Event planning and coordination services"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
            <OnbField
              label="Location / service area (optional)"
              placeholder="Lahore, Pakistan"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
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
            <OnbBack to="/onboarding/path" />
          </div>
        </form>
      </div>
    </WizardShell>
  );
}

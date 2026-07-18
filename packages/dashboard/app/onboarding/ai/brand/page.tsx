"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { WizardShell } from "@/components/onboarding/wizard/wizard-shell";
import { OnbField } from "@/components/onboarding/wizard/onb-field";
import { OnbChips } from "@/components/onboarding/wizard/onb-chips";
import { OnbButton } from "@/components/onboarding/wizard/onb-button";
import { OnbBack } from "@/components/onboarding/wizard/onb-back";
import { useWizard } from "@/components/onboarding/wizard/wizard-context";
import { useOnboardingComplete } from "@/components/onboarding/wizard/use-onboarding-complete";

const TONES = ["Professional", "Friendly", "Premium", "Bold", "Minimal"].map((t) => ({ value: t.toLowerCase(), label: t }));
const STYLES = ["Clean SaaS", "Agency", "Local business", "Portfolio", "E-commerce"].map((s) => ({ value: s, label: s }));

/** A3 · Brand style (AI Draft 3/3). Captures tone/style/color/reference sites,
 *  then fires the draft generation on A4. → A4.
 *
 *  The logo dropzone is presentational only: there is no asset-upload endpoint
 *  in the onboarding chain and `wizardDataSchema.ai` has no field to carry a
 *  logo, so it accepts nothing. It is drawn because the frame draws it. */
export default function AiBrandPage() {
  const { data, saveAndGo, saving } = useWizard();
  const { skipSetup, skipping } = useOnboardingComplete();

  const [tone, setTone] = useState(data.ai?.tone ?? "professional");
  const [style, setStyle] = useState(data.ai?.style ?? "");
  const [color, setColor] = useState(data.ai?.color ?? "");
  const [refs, setRefs] = useState(data.ai?.refs ?? "");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await saveAndGo("/onboarding/ai/generating", {
      ai: { ...data.ai, tone, style, color: color.trim(), refs: refs.trim() },
    });
  }

  return (
    <WizardShell
      chrome={{ variant: "progress", step: 3, label: "AI Draft" }}
      onSkip={skipSetup}
      skipping={skipping}
      padY={40}
    >
      <div className="-mx-[30px] flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-onb-title font-bold text-onb-text">Choose brand style</h1>
          <p className="max-w-[560px] text-sm leading-[1.5] text-onb-muted">
            Set the tone and visual direction for the AI draft.
          </p>
        </div>

        <form onSubmit={submit} className="flex w-full flex-col gap-10">
          <div className="flex flex-col gap-6">
            <OnbChips label="Tone" options={TONES} value={tone} onChange={(v) => setTone(v as string)} />
            <OnbChips label="Visual style" options={STYLES} value={style} onChange={(v) => setStyle(v as string)} />
            <OnbField
              label="Color preference"
              placeholder="Blue and slate"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />

            <div className="w-full">
              <p className="mb-2 text-sm font-semibold text-onb-text">Upload logo (optional)</p>
              <div className="flex h-[72px] items-center justify-center gap-2.5 rounded-onb border-[1.5px] border-dashed border-onb-line text-[13px] text-onb-subtle">
                <Upload className="h-[22px] w-[22px]" strokeWidth={1.6} />
                Drop logo here or click to upload
              </div>
            </div>

            <OnbField
              label="Reference websites (optional)"
              placeholder="e.g. stripe.com, linear.app"
              value={refs}
              onChange={(e) => setRefs(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-6">
            <OnbButton type="submit" loading={saving} disabled={saving}>
              Generate site draft
            </OnbButton>
            <OnbBack to="/onboarding/ai/goal" />
          </div>
        </form>
      </div>
    </WizardShell>
  );
}

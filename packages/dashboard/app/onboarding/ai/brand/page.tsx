"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WizardShell } from "@/components/onboarding/wizard/wizard-shell";
import { OnbField } from "@/components/onboarding/wizard/onb-field";
import { OnbChips } from "@/components/onboarding/wizard/onb-chips";
import { OnbButton } from "@/components/onboarding/wizard/onb-button";
import { useWizard } from "@/components/onboarding/wizard/wizard-context";
import { useOnboardingComplete } from "@/components/onboarding/wizard/use-onboarding-complete";

const TONES = ["Professional", "Friendly", "Premium", "Bold", "Minimal"].map((t) => ({ value: t.toLowerCase(), label: t }));
const STYLES = ["Clean SaaS", "Agency", "Local business", "Portfolio", "E-commerce"].map((s) => ({ value: s, label: s }));

/** A3 · Brand style (AI Draft 3/3). Captures tone/style/color, then fires the
 *  draft generation on A4. → A4. */
export default function AiBrandPage() {
  const router = useRouter();
  const { data, saveAndGo, saving } = useWizard();
  const { skipSetup, skipping } = useOnboardingComplete();

  const [tone, setTone] = useState(data.ai?.tone ?? "professional");
  const [style, setStyle] = useState(data.ai?.style ?? "");
  const [color, setColor] = useState(data.ai?.color ?? "");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await saveAndGo("/onboarding/ai/generating", {
      ai: { ...data.ai, tone, style, color: color.trim() },
    });
  }

  return (
    <WizardShell
      chrome={{ variant: "progress", step: 3, label: "AI Draft" }}
      onSkip={skipSetup}
      skipping={skipping}
    >
      <div className="text-center mb-8">
        <h1 className="text-onb-title font-bold text-onb-ink">Choose brand style</h1>
        <p className="mt-2 text-sm text-onb-muted">Set the tone and visual direction for the AI draft.</p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-5">
        <OnbChips label="Tone" options={TONES} value={tone} onChange={(v) => setTone(v as string)} />
        <OnbChips label="Visual style" options={STYLES} value={style} onChange={(v) => setStyle(v as string)} />
        <OnbField
          label="Color preference (optional)"
          placeholder="Blue and slate"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />

        <OnbButton type="submit" loading={saving} disabled={saving} className="mt-1">
          Generate site draft
        </OnbButton>
        <button type="button" onClick={() => router.push("/onboarding/ai/goal")} className="text-sm text-onb-muted hover:text-onb-text">
          Back
        </button>
      </form>
    </WizardShell>
  );
}

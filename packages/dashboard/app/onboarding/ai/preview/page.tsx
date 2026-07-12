"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WizardShell } from "@/components/onboarding/wizard/wizard-shell";
import { OnbButton } from "@/components/onboarding/wizard/onb-button";
import { useWizard } from "@/components/onboarding/wizard/wizard-context";
import { useOnboardingComplete } from "@/components/onboarding/wizard/use-onboarding-complete";

const TONE_LABEL: Record<string, string> = {
  professional: "Professional",
  friendly: "Friendly",
  premium: "Premium",
  bold: "Bold",
  minimal: "Minimal",
};

/** A5 · Draft preview. Summarizes what the AI generated, then opens the editor.
 *  Only reachable after a COMPLETED job (siteId present). */
export default function AiPreviewPage() {
  const router = useRouter();
  const { data } = useWizard();
  const { openEditor, busy } = useOnboardingComplete();
  const ai = data.ai;
  const pages = ai?.pages ?? [];

  useEffect(() => {
    if (!data.siteId) router.replace("/onboarding/ai/basics");
  }, [data.siteId, router]);

  if (!data.siteId) return null;

  const styleLine = [ai?.style, ai?.tone ? TONE_LABEL[ai.tone] ?? ai.tone : null].filter(Boolean).join(" · ");

  return (
    <WizardShell chrome={{ variant: "simple" }}>
      <div className="text-center mb-8">
        <h1 className="text-onb-title font-bold text-onb-ink">Your first draft is ready</h1>
        <p className="mt-2 text-sm text-onb-muted">Review what Buildrick created before opening the editor.</p>
      </div>

      <div className="rounded-onb border border-onb-line bg-onb-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-onb-subtle">Pages created · {pages.length}</p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {pages.map((p) => (
            <li key={p} className="text-sm text-onb-ink">• {p}</li>
          ))}
        </ul>
        {ai?.cta ? (
          <div className="mt-4 flex items-center justify-between border-t border-onb-line pt-3">
            <span className="text-sm text-onb-muted">Main CTA</span>
            <span className="text-sm font-medium text-onb-ink">{ai.cta}</span>
          </div>
        ) : null}
        {styleLine ? (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-onb-muted">Style</span>
            <span className="text-sm font-medium text-onb-ink">{styleLine}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-8 flex flex-col gap-2">
        <OnbButton loading={busy} disabled={busy} onClick={() => openEditor(data.siteId!)}>
          Open in Editor
        </OnbButton>
        <button
          type="button"
          onClick={() => router.push("/onboarding/ai/basics")}
          className="text-sm text-onb-muted hover:text-onb-text"
        >
          Edit answers
        </button>
        <button
          type="button"
          onClick={() => router.push("/onboarding/ai/generating")}
          className="text-sm text-onb-muted hover:text-onb-text"
        >
          Regenerate draft
        </button>
      </div>
    </WizardShell>
  );
}

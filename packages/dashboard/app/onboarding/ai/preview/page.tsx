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

/** One of A5's three summary tiles — 200px, hairline ring, label over value. */
function SummaryCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex w-[200px] flex-col gap-2 rounded-onb bg-white p-4 shadow-[inset_0_0_0_1px_var(--color-onb-line)]">
      <span className="text-xs font-semibold tracking-[0.04em] text-onb-muted">{label}</span>
      {children}
    </div>
  );
}

/** A5 · Draft preview. Summarizes what the AI generated, then opens the editor.
 *  Only reachable after a COMPLETED job (siteId present). The site preview panel
 *  is a placeholder: no thumbnail/render of the generated site exists yet. */
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
  const previewTitle = [data.site?.name, ai?.name].filter(Boolean).join(" — ");

  return (
    <WizardShell chrome={{ variant: "simple" }} wide padY={40}>
      <div className="flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-onb-title font-bold text-onb-text">Your first draft is ready</h1>
          <p className="max-w-[560px] text-sm leading-[1.5] text-onb-muted">
            Review what Buildrick created before opening the editor.
          </p>
        </div>

        <div className="flex items-start justify-center gap-3">
          <SummaryCard label="Pages created">
            <span className="text-[28px] font-bold text-onb-text">{pages.length}</span>
            <div className="mt-0.5 flex flex-col gap-1">
              {pages.map((p) => (
                <span key={p} className="text-xs text-onb-muted">
                  • {p}
                </span>
              ))}
            </div>
          </SummaryCard>
          {ai?.cta ? (
            <SummaryCard label="Main CTA">
              <span className="text-[28px] font-bold text-onb-text">{ai.cta}</span>
            </SummaryCard>
          ) : null}
          {styleLine ? (
            <SummaryCard label="Style">
              <span className="text-lg font-bold text-onb-text">{styleLine}</span>
            </SummaryCard>
          ) : null}
        </div>

        <div className="flex w-[600px] flex-col items-center gap-4">
          {previewTitle ? <span className="text-[13px] font-semibold text-onb-muted">{previewTitle}</span> : null}
          <div className="flex h-[300px] w-full items-center justify-center rounded-xl bg-onb-surface shadow-[inset_0_0_0_1px_var(--color-onb-line)]">
            <span className="text-base font-semibold text-onb-muted opacity-40">Site preview</span>
          </div>
        </div>

        <div className="flex w-[540px] flex-col gap-4">
          <OnbButton loading={busy} disabled={busy} onClick={() => openEditor(data.siteId!)}>
            Open in Editor
          </OnbButton>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/onboarding/ai/basics")}
              className="flex h-11 flex-1 items-center justify-center rounded-onb text-[13px] font-medium text-onb-text shadow-[inset_0_0_0_1px_var(--color-onb-line)] transition-colors hover:bg-onb-surface"
            >
              Edit answers
            </button>
            <button
              type="button"
              onClick={() => router.push("/onboarding/ai/generating")}
              className="flex h-11 flex-1 items-center justify-center rounded-onb text-[13px] font-medium text-onb-text shadow-[inset_0_0_0_1px_var(--color-onb-line)] transition-colors hover:bg-onb-surface"
            >
              Regenerate draft
            </button>
          </div>
        </div>
      </div>
    </WizardShell>
  );
}

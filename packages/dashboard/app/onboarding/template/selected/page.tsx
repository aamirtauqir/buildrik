"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@lib/trpc/client";
import { WizardShell } from "@/components/onboarding/wizard/wizard-shell";
import { OnbButton } from "@/components/onboarding/wizard/onb-button";
import { useWizard } from "@/components/onboarding/wizard/wizard-context";
import { useOnboardingComplete } from "@/components/onboarding/wizard/use-onboarding-complete";

/** T3 · Template selected. Confirms the pick, then creates a template site and
 *  advances to E1. Choose another → gallery. */
export default function TemplateSelectedPage() {
  const router = useRouter();
  const { data } = useWizard();
  const { createAndAdvance, busy, skipSetup, skipping } = useOnboardingComplete();
  const templateId = data.template?.id;
  const [netErr, setNetErr] = useState<string>();

  useEffect(() => {
    if (!templateId) router.replace("/onboarding/template");
  }, [templateId, router]);

  const q = trpc.templates.get.useQuery({ id: templateId! }, { enabled: !!templateId });

  if (!templateId) return null;

  async function start() {
    setNetErr(undefined);
    try {
      await createAndAdvance({ method: "template", templateId });
    } catch (e) {
      setNetErr(e instanceof Error ? e.message : "Couldn't create your site. Try again.");
    }
  }

  return (
    <WizardShell chrome={{ variant: "simple" }} onSkip={skipSetup} skipping={skipping}>
      <div className="text-center mb-8">
        <h1 className="text-onb-title font-bold text-onb-ink">Template selected</h1>
        <p className="mt-2 text-sm text-onb-muted">Ready to start editing with this template.</p>
      </div>

      <div className="rounded-onb border border-onb-line bg-onb-surface px-4">
        <div className="flex items-center justify-between py-2.5 border-b border-onb-line">
          <span className="text-sm text-onb-muted">Template</span>
          <span className="text-sm font-medium text-onb-ink">{q.data?.name ?? "…"}</span>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <span className="text-sm text-onb-muted">Site</span>
          <span className="text-sm font-medium text-onb-ink">{data.site?.name ?? "Untitled site"}</span>
        </div>
      </div>

      {netErr ? (
        <p className="mt-4 text-sm text-onb-error text-center" role="alert">
          {netErr}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col gap-2">
        <OnbButton loading={busy} disabled={busy} onClick={start}>
          Open in Editor
        </OnbButton>
        <button
          type="button"
          onClick={() => router.push("/onboarding/template")}
          className="text-sm text-onb-muted hover:text-onb-text"
        >
          Choose another template
        </button>
      </div>
    </WizardShell>
  );
}

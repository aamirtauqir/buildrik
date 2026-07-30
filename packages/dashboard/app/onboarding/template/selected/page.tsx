"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutTemplate } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { WizardShell } from "@/components/onboarding/wizard/wizard-shell";
import { OnbBack } from "@/components/onboarding/wizard/onb-back";
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
    <WizardShell chrome={{ variant: "simple" }} onSkip={skipSetup} skipping={skipping} padY={48}>
      <div className="flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-onb-title font-bold text-onb-text">Template selected</h1>
          <p className="max-w-[560px] text-sm leading-[1.5] text-onb-muted">
            Ready to start editing with this template.
          </p>
        </div>

        <div className="w-[400px] max-w-full overflow-hidden rounded-lg bg-white shadow-[inset_0_0_0_1px_var(--color-onb-line)]">
          <div className="flex h-[220px] items-center justify-center bg-gray-100">
            {q.data?.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={q.data.thumbnail} alt={q.data.name} className="h-full w-full object-cover" />
            ) : (
              <LayoutTemplate className="h-10 w-10 text-onb-subtle" />
            )}
          </div>
          <div className="flex flex-col gap-2 p-5">
            <span className="text-base font-semibold text-onb-text">{q.data?.name ?? "…"}</span>
            <span className="text-[13px] text-onb-muted">{data.site?.name ?? "Untitled site"}</span>
          </div>
        </div>

        {netErr ? (
          <p className="text-center text-sm text-onb-error" role="alert">
            {netErr}
          </p>
        ) : null}

        <div className="flex flex-col items-center gap-4 self-stretch">
          <OnbButton loading={busy} disabled={busy} onClick={start}>
            Open in Editor
          </OnbButton>
          <OnbBack to="/onboarding/template">Choose another template</OnbBack>
        </div>
      </div>
    </WizardShell>
  );
}

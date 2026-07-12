"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LayoutTemplate } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { WizardShell } from "@/components/onboarding/wizard/wizard-shell";
import { OnbButton } from "@/components/onboarding/wizard/onb-button";
import { useWizard } from "@/components/onboarding/wizard/wizard-context";
import { useOnboardingComplete } from "@/components/onboarding/wizard/use-onboarding-complete";

/** T2 · Template preview. Shows the picked template's included pages + details,
 *  then confirms into T3. Back → gallery. */
export default function TemplatePreviewPage() {
  const router = useRouter();
  const { data, saveAndGo, saving } = useWizard();
  const { skipSetup, skipping } = useOnboardingComplete();
  const templateId = data.template?.id;

  useEffect(() => {
    if (!templateId) router.replace("/onboarding/template");
  }, [templateId, router]);

  const q = trpc.templates.get.useQuery({ id: templateId! }, { enabled: !!templateId });
  const t = q.data;
  const pages = Array.isArray(t?.pages) ? (t!.pages as Array<{ name?: string }>) : [];

  if (!templateId) return null;

  return (
    <WizardShell chrome={{ variant: "simple" }} onSkip={skipSetup} skipping={skipping}>
      {q.isLoading || !t ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-onb-line border-t-onb-primary" />
        </div>
      ) : (
        <>
          <div className="aspect-video rounded-onb border border-onb-line bg-onb-surface flex items-center justify-center mb-6 overflow-hidden">
            {t.previewUrl || t.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={(t.previewUrl || t.thumbnail)!} alt={t.name} className="h-full w-full object-cover" />
            ) : (
              <LayoutTemplate className="w-10 h-10 text-onb-subtle" />
            )}
          </div>

          <h1 className="text-onb-title font-bold text-onb-ink">{t.name}</h1>
          {t.description ? <p className="mt-2 text-sm text-onb-muted">{t.description}</p> : null}

          {pages.length > 0 ? (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-onb-subtle mb-2">Included pages</p>
              <div className="flex flex-wrap gap-2">
                {pages.map((p, i) => (
                  <span key={i} className="rounded-onb border border-onb-line px-2.5 py-1 text-xs text-onb-text">
                    {p.name ?? `Page ${i + 1}`}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-2">
            <OnbButton
              loading={saving}
              disabled={saving}
              onClick={() => saveAndGo("/onboarding/template/selected")}
            >
              Use this template
            </OnbButton>
            <button
              type="button"
              onClick={() => router.push("/onboarding/template")}
              className="text-sm text-onb-muted hover:text-onb-text"
            >
              Back to gallery
            </button>
          </div>
        </>
      )}
    </WizardShell>
  );
}

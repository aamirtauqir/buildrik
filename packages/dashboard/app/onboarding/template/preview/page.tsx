"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, LayoutTemplate, MoreHorizontal } from "lucide-react";
import { Spinner } from "flowbite-react";
import { trpc } from "@lib/trpc/client";
import { OnbBack } from "@/components/onboarding/wizard/onb-back";
import { OnbButton } from "@/components/onboarding/wizard/onb-button";
import { useWizard } from "@/components/onboarding/wizard/wizard-context";

/** T2 · Template preview. Full-bleed split frame: the template rendered inside a
 *  browser mock on the left, its details + CTA in the right rail. Confirms into
 *  T3; back → gallery. (No wizard header here — the frame puts the brand tile in
 *  the rail, so this page owns its own chrome. Unlike every other onboarding
 *  frame, T2 has no "Skip setup" escape hatch — verified against the frame,
 *  not an oversight — so this page doesn't pull in useOnboardingComplete.) */
export default function TemplatePreviewPage() {
  const router = useRouter();
  const { data, saveAndGo, saving } = useWizard();
  const templateId = data.template?.id;

  useEffect(() => {
    if (!templateId) router.replace("/onboarding/template");
  }, [templateId, router]);

  const q = trpc.templates.get.useQuery({ id: templateId! }, { enabled: !!templateId });
  const t = q.data;
  const pages = Array.isArray(t?.pages) ? (t!.pages as Array<{ name?: string }>) : [];

  if (!templateId) return null;

  if (q.isLoading || !t) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-onb-surface">
        <Spinner size="md" />
      </div>
    );
  }

  const preview = t.previewUrl || t.thumbnail;

  return (
    <div className="flex min-h-dvh bg-onb-surface">
      <div className="flex flex-1 flex-col bg-slate-100 p-8">
        <div className="flex h-[45px] items-center justify-between rounded-t-xl bg-white px-6 shadow-[inset_0_0_0_1px_var(--color-onb-line)]">
          <div className="flex gap-2">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <span className="rounded-md bg-slate-100 px-8 py-1 text-[11px] text-onb-muted">
            {t.slug}-preview.buildrick.site
          </span>
          <MoreHorizontal className="h-4 w-4 text-onb-subtle" />
        </div>

        <div className="flex flex-1 items-center justify-center overflow-hidden rounded-b-xl border border-t-0 border-onb-line bg-white">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={t.name} className="h-full w-full object-cover object-top" />
          ) : (
            <LayoutTemplate className="h-10 w-10 text-onb-subtle" />
          )}
        </div>
      </div>

      <aside className="flex w-[504px] shrink-0 flex-col justify-between border-l border-onb-line bg-white p-10">
        <div className="flex flex-col gap-8">
          <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-onb bg-onb-primary text-[17px] font-bold text-white">
              B
            </span>
            <span className="text-lg font-bold text-onb-text">Buildrick</span>
          </span>

          <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-bold text-onb-text">{t.name}</h1>
            {t.description ? (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-onb-subtle">BEST FOR</p>
                <p className="text-sm text-onb-muted">{t.description}</p>
              </div>
            ) : null}
          </div>

          {pages.length > 0 ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-onb-subtle">INCLUDED PAGES</p>
              <div className="flex flex-col gap-2">
                {pages.map((p, i) => (
                  <span key={i} className="flex items-center gap-2 text-[13px] text-onb-text">
                    <Check className="h-[13px] w-[13px] shrink-0 text-onb-success" strokeWidth={3} />
                    {p.name ?? `Page ${i + 1}`}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <OnbButton
            loading={saving}
            disabled={saving}
            onClick={() => saveAndGo("/onboarding/template/selected")}
          >
            Use this template
          </OnbButton>
          <OnbBack to="/onboarding/template">Back to gallery</OnbBack>
        </div>
      </aside>
    </div>
  );
}

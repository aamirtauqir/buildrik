"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WizardShell } from "@/components/onboarding/wizard/wizard-shell";
import { OnbButton } from "@/components/onboarding/wizard/onb-button";
import { useWizard } from "@/components/onboarding/wizard/wizard-context";
import { useOnboardingComplete } from "@/components/onboarding/wizard/use-onboarding-complete";
import { trpc } from "@lib/trpc/client";

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

/** Count the sections the AI actually emitted for a page.
 *  The worker wraps each generated section as a child of the page root
 *  (`ai-generate/[jobId]/route.ts:40-53`), so the child count is the section
 *  count. Returns 0 for a page whose blocks are missing or shaped unexpectedly
 *  rather than throwing — a preview must never be the thing that breaks. */
function sectionCount(blocks: unknown): number {
  const root = blocks as { children?: unknown[] } | null | undefined;
  return Array.isArray(root?.children) ? root.children.length : 0;
}

/** A5 · Draft preview. Summarizes what the AI generated, then opens the editor.
 *  Only reachable after a COMPLETED job (siteId present).
 *
 *  The summary used to read back the wizard's own answers — the pages the user
 *  ASKED for, not the ones that came out — under a heading telling them to
 *  "review what Buildrick created", next to an empty grey box labelled "Site
 *  preview". There was nothing to review. It now reports what the generator
 *  actually produced, read from the site.
 *
 *  Still not a visual preview: rendering an unpublished draft needs a renderer
 *  the app does not have (the share route redirects to a published URL, which a
 *  draft has no such thing). Tracked in TODOS.md. */
export default function AiPreviewPage() {
  const router = useRouter();
  const { data } = useWizard();
  const { openEditor, busy } = useOnboardingComplete();
  const ai = data.ai;
  // What the generator actually produced, not what the wizard asked for.
  const pagesQ = trpc.pages.list.useQuery(
    { siteId: data.siteId! },
    { enabled: !!data.siteId }
  );
  const generated = pagesQ.data ?? [];

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
            Here's the structure Buildrick drafted. Open the editor to see the full
            design and make it yours.
          </p>
        </div>

        <div className="flex items-start justify-center gap-3">
          <SummaryCard label="Pages created">
            <span className="text-[28px] font-bold text-onb-text">
              {pagesQ.isLoading ? "—" : generated.length}
            </span>
            <div className="mt-0.5 flex flex-col gap-1">
              {generated.map((p) => (
                <span key={p.id} className="text-xs text-onb-muted">
                  • {p.name}
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
          <div className="flex min-h-[300px] w-full flex-col gap-3 rounded-lg bg-onb-surface p-6 shadow-[inset_0_0_0_1px_var(--color-onb-line)]">
            {pagesQ.isLoading ? (
              <span className="m-auto text-base font-semibold text-onb-muted opacity-40">
                Loading your draft…
              </span>
            ) : generated.length === 0 ? (
              <span className="m-auto text-base font-semibold text-onb-muted opacity-40">
                No pages came back. Open the editor to start from here.
              </span>
            ) : (
              generated.map((p) => (
                <div
                  key={p.id}
                  className="flex items-baseline justify-between gap-4 border-b border-onb-line pb-2 last:border-0"
                >
                  <span className="text-sm font-semibold text-onb-text">{p.name}</span>
                  <span className="text-xs text-onb-muted">
                    {sectionCount(p.blocks)} sections
                  </span>
                </div>
              ))
            )}
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

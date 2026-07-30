"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WizardShell } from "@/components/onboarding/wizard/wizard-shell";
import { OnbButton } from "@/components/onboarding/wizard/onb-button";
import { OnbBack } from "@/components/onboarding/wizard/onb-back";
import { useWizard } from "@/components/onboarding/wizard/wizard-context";
import { useOnboardingComplete } from "@/components/onboarding/wizard/use-onboarding-complete";

const METHOD_LABEL: Record<string, string> = {
  ai: "AI Draft",
  template: "Template",
  blank: "Blank Canvas",
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-4 shadow-[inset_0_0_0_1px_var(--color-onb-line)]">
      <span className="text-[13px] text-onb-muted">{label}</span>
      {children}
    </div>
  );
}

function Value({ children }: { children: React.ReactNode }) {
  return <span className="text-[13px] font-semibold text-onb-text">{children}</span>;
}

/** Decorative editor chrome — a still of what "Open Editor" leads to, not the
 *  real thing. Its greys are literal frame values, deliberately outside the onb
 *  palette; only the accent (Publish) rides the token. */
function EditorPreview() {
  return (
    <div
      aria-hidden
      className="flex h-[280px] w-[600px] flex-col overflow-hidden rounded-[12px] bg-[#F9FAFB] shadow-[inset_0_0_0_1px_#E5E7EB]"
    >
      <div className="flex h-10 items-center justify-between bg-white px-4 shadow-[inset_0_0_0_1px_#E5E7EB]">
        <div className="flex gap-3">
          <span className="h-3 w-10 rounded-[2px] bg-[#E5E7EB]" />
          <span className="h-3 w-[60px] rounded-[2px] bg-[#E5E7EB]" />
        </div>
        <span className="rounded-[4px] bg-onb-primary px-3 py-1.5 text-[10px] font-bold text-white">
          Publish
        </span>
      </div>
      <div className="flex grow">
        <div className="flex w-10 flex-col gap-2 bg-[#D1D5DB] p-2 shadow-[inset_0_0_0_1px_#E5E7EB]">
          <span className="h-6 w-6 rounded-[4px] bg-[#E5E7EB]" />
          <span className="h-6 w-6 rounded-[4px] bg-[#E5E7EB]" />
          <span className="h-6 w-6 rounded-[4px] bg-[#E5E7EB]" />
        </div>
        <div className="flex grow items-center justify-center bg-white">
          <span className="text-base font-semibold text-[#E5E7EB]">Your headline goes here</span>
        </div>
        <div className="flex w-40 flex-col gap-3 bg-[#F9FAFB] p-4 shadow-[inset_0_0_0_1px_#E5E7EB]">
          <span className="h-2.5 self-stretch rounded-[2px] bg-[#E5E7EB]" />
          <span className="h-2.5 self-stretch rounded-[2px] bg-[#E5E7EB]" />
          <span className="h-2.5 self-stretch rounded-[2px] bg-[#E5E7EB]" />
        </div>
      </div>
    </div>
  );
}

/** E1 · Ready to edit. Terminal summary for every path — the site already
 *  exists (created by the path step); this just confirms and opens the editor. */
export default function ReadyPage() {
  const router = useRouter();
  const { data } = useWizard();
  const { openEditor, busy, skipSetup, skipping } = useOnboardingComplete();

  // No site means someone deep-linked here — send them back to the path chooser.
  useEffect(() => {
    if (!data.siteId) router.replace("/onboarding/path");
  }, [data.siteId, router]);

  if (!data.siteId) return null;

  const method = data.path ?? "blank";
  const pages =
    method === "ai" ? String(data.ai?.pages?.length ?? "—") : method === "blank" ? "1" : "—";

  return (
    <WizardShell chrome={{ variant: "simple" }} onSkip={skipSetup} skipping={skipping} wide>
      <div className="flex flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-onb-title font-bold text-onb-text">Ready to edit</h1>
          <p className="max-w-[560px] text-sm leading-[1.5] text-onb-muted">
            Everything is set up. Jump into the editor.
          </p>
        </div>

        <div className="flex w-[500px] flex-col overflow-hidden rounded-[12px] bg-onb-surface shadow-[inset_0_0_0_1px_var(--color-onb-line)]">
          <Row label="Site">
            <Value>{data.site?.name ?? "Untitled site"}</Value>
          </Row>
          {data.site?.client?.name ? (
            <Row label="Client">
              <Value>{data.site.client.name}</Value>
            </Row>
          ) : null}
          <Row label="Workspace">
            <Value>{data.workspace?.name ?? "—"}</Value>
          </Row>
          <Row label="Starting method">
            <span className="rounded-[4px] bg-onb-primary-tint px-2 py-1 text-[11px] font-bold text-onb-primary">
              {METHOD_LABEL[method]}
            </span>
          </Row>
          <Row label="Pages created">
            <Value>{pages}</Value>
          </Row>
        </div>

        <EditorPreview />

        <div className="flex w-[480px] flex-col items-center gap-4">
          <OnbButton loading={busy} disabled={busy} onClick={() => openEditor(data.siteId!)}>
            Open Editor
          </OnbButton>
          <OnbBack to="/onboarding/path">Back to setup</OnbBack>
        </div>
      </div>
    </WizardShell>
  );
}

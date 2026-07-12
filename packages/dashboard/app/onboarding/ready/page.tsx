"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WizardShell } from "@/components/onboarding/wizard/wizard-shell";
import { OnbButton } from "@/components/onboarding/wizard/onb-button";
import { useWizard } from "@/components/onboarding/wizard/wizard-context";
import { useOnboardingComplete } from "@/components/onboarding/wizard/use-onboarding-complete";

const METHOD_LABEL: Record<string, string> = {
  ai: "AI Draft",
  template: "Template",
  blank: "Blank Canvas",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-onb-line last:border-0">
      <span className="text-sm text-onb-muted">{label}</span>
      <span className="text-sm font-medium text-onb-ink">{value}</span>
    </div>
  );
}

/** E1 · Ready to edit. Terminal summary for every path — the site already
 *  exists (created by the path step); this just confirms and opens the editor. */
export default function ReadyPage() {
  const router = useRouter();
  const { data } = useWizard();
  const { openEditor, busy } = useOnboardingComplete();

  // No site means someone deep-linked here — send them back to the path chooser.
  useEffect(() => {
    if (!data.siteId) router.replace("/onboarding/path");
  }, [data.siteId, router]);

  if (!data.siteId) return null;

  const method = data.path ?? "blank";
  const pages =
    method === "ai" ? String(data.ai?.pages?.length ?? "—") : method === "blank" ? "1" : "—";

  return (
    <WizardShell chrome={{ variant: "simple" }}>
      <div className="text-center mb-8">
        <h1 className="text-onb-title font-bold text-onb-ink">Ready to edit</h1>
        <p className="mt-2 text-sm text-onb-muted">Everything is set up. Jump into the editor.</p>
      </div>

      <div className="rounded-onb border border-onb-line bg-onb-surface px-4">
        <Row label="Site" value={data.site?.name ?? "Untitled site"} />
        {data.site?.client?.name ? <Row label="Client" value={data.site.client.name} /> : null}
        <Row label="Workspace" value={data.workspace?.name ?? "—"} />
        <Row label="Starting method" value={METHOD_LABEL[method]} />
        <Row label="Pages created" value={pages} />
      </div>

      <div className="mt-8 flex flex-col gap-2">
        <OnbButton loading={busy} disabled={busy} onClick={() => openEditor(data.siteId!)}>
          Open Editor
        </OnbButton>
        <button
          type="button"
          onClick={() => router.push("/onboarding/path")}
          className="text-sm text-onb-muted hover:text-onb-text"
        >
          Back to setup
        </button>
      </div>
    </WizardShell>
  );
}

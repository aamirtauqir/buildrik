"use client";

import { useState } from "react";
import { cn } from "@lib/utils";
import { WizardShell } from "@/components/onboarding/wizard/wizard-shell";
import { OnbField } from "@/components/onboarding/wizard/onb-field";
import { OnbButton } from "@/components/onboarding/wizard/onb-button";
import { OnbBack } from "@/components/onboarding/wizard/onb-back";
import { useWizard } from "@/components/onboarding/wizard/wizard-context";
import { useOnboardingComplete } from "@/components/onboarding/wizard/use-onboarding-complete";

const START_PAGES = ["Home page", "Landing page", "Empty page"];
const LAYOUTS = ["Header only", "Header + hero", "Completely blank"];

/** B1's option groups: equal-width 56px segments, not chips. Local to this frame
 *  — no other screen draws this shape. */
function OptionRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 self-stretch">
      <span className="text-sm font-semibold text-onb-text">{label}</span>
      <div className="flex gap-3 self-stretch">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            aria-pressed={value === o}
            className={cn(
              "flex h-14 flex-1 items-center justify-center rounded-onb text-[13.5px] font-medium transition-colors",
              value === o
                ? "bg-onb-primary-tint text-onb-primary shadow-[inset_0_0_0_1.5px_var(--color-onb-primary)]"
                : "bg-white text-onb-text shadow-[inset_0_0_0_1px_var(--color-onb-line)] hover:shadow-[inset_0_0_0_1px_var(--color-onb-subtle)]"
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

/** B1 · Blank canvas setup. Creates a blank site and advances to E1. The
 *  starting-page / layout-starter picks are captured for the editor to honor
 *  later (createSite makes an empty site today). */
export default function BlankPage() {
  const { data } = useWizard();
  const { createAndAdvance, busy, skipSetup, skipping } = useOnboardingComplete();

  const [siteName, setSiteName] = useState(data.site?.name ?? "");
  const [startingPage, setStartingPage] = useState(data.blank?.startingPage ?? "Home page");
  const [layoutStarter, setLayoutStarter] = useState(data.blank?.layoutStarter ?? "Header only");
  const [siteErr, setSiteErr] = useState<string>();
  const [netErr, setNetErr] = useState<string>();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setNetErr(undefined);
    if (siteName.trim().length < 2) {
      setSiteErr("Site name is required.");
      return;
    }
    try {
      await createAndAdvance({
        method: "blank",
        siteName,
        patch: { blank: { startingPage, layoutStarter } },
      });
    } catch (e) {
      setNetErr(e instanceof Error ? e.message : "Couldn't create your site. Try again.");
    }
  }

  return (
    <WizardShell chrome={{ variant: "stepper", step: 3 }} onSkip={skipSetup} skipping={skipping} padY={60}>
      <div className="mb-10 flex flex-col items-center gap-3 text-center">
        <h1 className="text-onb-title font-bold text-onb-text">Start with a blank canvas</h1>
        <p className="max-w-[560px] text-sm leading-[1.5] text-onb-muted">
          Set the basics before opening the editor.
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col items-start gap-6">
        <OnbField
          label="Site name"
          placeholder="e.g. Bright Events Website"
          value={siteName}
          onChange={(e) => {
            setSiteName(e.target.value);
            if (siteErr) setSiteErr(undefined);
          }}
          error={siteErr}
          autoFocus
        />
        <OptionRow
          label="Starting page"
          options={START_PAGES}
          value={startingPage}
          onChange={setStartingPage}
        />
        <OptionRow
          label="Layout starter (optional)"
          options={LAYOUTS}
          value={layoutStarter}
          onChange={(v) => setLayoutStarter(layoutStarter === v ? "" : v)}
        />

        {netErr ? (
          <p className="self-stretch text-center text-sm text-onb-error" role="alert">
            {netErr}
          </p>
        ) : null}

        <OnbButton type="submit" loading={busy} disabled={busy}>
          Open Blank Canvas
        </OnbButton>
        <OnbBack to="/onboarding/path" />
      </form>
    </WizardShell>
  );
}

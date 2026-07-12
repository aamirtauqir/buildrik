"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@lib/utils";
import { WizardShell } from "@/components/onboarding/wizard/wizard-shell";
import { OnbField } from "@/components/onboarding/wizard/onb-field";
import { OnbButton } from "@/components/onboarding/wizard/onb-button";
import { useWizard } from "@/components/onboarding/wizard/wizard-context";
import { useOnboardingComplete } from "@/components/onboarding/wizard/use-onboarding-complete";

const START_PAGES = ["Home page", "Landing page", "Empty page"];
const LAYOUTS = ["Header only", "Header + hero", "Completely blank"];

function Pills({
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
    <div>
      <p className="text-sm font-semibold text-onb-ink mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            aria-pressed={value === o}
            className={cn(
              "h-9 px-3.5 rounded-onb border text-sm transition-colors",
              value === o
                ? "border-onb-primary bg-onb-primary-tint text-onb-primary font-medium"
                : "border-onb-line bg-white text-onb-text hover:border-onb-subtle"
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
  const router = useRouter();
  const { data } = useWizard();
  const { createAndAdvance, busy, skipSetup, skipping } = useOnboardingComplete();

  const [siteName, setSiteName] = useState(data.site?.name ?? "");
  const [startingPage, setStartingPage] = useState(data.blank?.startingPage ?? "Home page");
  const [layoutStarter, setLayoutStarter] = useState(data.blank?.layoutStarter ?? "");
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
    <WizardShell chrome={{ variant: "stepper", step: 3 }} onSkip={skipSetup} skipping={skipping}>
      <div className="text-center mb-8">
        <h1 className="text-onb-title font-bold text-onb-ink">Start with a blank canvas</h1>
        <p className="mt-2 text-sm text-onb-muted">Set the basics before opening the editor.</p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-5">
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
        <Pills label="Starting page" options={START_PAGES} value={startingPage} onChange={setStartingPage} />
        <Pills
          label="Layout starter (optional)"
          options={LAYOUTS}
          value={layoutStarter}
          onChange={(v) => setLayoutStarter(layoutStarter === v ? "" : v)}
        />

        {netErr ? (
          <p className="text-sm text-onb-error text-center" role="alert">
            {netErr}
          </p>
        ) : null}

        <OnbButton type="submit" loading={busy} disabled={busy} className="mt-1">
          Open Blank Canvas
        </OnbButton>
        <button
          type="button"
          onClick={() => router.push("/onboarding/path")}
          className="text-sm text-onb-muted hover:text-onb-text"
        >
          Back
        </button>
      </form>
    </WizardShell>
  );
}

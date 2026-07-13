"use client";

import { useState } from "react";
import { trpc } from "@lib/trpc/client";
import { WizardShell } from "@/components/onboarding/wizard/wizard-shell";
import { OnbField } from "@/components/onboarding/wizard/onb-field";
import { OnbSelect } from "@/components/onboarding/wizard/onb-select";
import { OnbButton } from "@/components/onboarding/wizard/onb-button";
import { useWizard } from "@/components/onboarding/wizard/wizard-context";
import { useOnboardingComplete } from "@/components/onboarding/wizard/use-onboarding-complete";

const ROLES = [
  { value: "freelancer", label: "Freelancer" },
  { value: "agency", label: "Agency" },
  { value: "in-house", label: "In-house" },
  { value: "student", label: "Student" },
  { value: "other", label: "Other" },
];

const TEAM_SIZES = [
  { value: "just-me", label: "Just me" },
  { value: "2-10", label: "2–10" },
  { value: "11-50", label: "11–50" },
  { value: "51-200", label: "51–200" },
  { value: "200+", label: "200+" },
];

const MAX = 40;

/** S1 · Create your workspace. Renames the workspace created at signup (never
 *  .create — that throws the free-tier limit) and records role/teamSize for the
 *  S3 recommendation. → S2. */
export default function WorkspacePage() {
  const { data, saveAndGo, saving } = useWizard();
  const { skipSetup, skipping } = useOnboardingComplete();
  const renameWorkspace = trpc.account.workspace.update.useMutation();

  const [name, setName] = useState(data.workspace?.name ?? "");
  const [role, setRole] = useState(data.workspace?.role ?? "");
  const [teamSize, setTeamSize] = useState(data.workspace?.teamSize ?? "just-me");
  const [nameError, setNameError] = useState<string>();
  const [roleError, setRoleError] = useState<string>();
  const [netError, setNetError] = useState<string>();

  const trimmed = name.trim();
  const liveNameError =
    name.length > MAX ? `Keep it under ${MAX} characters — ${name.length} right now.` : nameError;

  const busy = renameWorkspace.isPending || saving;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setNetError(undefined);
    let bad = false;
    if (!trimmed) {
      setNameError("Workspace name is required.");
      bad = true;
    } else if (trimmed.length > MAX) {
      bad = true; // liveNameError already shows the too-long message
    } else {
      setNameError(undefined);
    }
    if (!role) {
      setRoleError("Please select your role.");
      bad = true;
    } else {
      setRoleError(undefined);
    }
    if (bad) return;

    try {
      await renameWorkspace.mutateAsync({ name: trimmed });
    } catch {
      setNetError("Couldn't save your workspace. Check your connection and try again.");
      return;
    }
    await saveAndGo("/onboarding/site", { workspace: { name: trimmed, role, teamSize } });
  }

  return (
    <WizardShell chrome={{ variant: "stepper", step: 1 }} onSkip={skipSetup} skipping={skipping}>
      <div className="flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-onb-title font-bold text-onb-text">Create your workspace</h1>
          <p className="max-w-[560px] text-sm leading-[1.5] text-onb-muted">
            Your workspace keeps clients, sites, assets, and team members together.
          </p>
        </div>

        <form onSubmit={submit} className="flex w-full flex-col gap-4">
          <OnbField
            label="Workspace name"
            placeholder="My Workspace"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(undefined);
            }}
            error={liveNameError}
            autoFocus
          />
          <OnbSelect
            label="Your role"
            placeholder="Select your role"
            options={ROLES}
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              if (roleError) setRoleError(undefined);
            }}
            error={roleError}
          />
          <OnbSelect
            label="Team size (optional)"
            options={TEAM_SIZES}
            value={teamSize}
            onChange={(e) => setTeamSize(e.target.value)}
          />

          <OnbButton type="submit" loading={busy} disabled={busy}>
            {busy ? "Creating workspace…" : "Create workspace"}
          </OnbButton>
        </form>
      </div>

      {netError ? (
        <div
          role="alert"
          className="fixed bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[10px] border border-onb-error bg-white px-[18px] py-3 text-[13px] font-medium text-onb-error shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
        >
          ⚠ {netError}
        </div>
      ) : null}
    </WizardShell>
  );
}

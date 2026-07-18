"use client";

import { useState } from "react";
import { TRPCClientError } from "@trpc/client";
import { trpc } from "@lib/trpc/client";
import { WizardShell } from "@/components/onboarding/wizard/wizard-shell";
import { OnbField } from "@/components/onboarding/wizard/onb-field";
import { OnbSelect } from "@/components/onboarding/wizard/onb-select";
import { OnbButton } from "@/components/onboarding/wizard/onb-button";
import { OnbBanner } from "@/components/onboarding/wizard/onb-banner";
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

/** The service surfaces this as a plain TRPCError({code:"CONFLICT"}) — the
 *  only source of CONFLICT on this mutation is WorkspaceNameTakenError, so the
 *  code alone is enough to key off (the display copy is composed here, not
 *  read off the error, since it needs the name the user actually typed). */
function isNameTakenError(e: unknown): boolean {
  return e instanceof TRPCClientError && e.data?.code === "CONFLICT";
}

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
  const [networkError, setNetworkError] = useState<string>();

  const trimmed = name.trim();
  const liveNameError =
    name.length > MAX ? `Keep it under ${MAX} characters — ${name.length} right now.` : nameError;

  const busy = renameWorkspace.isPending || saving;

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setNetworkError(undefined);
    if (!trimmed) {
      setNameError("Workspace name is required.");
      return;
    }
    if (trimmed.length > MAX) return; // liveNameError already shows the too-long message
    setNameError(undefined);

    try {
      await renameWorkspace.mutateAsync({ name: trimmed });
    } catch (err) {
      if (isNameTakenError(err)) {
        setNameError(`A workspace named “${trimmed}” already exists — try “${trimmed} Studio”.`);
      } else {
        setNetworkError("Something went wrong. Check your connection and try again.");
      }
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
            onChange={(e) => setRole(e.target.value)}
          />
          <OnbSelect
            label="Team size (optional)"
            options={TEAM_SIZES}
            value={teamSize}
            onChange={(e) => setTeamSize(e.target.value)}
          />

          <OnbButton type="submit" loading={busy} disabled={busy}>
            {busy ? "Continuing…" : "Continue"}
          </OnbButton>

          {networkError ? (
            <OnbBanner message={networkError} onRetry={() => submit()} retrying={busy} />
          ) : null}
        </form>
      </div>
    </WizardShell>
  );
}

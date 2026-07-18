"use client";

import { useState } from "react";
import { trpc } from "@lib/trpc/client";
import { WizardShell } from "@/components/onboarding/wizard/wizard-shell";
import { OnbField } from "@/components/onboarding/wizard/onb-field";
import { OnbSelect } from "@/components/onboarding/wizard/onb-select";
import { OnbCard } from "@/components/onboarding/wizard/onb-card";
import { OnbButton } from "@/components/onboarding/wizard/onb-button";
import { OnbBack } from "@/components/onboarding/wizard/onb-back";
import { OnbBanner } from "@/components/onboarding/wizard/onb-banner";
import { useWizard } from "@/components/onboarding/wizard/wizard-context";
import { useOnboardingComplete } from "@/components/onboarding/wizard/use-onboarding-complete";

type OrgType = "mine" | "existing" | "new";

const ORG_CARDS: { value: OrgType; title: string; description: string }[] = [
  { value: "mine", title: "My own business", description: "Create a site under your workspace." },
  { value: "existing", title: "Existing client", description: "Attach this site to a client already in your workspace." },
  { value: "new", title: "New client", description: "Add client details now. You can invite them later." },
];

// Existing-client picker's trailing option (S2 · Existing client frame) — picking
// it swaps the branch to "New client" rather than creating anything itself; the
// New-client fields + submit flow (below) own the actual capture.
const ADD_NEW_CLIENT = "__new__";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const EMAIL_ERROR_MSG = "Enter a valid email, like client@example.com.";
const NETWORK_ERROR_MSG = "Something went wrong. Check your connection and try again.";

/** S2 · Set up your first site. Captures the site name + who it belongs to into
 *  wizardData; the actual site (and any client) is created at path completion so
 *  the method (blank/template/ai) is known — createSiteSchema requires `method`,
 *  which isn't picked until S3, so this step can never call sites.create itself.
 *  → S3. Back → S1. */
export default function SitePage() {
  const { data, saveAndGo, saving } = useWizard();
  const { skipSetup, skipping } = useOnboardingComplete();
  const clients = trpc.clients.list.useQuery(undefined, { refetchOnWindowFocus: false });

  const [siteName, setSiteName] = useState(data.site?.name ?? "");
  const [orgType, setOrgType] = useState<OrgType>(data.site?.orgType ?? "new");
  const [clientId, setClientId] = useState(data.site?.client?.id ?? "");
  const [clientName, setClientName] = useState(data.site?.client?.name ?? "");
  const [clientEmail, setClientEmail] = useState(data.site?.client?.email ?? "");

  const [siteErr, setSiteErr] = useState<string>();
  const [clientNameErr, setClientNameErr] = useState<string>();
  // Email is validated live (not just on submit) — S2 · Email error / Focused
  // error frames both need to render before the user ever clicks Continue.
  // `emailTouched` gates it so the field doesn't error while still being typed
  // for the first time; OnbField's own `focus:` ring handles the visual
  // difference between the two frames (plain red ring vs. red ring + glow).
  const [emailTouched, setEmailTouched] = useState(false);
  const [pickErr, setPickErr] = useState<string>();

  const trimmedEmail = clientEmail.trim();
  const emailInvalid = trimmedEmail.length > 0 && !EMAIL_RE.test(trimmedEmail);
  const emailErr = emailTouched && emailInvalid ? EMAIL_ERROR_MSG : undefined;

  const clientOptions = [
    ...(clients.data ?? []).map((c) => ({ value: c.id, label: c.name })),
    { value: ADD_NEW_CLIENT, label: "+ Add new client" },
  ];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    let bad = false;
    if (siteName.trim().length < 2) {
      setSiteErr("Site name is required.");
      bad = true;
    } else setSiteErr(undefined);

    if (orgType === "new") {
      if (!clientName.trim()) {
        setClientNameErr("Client name is required.");
        bad = true;
      } else setClientNameErr(undefined);
      if (emailInvalid) {
        setEmailTouched(true); // surfaces the error even if the field was never blurred
        bad = true;
      }
    }
    if (orgType === "existing" && !clientId) {
      setPickErr("Select a client.");
      bad = true;
    } else setPickErr(undefined);

    if (bad) return;

    const client =
      orgType === "new"
        ? { name: clientName.trim(), email: clientEmail.trim() || undefined }
        : orgType === "existing"
          ? { id: clientId, name: clientOptions.find((o) => o.value === clientId)?.label }
          : undefined;

    await saveAndGo("/onboarding/path", {
      site: { name: siteName.trim(), orgType, client },
    });
  }

  return (
    <WizardShell chrome={{ variant: "stepper", step: 2 }} onSkip={skipSetup} skipping={skipping} wide padY={60}>
      <div className="flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-onb-title font-bold text-onb-text">Set up your first site</h1>
          <p className="max-w-[560px] text-sm leading-[1.5] text-onb-muted">
            Name your site, then choose how to organize it.
          </p>
        </div>

        <form onSubmit={submit} className="flex w-full flex-col items-center gap-8">
          <div className="flex w-full max-w-onb flex-col gap-4">
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
          </div>

          {/* The org-type row breaks out past the 480px form column (804px in the
              frame); items-center overflows it symmetrically, keeping it centred. */}
          <div className="flex w-[804px] gap-3">
            {ORG_CARDS.map((c) => (
              <OnbCard
                key={c.value}
                title={c.title}
                description={c.description}
                selected={orgType === c.value}
                onSelect={() => setOrgType(c.value)}
              />
            ))}
          </div>

          <div className="flex w-full max-w-onb flex-col gap-4">
            {orgType === "new" ? (
              <>
                <OnbField
                  label="Client name"
                  placeholder="Enter client business name"
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    if (clientNameErr) setClientNameErr(undefined);
                  }}
                  error={clientNameErr}
                />
                <OnbField
                  label="Client email (optional)"
                  type="email"
                  placeholder="client@example.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  error={emailErr}
                  hint="Used for review and approval links. We won't email them until you send a link."
                />
              </>
            ) : orgType === "existing" ? (
              clients.isError ? (
                <OnbBanner
                  message={NETWORK_ERROR_MSG}
                  onRetry={() => clients.refetch()}
                  retrying={clients.isFetching}
                />
              ) : (
                <OnbSelect
                  label="Select client"
                  placeholder="Select a client"
                  options={clientOptions}
                  value={clientId}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (next === ADD_NEW_CLIENT) {
                      setOrgType("new");
                      setClientId("");
                      return;
                    }
                    setClientId(next);
                    if (pickErr) setPickErr(undefined);
                  }}
                  error={pickErr}
                  hint={(clients.data ?? []).length === 0 ? "No clients in this workspace yet." : undefined}
                />
              )
            ) : null}

            <OnbButton type="submit" loading={saving} disabled={saving}>
              Continue
            </OnbButton>
            <OnbBack to="/onboarding/workspace" />
          </div>
        </form>
      </div>
    </WizardShell>
  );
}

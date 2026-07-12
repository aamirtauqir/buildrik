"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@lib/trpc/client";
import { WizardShell } from "@/components/onboarding/wizard/wizard-shell";
import { OnbField } from "@/components/onboarding/wizard/onb-field";
import { OnbSelect } from "@/components/onboarding/wizard/onb-select";
import { OnbCard } from "@/components/onboarding/wizard/onb-card";
import { OnbButton } from "@/components/onboarding/wizard/onb-button";
import { useWizard } from "@/components/onboarding/wizard/wizard-context";
import { useOnboardingComplete } from "@/components/onboarding/wizard/use-onboarding-complete";

type OrgType = "mine" | "existing" | "new";

const ORG_CARDS: { value: OrgType; title: string; description: string }[] = [
  { value: "mine", title: "My own business", description: "Create a site under your workspace." },
  { value: "existing", title: "Existing client", description: "Attach this site to a client already in your workspace." },
  { value: "new", title: "New client", description: "Add client details now. You can invite them later." },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** S2 · Set up your first site. Captures the site name + who it belongs to into
 *  wizardData; the actual site (and any client) is created at path completion so
 *  the method (blank/template/ai) is known. → S3. Back → S1. */
export default function SitePage() {
  const router = useRouter();
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
  const [emailErr, setEmailErr] = useState<string>();
  const [pickErr, setPickErr] = useState<string>();

  const clientOptions = (clients.data ?? []).map((c) => ({ value: c.id, label: c.name }));

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
      if (clientEmail.trim() && !EMAIL_RE.test(clientEmail.trim())) {
        setEmailErr("Enter a valid email, like client@example.com.");
        bad = true;
      } else setEmailErr(undefined);
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
    <WizardShell chrome={{ variant: "stepper", step: 2 }} onSkip={skipSetup} skipping={skipping}>
      <div className="text-center mb-8">
        <h1 className="text-onb-title font-bold text-onb-ink">Set up your first site</h1>
        <p className="mt-2 text-sm text-onb-muted">Name your site, then choose how to organize it.</p>
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

        <div className="flex flex-col gap-2.5">
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
              onChange={(e) => {
                setClientEmail(e.target.value);
                if (emailErr) setEmailErr(undefined);
              }}
              error={emailErr}
              hint="Used for review and approval links. We won't email them until you send a link."
            />
          </>
        ) : orgType === "existing" ? (
          <OnbSelect
            label="Select client"
            placeholder="Select a client"
            options={clientOptions}
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              if (pickErr) setPickErr(undefined);
            }}
            error={pickErr}
            hint={clientOptions.length === 0 ? "No clients in this workspace yet." : undefined}
          />
        ) : null}

        <OnbButton type="submit" loading={saving} disabled={saving} className="mt-1">
          Continue
        </OnbButton>
        <button
          type="button"
          onClick={() => router.push("/onboarding/workspace")}
          className="text-sm text-onb-muted hover:text-onb-text"
        >
          Back
        </button>
      </form>
    </WizardShell>
  );
}

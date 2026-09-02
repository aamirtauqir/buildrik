"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Globe, Plus, Palette, UserPlus } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { StateEmpty, LoadingSkeleton, ErrorState, DeniedState } from "@/components/states";
import { Button, InputField, Modal } from "@/components/dashboard/primitives";

interface Branding {
  logoUrl: string | null;
  brandColor: string | null;
  customDomain: string | null;
  hideBuildrik: boolean;
}

// Empty text fields must persist as null (not ""), or the Zod url()/hex checks
// on the update payload reject them.
const orNull = (v: string) => (v.trim() === "" ? null : v.trim());

const badgeNote =
  "The Buildrick badge is removed by upgrading the workspace, not per client — it only ships on the Free plan.";

function BrandingDialog({
  initial,
  saving,
  onClose,
  onSave,
}: {
  initial: Branding;
  saving: boolean;
  onClose: () => void;
  onSave: (b: Branding) => void;
}) {
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl ?? "");
  // Default unset (not Buildrick's red) — a client's brand color is theirs to pick;
  // render falls back to var(--color-primary) until set.
  const [brandColor, setBrandColor] = useState(initial.brandColor ?? "");
  const [customDomain, setCustomDomain] = useState(initial.customDomain ?? "");
  const label = "text-body-sm font-semibold";
  return (
    <Modal
      open={true}
      onClose={onClose}
      title="White-label branding"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => onSave({ logoUrl: orNull(logoUrl), brandColor: orNull(brandColor), customDomain: orNull(customDomain), hideBuildrik: initial.hideBuildrik })}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save branding"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className={label} style={{ color: "var(--color-text-secondary)" }}>Brand color</label>
          <div className="mt-1 flex items-center gap-2">
            <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="h-9 w-12 rounded border" style={{ borderColor: "var(--color-border-default)" }} aria-label="Brand color" />
            <InputField type="text" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} wrapperClassName="flex-1" />
          </div>
        </div>
        <div>
          <label className={label} style={{ color: "var(--color-text-secondary)" }}>Logo URL</label>
          <InputField type="text" value={logoUrl} placeholder="https://…/logo.svg" onChange={(e) => setLogoUrl(e.target.value)} wrapperClassName="mt-1 w-full" />
        </div>
        <div>
          <label className={label} style={{ color: "var(--color-text-secondary)" }}>Custom domain</label>
          <InputField type="text" value={customDomain} placeholder="clients.agency.com" onChange={(e) => setCustomDomain(e.target.value)} wrapperClassName="mt-1 w-full" />
        </div>
        {/* The badge is decided by PLAN, not by this box: the publish worker sets
            `showBadge = plan === "FREE"` and `injectBadge` never reads the client
            row. Honouring `hideBuildrik` would change nothing on PRO/BUSINESS
            (already badge-free) and would let a FREE workspace strip the badge —
            a revenue hole, and a pricing decision rather than a defect fix. So the
            control stops inviting the action instead: disabled, with the reason on
            it. The stored value still round-trips on save, so nothing is lost. */}
        <label
          className="flex items-center gap-2 pt-1 text-body"
          style={{ color: "var(--color-text-muted)" }}
          title={badgeNote}
        >
          <input type="checkbox" checked={initial.hideBuildrik} disabled readOnly className="accent-[var(--color-primary)]" />
          Hide Buildrick branding for this client
        </label>
        <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
          {badgeNote} Logo and custom domain are stored for your records and are
          not published either.
        </p>
      </div>
    </Modal>
  );
}

const STATUS_COLOR: Record<string, string> = {
  PUBLISHED: "var(--color-success)",
  DRAFT: "var(--color-text-muted)",
  ARCHIVED: "#C27803",
};

function SiteRow({ name, status, right }: { name: string; status: string; right: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-between rounded-lg border bg-white px-4 py-3"
      style={{ borderColor: "var(--color-border-default)" }}
    >
      <div className="flex items-center gap-3">
        <Globe className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
        <span className="text-body font-medium" style={{ color: "var(--color-text-primary)" }}>{name}</span>
        <span className="text-body-sm font-medium" style={{ color: STATUS_COLOR[status] ?? "var(--color-text-muted)" }}>
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </span>
      </div>
      {right}
    </div>
  );
}

// Invite a content editor scoped to THIS client. Reuses the workspace invite
// (role EDITOR + siteIds = the client's sites) — so the invitee can edit exactly
// this client's sites, nothing else. No new backend: site-level access already
// flows from the invite's siteIds on accept.
function InviteEditorDialog({
  clientName,
  siteCount,
  saving,
  onClose,
  onSubmit,
}: {
  clientName: string;
  siteCount: number;
  saving: boolean;
  onClose: () => void;
  onSubmit: (email: string, message: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const valid = /.+@.+\..+/.test(email.trim());
  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Invite a content editor"
      width={440}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => valid && onSubmit(email.trim(), message.trim())}
            disabled={!valid || saving || siteCount === 0}
            title={siteCount === 0 ? "Assign at least one site first" : undefined}
          >
            {saving ? "Sending…" : "Send invite"}
          </Button>
        </>
      }
    >
      <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>
        They&apos;ll join as an <strong>Editor</strong> on {clientName}&apos;s{" "}
        {siteCount} {siteCount === 1 ? "site" : "sites"} and nothing else — which
        includes publishing them, unless this workspace requires approval before
        publishing.
      </p>
      <InputField
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="name@client.com"
        wrapperClassName="mt-4 w-full"
        autoFocus
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Add a note (optional)"
        rows={2}
        className="mt-2 w-full rounded-lg border px-3 py-2 text-body"
        style={{ borderColor: "var(--color-border-default)" }}
      />
    </Modal>
  );
}

export function ClientDetailView({ clientId }: { clientId: string }) {
  const { addToast } = useToast();
  const featuresQuery = trpc.features.list.useQuery(undefined, { staleTime: 60_000 });
  const agencyEnabled = featuresQuery.data?.agency_layer ?? false;

  const clientQuery = trpc.clients.get.useQuery({ id: clientId }, { enabled: agencyEnabled, retry: false });
  const sitesQuery = trpc.sites.list.useQuery(
    { clientId, perPage: 50 },
    { enabled: agencyEnabled },
  );
  const [picking, setPicking] = useState(false);
  const [editingBranding, setEditingBranding] = useState(false);
  const [inviting, setInviting] = useState(false);
  const unassignedQuery = trpc.sites.list.useQuery(
    { clientId: null, perPage: 50 },
    { enabled: agencyEnabled && picking },
  );

  const updateMut = trpc.clients.update.useMutation({
    onSuccess: () => {
      addToast("success", "Branding saved");
      setEditingBranding(false);
      clientQuery.refetch();
    },
    onError: (err) => addToast("error", "Couldn't save branding", err.message),
  });

  const inviteMut = trpc.team.invite.useMutation({
    onSuccess: () => {
      addToast("success", "Invite sent");
      setInviting(false);
    },
    onError: (err) => addToast("error", "Couldn't send invite", err.message),
  });

  const assignMut = trpc.clients.assignSite.useMutation({
    onSuccess: () => {
      sitesQuery.refetch();
      clientQuery.refetch();
      unassignedQuery.refetch();
    },
    onError: (err) => addToast("error", "Couldn't update site", err.message),
  });

  if (featuresQuery.isLoading) return <LoadingSkeleton rows={3} variant="list" />;
  if (!agencyEnabled) {
    return (
      <DeniedState
        title="Agency features aren't enabled"
        description="Ask a workspace admin to enable the agency layer."
        action={{ label: "Back to projects", href: "/dashboard/projects" }}
      />
    );
  }
  if (clientQuery.isError) {
    return (
      <ErrorState
        title="Client not found"
        description="It may have been deleted."
        retryLabel="Back to clients"
        onRetry={() => (window.location.href = "/dashboard/agency")}
      />
    );
  }

  const client = clientQuery.data;
  const sites = sitesQuery.data?.data ?? [];
  const unassigned = unassignedQuery.data?.data ?? [];

  return (
    <div>
      <Link
        href="/dashboard/agency"
        className="mb-4 inline-flex items-center gap-1.5 text-body font-medium"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <ArrowLeft className="h-4 w-4" />
        All clients
      </Link>

      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-lg text-base font-semibold text-white"
            style={{ backgroundColor: client?.brandColor ?? "var(--color-primary)" }}
          >
            {(client?.name ?? "··").slice(0, 2).toUpperCase()}
          </span>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
              {client?.name ?? "Client"}
            </h1>
            <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>
              {client?.siteCount ?? 0} {client?.siteCount === 1 ? "site" : "sites"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setEditingBranding(true)} className="gap-1.5">
            <Palette className="h-4 w-4" />
            Branding
          </Button>
          <Button variant="ghost" onClick={() => setInviting(true)} className="gap-1.5">
            <UserPlus className="h-4 w-4" />
            Invite editor
          </Button>
          <Button onClick={() => setPicking(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Assign sites
          </Button>
        </div>
      </header>

      {sitesQuery.isLoading ? (
        <LoadingSkeleton rows={3} variant="list" />
      ) : sitesQuery.isError ? (
        <ErrorState title="Couldn't load sites" onRetry={() => sitesQuery.refetch()} />
      ) : sites.length === 0 ? (
        <StateEmpty
          icon={<Globe className="h-7 w-7" />}
          title="No sites for this client yet"
          description="Assign existing sites to this client to group them here."
          action={{ label: "Assign sites", onClick: () => setPicking(true) }}
        />
      ) : (
        <div className="space-y-2">
          {sites.map((s) => (
            <SiteRow
              key={s.id}
              name={s.name}
              status={s.status}
              right={
                <button
                  onClick={() => assignMut.mutate({ siteId: s.id, clientId: null })}
                  className="text-body-sm font-medium hover:underline"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Remove
                </button>
              }
            />
          ))}
        </div>
      )}

      {inviting && client && (
        <InviteEditorDialog
          clientName={client.name}
          siteCount={sites.length}
          saving={inviteMut.isPending}
          onClose={() => setInviting(false)}
          onSubmit={(email, message) =>
            inviteMut.mutate({
              emails: [email],
              role: "EDITOR",
              siteIds: sites.map((s) => s.id),
              message: message || undefined,
            })
          }
        />
      )}

      {editingBranding && client && (
        <BrandingDialog
          initial={{ logoUrl: client.logoUrl, brandColor: client.brandColor, customDomain: client.customDomain, hideBuildrik: client.hideBuildrik }}
          saving={updateMut.isPending}
          onClose={() => setEditingBranding(false)}
          onSave={(b) => updateMut.mutate({ id: clientId, ...b })}
        />
      )}

      <Modal open={picking} onClose={() => setPicking(false)} title="Assign sites">
        <div className="max-h-[60vh] overflow-y-auto p-3">
          {unassignedQuery.isLoading ? (
            <LoadingSkeleton rows={3} variant="list" />
          ) : unassigned.length === 0 ? (
            <p className="px-2 py-6 text-center text-body" style={{ color: "var(--color-text-secondary)" }}>
              No unassigned sites. Every site already belongs to a client.
            </p>
          ) : (
            <div className="space-y-2">
              {unassigned.map((s) => (
                <SiteRow
                  key={s.id}
                  name={s.name}
                  status={s.status}
                  right={
                    <Button size="sm" onClick={() => assignMut.mutate({ siteId: s.id, clientId })}>
                      Assign
                    </Button>
                  }
                />
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

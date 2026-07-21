"use client";

import { useState } from "react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { WorkspaceForm } from "@/components/settings/workspace-form";
import { AgencyLayerToggle } from "@/components/settings/agency-layer-toggle";
import { SectionCard, Button, InputField } from "@/components/dashboard/primitives";
import { ErrorState } from "@/components/states";

/** Settings index = the Workspace section (IA v2 D6 card mapping). Carries
 *  workspace name + branding + sharing (WorkspaceForm) and the transfer-ownership
 *  control. Workspace deletion lives on the Danger page (workspace scope); the
 *  settings layout owns the section PageHeader. */
export default function WorkspaceSettingsPage() {
  const { addToast } = useToast();
  const [transferEmail, setTransferEmail] = useState("");
  const wsQuery = trpc.account.workspace.get.useQuery();
  const pendingTransferQuery = trpc.account.workspace.transfer.pending.useQuery();

  const initiateTransferMutation = trpc.account.workspace.transfer.initiate.useMutation({
    onSuccess: () => {
      setTransferEmail("");
      pendingTransferQuery.refetch();
      addToast("success", "Transfer invitation sent — the new owner must accept it by email");
    },
    onError: (err) => addToast("error", "Couldn't start transfer", err.message),
  });

  const cancelTransferMutation = trpc.account.workspace.transfer.cancel.useMutation({
    onSuccess: () => { pendingTransferQuery.refetch(); addToast("success", "Transfer cancelled"); },
    onError: (err) => addToast("error", "Couldn't cancel transfer", err.message),
  });

  const updateMutation = trpc.account.workspace.update.useMutation({
    onSuccess: () => { wsQuery.refetch(); addToast("success", "Workspace updated"); },
    onError: (err) => addToast("error", "Failed", err.message),
  });

  const sharingMutation = trpc.account.workspace.sharing.useMutation({
    onSuccess: () => { wsQuery.refetch(); addToast("success", "Sharing settings updated"); },
    onError: (err) => addToast("error", "Failed", err.message),
  });

  if (wsQuery.isLoading) return <div className="h-64 animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-bg-subtle)" }} />;
  if (!wsQuery.data) return <ErrorState title="Couldn't load workspace settings" onRetry={() => wsQuery.refetch()} />;

  const ws = wsQuery.data;

  return (
    <div className="space-y-8">
      <WorkspaceForm
        initialData={{
          name: ws.name ?? undefined,
          slug: ws.slug ?? undefined,
          defaultLanguage: ws.defaultLanguage ?? undefined,
          timezone: ws.timezone ?? undefined,
          iconUrl: ws.iconUrl,
          accentColor: ws.accentColor ?? undefined,
          editsRequireApproval: ws.editsRequireApproval ?? false,
          defaultExpiration: ws.sharingSettings?.defaultExpiration ?? null,
          requirePw: ws.sharingSettings?.requirePw ?? false,
          allowEditors: ws.sharingSettings?.allowEditors ?? false,
          notify: ws.sharingSettings?.notify ?? true,
        }}
        onSave={(data) => updateMutation.mutate(data)}
        onSaveSharing={(data) => sharingMutation.mutate(data)}
        saving={updateMutation.isPending || sharingMutation.isPending}
      />

      <AgencyLayerToggle />

      <SectionCard title="Transfer ownership">
        <p className="text-body-sm mb-3" style={{ color: "var(--color-text-secondary)" }}>
          Hand this workspace to another person. They&apos;ll get an email invitation and become the owner once they accept; you stay on as a member.
        </p>

        {pendingTransferQuery.data ? (
          <div
            className="rounded-lg border p-4 flex items-center justify-between"
            style={{ borderColor: "var(--color-border-default)" }}
          >
            <div>
              <p className="text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
                Transfer pending to {pendingTransferQuery.data.toEmail}
              </p>
              <p className="text-body-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                Waiting for them to accept the email invitation.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => cancelTransferMutation.mutate()}
              disabled={cancelTransferMutation.isPending}
            >
              {cancelTransferMutation.isPending ? "Cancelling…" : "Cancel transfer"}
            </Button>
          </div>
        ) : (
          <form
            className="flex items-end gap-2 max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              const email = transferEmail.trim().toLowerCase();
              if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
                addToast("error", "Enter a valid email address");
                return;
              }
              initiateTransferMutation.mutate({ toEmail: email });
            }}
          >
            <div className="flex-1">
              <label className="block text-body font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
                New owner&apos;s email
              </label>
              <InputField
                type="email"
                value={transferEmail}
                onChange={(e) => setTransferEmail(e.target.value)}
                required
                placeholder="owner@example.com"
              />
            </div>
            <Button type="submit" disabled={initiateTransferMutation.isPending} className="whitespace-nowrap">
              {initiateTransferMutation.isPending ? "Sending…" : "Transfer"}
            </Button>
          </form>
        )}
      </SectionCard>
    </div>
  );
}

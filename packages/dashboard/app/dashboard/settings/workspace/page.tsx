"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { WorkspaceForm } from "@/components/settings/workspace-form";

function DeleteWorkspaceModal({
  workspaceName,
  onConfirm,
  onClose,
  deleting,
}: {
  workspaceName: string;
  onConfirm: () => void;
  onClose: () => void;
  deleting: boolean;
}) {
  const [confirmText, setConfirmText] = useState("");
  const matches = confirmText === workspaceName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-xl p-6 shadow-xl"
        style={{ backgroundColor: "#fff" }}
      >
        <h3 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Delete workspace
        </h3>
        <p className="text-sm mt-2" style={{ color: "var(--color-text-secondary)" }}>
          This action is permanent and cannot be undone. All sites, forms, members, and data in this workspace will be deleted.
        </p>

        <div
          className="mt-4 rounded-lg p-3 text-sm"
          style={{ backgroundColor: "#fef2f2", color: "#991b1b" }}
        >
          If this workspace has an active subscription, it will be cancelled immediately.
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
            Type <span className="font-semibold">{workspaceName}</span> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={workspaceName}
            className="w-full px-3 py-2 text-sm rounded-md border outline-none"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!matches || deleting}
            className="px-4 py-2 text-sm font-medium rounded-md text-white disabled:opacity-60"
            style={{ backgroundColor: "#dc2626" }}
          >
            {deleting ? "Deleting\u2026" : "Delete workspace"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  const { addToast } = useToast();
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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

  // Wire the real delete mutation (was a fake "Not yet available" toast). The
  // server validates the typed name + owner-only; on success we leave the
  // (now-gone) workspace and return to the dashboard.
  const deleteMutation = trpc.account.workspace.delete.useMutation({
    onSuccess: () => {
      addToast("success", "Workspace deleted");
      setShowDeleteModal(false);
      router.push("/dashboard");
      router.refresh();
    },
    onError: (err) => addToast("error", "Could not delete workspace", err.message),
  });

  const sharingMutation = trpc.account.workspace.sharing.useMutation({
    onSuccess: () => { wsQuery.refetch(); addToast("success", "Sharing settings updated"); },
    onError: (err) => addToast("error", "Failed", err.message),
  });

  if (wsQuery.isLoading) return <div className="h-64 animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-bg-subtle)" }} />;
  if (!wsQuery.data) return null;

  const ws = wsQuery.data;
  const workspaceName = ws.name ?? "";

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
          defaultExpiration: ws.sharingSettings?.defaultExpiration ?? null,
          requirePw: ws.sharingSettings?.requirePw ?? false,
          allowEditors: ws.sharingSettings?.allowEditors ?? false,
          notify: ws.sharingSettings?.notify ?? true,
        }}
        onSave={(data) => updateMutation.mutate(data)}
        onSaveSharing={(data) => sharingMutation.mutate(data)}
        saving={updateMutation.isPending || sharingMutation.isPending}
      />

      <div style={{ borderTop: "1px solid var(--color-border-default)" }} />

      <div>
        <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Transfer ownership
        </h2>
        <p className="text-sm mt-1 mb-3" style={{ color: "var(--color-text-secondary)" }}>
          Hand this workspace to another person. They&apos;ll get an email invitation and become the owner once they accept; you stay on as a member.
        </p>

        {pendingTransferQuery.data ? (
          <div
            className="rounded-lg border p-4 flex items-center justify-between"
            style={{ borderColor: "var(--color-border-default)" }}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                Transfer pending to {pendingTransferQuery.data.toEmail}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                Waiting for them to accept the email invitation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => cancelTransferMutation.mutate()}
              disabled={cancelTransferMutation.isPending}
              className="text-sm px-3 py-2 rounded-md border disabled:opacity-60"
              style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
            >
              {cancelTransferMutation.isPending ? "Cancelling…" : "Cancel transfer"}
            </button>
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
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
                New owner&apos;s email
              </label>
              <input
                type="email"
                value={transferEmail}
                onChange={(e) => setTransferEmail(e.target.value)}
                required
                placeholder="owner@example.com"
                className="w-full px-3 py-2 text-sm rounded-md border outline-none"
                style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
              />
            </div>
            <button
              type="submit"
              disabled={initiateTransferMutation.isPending}
              className="px-4 py-2 text-sm font-medium rounded-md text-white disabled:opacity-60 whitespace-nowrap"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {initiateTransferMutation.isPending ? "Sending…" : "Transfer"}
            </button>
          </form>
        )}
      </div>

      <div style={{ borderTop: "1px solid var(--color-border-default)" }} />

      <div>
        <h2 className="text-base font-semibold" style={{ color: "#dc2626" }}>
          Danger zone
        </h2>
        <div
          className="mt-3 rounded-lg border p-4 flex items-center justify-between"
          style={{ borderColor: "#fecaca" }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Delete workspace
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
              Permanently delete this workspace and all its data. This cannot be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="text-sm font-medium px-4 py-2 rounded-md border"
            style={{ borderColor: "#dc2626", color: "#dc2626" }}
          >
            Delete workspace
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteWorkspaceModal
          workspaceName={workspaceName}
          onConfirm={() => deleteMutation.mutate({ confirmName: workspaceName })}
          onClose={() => setShowDeleteModal(false)}
          deleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}

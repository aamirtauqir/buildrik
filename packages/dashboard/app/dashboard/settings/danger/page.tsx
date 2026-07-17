"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { DangerZoneTab } from "@/components/settings/danger-zone-tab";
import { DeleteWorkspaceModal } from "@/components/settings/delete-workspace-modal";

/** Danger zone (IA v2 D6): two clearly-labeled scopes — the workspace
 *  (delete workspace) and your account (export data / delete account). The
 *  settings layout owns the section header. */
export default function DangerZonePage() {
  const { addToast } = useToast();
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const wsQuery = trpc.account.workspace.get.useQuery();
  const wsDelete = trpc.account.workspace.delete.useMutation({
    onSuccess: () => {
      addToast("success", "Workspace deleted");
      setShowDeleteModal(false);
      router.push("/dashboard");
      router.refresh();
    },
    onError: (err) => addToast("error", "Could not delete workspace", err.message),
  });

  const exportMutation = trpc.account.dangerZone.exportData.useMutation({
    onSuccess: () => addToast("success", "Data export started. You'll be notified when ready."),
    onError: (err) => addToast("error", "Export failed", err.message),
  });

  const deleteMutation = trpc.account.dangerZone.deleteAccount.useMutation({
    onSuccess: () => addToast("info", "Account deletion scheduled. You have 30 days to cancel."),
    onError: (err) => addToast("error", "Failed", err.message),
  });

  const workspaceName = wsQuery.data?.name ?? "";

  return (
    <div className="space-y-10">
      {/* Workspace scope */}
      <section>
        <h2 className="text-base font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
          Workspace
        </h2>
        <p className="text-body mb-4" style={{ color: "var(--color-text-secondary)" }}>
          Destructive actions scoped to this workspace.
        </p>
        <div
          className="rounded-lg border p-4 flex items-center justify-between"
          style={{ borderColor: "var(--color-error)" }}
        >
          <div>
            <p className="text-body font-semibold" style={{ color: "var(--color-error)" }}>
              Delete workspace
            </p>
            <p className="text-body-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
              Permanently delete this workspace and all its data. This cannot be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            disabled={!wsQuery.data}
            className="text-body font-medium px-4 py-2 rounded-md border shrink-0 disabled:opacity-60"
            style={{ borderColor: "var(--color-error)", color: "var(--color-error)" }}
          >
            Delete workspace
          </button>
        </div>
      </section>

      <div style={{ borderTop: "1px solid var(--color-border-default)" }} />

      {/* Account scope */}
      <section>
        <h2 className="text-base font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
          Your account
        </h2>
        <p className="text-body mb-4" style={{ color: "var(--color-text-secondary)" }}>
          Destructive actions scoped to your personal account.
        </p>
        <DangerZoneTab
          onExport={() => exportMutation.mutate()}
          onDelete={(reason) => deleteMutation.mutate({ reason })}
          isExporting={exportMutation.isPending}
          estimatedSize="~2 MB"
        />
      </section>

      {showDeleteModal && (
        <DeleteWorkspaceModal
          workspaceName={workspaceName}
          onConfirm={() => wsDelete.mutate({ confirmName: workspaceName })}
          onClose={() => setShowDeleteModal(false)}
          deleting={wsDelete.isPending}
        />
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
  const { data: session } = useSession();
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

  // Eligibility drives the warning block + disabled state in DangerZoneTab —
  // the props existed but were never passed, so the guard block never rendered.
  const eligibilityQuery = trpc.account.dangerZone.deletionEligibility.useQuery();

  // Synchronous export → download JSON. Replaces the old mutation that created a
  // job nobody processed while the UI claimed "you'll be notified when ready".
  const utils = trpc.useUtils();
  const [isExporting, setIsExporting] = useState(false);
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await utils.account.dangerZone.exportData.fetch();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `buildrick-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast("success", "Your data has been downloaded");
    } catch (err) {
      addToast("error", "Export failed", err instanceof Error ? err.message : "Try again");
    } finally {
      setIsExporting(false);
    }
  };

  const deleteMutation = trpc.account.dangerZone.deleteAccount.useMutation({
    onSuccess: () => addToast("info", "Account deletion scheduled. You have 30 days to cancel."),
    onError: (err) => addToast("error", "Failed", err.message),
  });

  const workspaceName = wsQuery.data?.name ?? "";

  // `account.workspace.delete` is OWNER-only and answers 403 "Only the owner can
  // delete". The button's only guard used to be `!wsQuery.data` — "has the
  // workspace loaded", not "may you delete it" — so a Designer, Editor or Viewer
  // got the enabled red button, the modal listing everything that would be
  // destroyed, typed the workspace name exactly as asked, and was refused only
  // after finishing the confirmation ritual. Ask the same question the server asks.
  const isWorkspaceOwner = !!wsQuery.data && wsQuery.data.ownerId === session?.user?.id;

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
              {isWorkspaceOwner
                ? "Permanently delete this workspace and all its data. This cannot be undone."
                : "Only the workspace owner can delete this workspace."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            disabled={!isWorkspaceOwner}
            title={!isWorkspaceOwner && wsQuery.data ? "Only the workspace owner can delete this workspace." : undefined}
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
          onExport={handleExport}
          onDelete={(reason) => deleteMutation.mutate({ reason })}
          isExporting={isExporting}
          estimatedSize="~2 MB"
          isSoleOwner={eligibilityQuery.data?.isSoleOwner}
          hasActiveSubscription={eligibilityQuery.data?.hasActiveSubscription}
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

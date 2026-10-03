"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { DangerZoneTab } from "@/components/settings/danger-zone-tab";
import { DeleteWorkspaceModal } from "@/components/settings/delete-workspace-modal";
import { SectionCard, Button, InputField } from "@/components/dashboard/primitives";

/** Danger zone (IA v2 D6; Phase B §25 adds Transfer ownership): two clearly-labeled scopes — the workspace
 *  (delete workspace) and your account (export data / delete account). The
 *  settings layout owns the section header. */
export default function DangerZonePage() {
  const { addToast } = useToast();
  const router = useRouter();
  const { data: session } = useSession();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const utils = trpc.useUtils();
  const wsQuery = trpc.account.workspace.get.useQuery();
  // Deletion is only SCHEDULED (30-day grace). Invalidate the query the Home
  // banner reads, or the banner shows only after a reload.
  const wsDelete = trpc.account.workspace.delete.useMutation({
    onSuccess: ({ scheduledAt }) => {
      void utils.account.workspace.get.invalidate();
      addToast(
        "success",
        "Workspace scheduled for deletion",
        `It will be deleted on ${new Date(scheduledAt).toLocaleDateString()}. You can cancel from the home page.`,
      );
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
        <h2 className="text-section-title mb-1" style={{ color: "var(--color-text-primary)" }}>
          Workspace
        </h2>
        <p className="text-body mb-4" style={{ color: "var(--color-text-secondary)" }}>
          Destructive actions scoped to this workspace.
        </p>
        <div className="mb-4">
          <TransferOwnershipCard />
        </div>
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
                ? "Permanently delete this workspace and all its data. You can cancel within 30 days."
                : "Only the workspace owner can delete this workspace."}
            </p>
          </div>
          {/* No `title`. The reason is the <p> directly to the left, which
              already says "Only the workspace owner can delete this workspace."
              when the user is not the owner — a hover-only tooltip repeating
              visible copy helps nobody and reaches no keyboard user. */}
          <span className="shrink-0">
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            disabled={!isWorkspaceOwner}
            /* Kept hand-rolled: the DS has no outline-danger variant and this
               is its only consumer, so adding one would be a variant with a
               single call site. Aligned to the Button shape instead — it was
               rounded-md (6px) and ~38px against the DS 8px / 40px. */
            className="h-10 rounded-lg border px-4 text-body font-medium disabled:opacity-60"
            style={{ borderColor: "var(--color-error)", color: "var(--color-error)" }}
          >
            Delete workspace
          </button>
          </span>
        </div>
      </section>

      <div style={{ borderTop: "1px solid var(--color-border-default)" }} />

      {/* Account scope */}
      <section>
        <h2 className="text-section-title mb-1" style={{ color: "var(--color-text-primary)" }}>
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

/** Transfer ownership (moved here from Workspace & branding, Phase B §25): hand
 *  the workspace to another person by email; they become owner on accepting. */
function TransferOwnershipCard() {
  const { addToast } = useToast();
  const [transferEmail, setTransferEmail] = useState("");
  const transferEmailId = useId();
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

  return (
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
            <label htmlFor={transferEmailId} className="block text-body font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
              New owner&apos;s email
            </label>
            <InputField
              id={transferEmailId}
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
  );
}

"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
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
        <h3 className="text-lg font-semibold" style={{ color: "#0D0D0D" }}>
          Delete workspace
        </h3>
        <p className="text-sm mt-2" style={{ color: "#7A7A7A" }}>
          This action is permanent and cannot be undone. All sites, forms, members, and data in this workspace will be deleted.
        </p>

        <div
          className="mt-4 rounded-lg p-3 text-sm"
          style={{ backgroundColor: "#fef2f2", color: "#991b1b" }}
        >
          If this workspace has an active subscription, it will be cancelled immediately.
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1" style={{ color: "#0D0D0D" }}>
            Type <span className="font-semibold">{workspaceName}</span> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={workspaceName}
            className="w-full px-3 py-2 text-sm rounded-md border outline-none"
            style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border"
            style={{ borderColor: "#E8E8E8", color: "#7A7A7A" }}
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const wsQuery = trpc.account.workspace.get.useQuery();

  const updateMutation = trpc.account.workspace.update.useMutation({
    onSuccess: () => { wsQuery.refetch(); addToast("success", "Workspace updated"); },
    onError: (err) => addToast("error", "Failed", err.message),
  });

  const sharingMutation = trpc.account.workspace.sharing.useMutation({
    onSuccess: () => { wsQuery.refetch(); addToast("success", "Sharing settings updated"); },
    onError: (err) => addToast("error", "Failed", err.message),
  });

  if (wsQuery.isLoading) return <div className="h-64 animate-pulse rounded-xl" style={{ backgroundColor: "#F4F4F4" }} />;
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

      <div style={{ borderTop: "1px solid #E8E8E8" }} />

      <div>
        <h2 className="text-base font-semibold" style={{ color: "#dc2626" }}>
          Danger zone
        </h2>
        <div
          className="mt-3 rounded-lg border p-4 flex items-center justify-between"
          style={{ borderColor: "#fecaca" }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: "#0D0D0D" }}>
              Delete workspace
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#7A7A7A" }}>
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
          onConfirm={() => {
            addToast("error", "Not yet available", "Workspace deletion will be available soon.");
            setShowDeleteModal(false);
          }}
          onClose={() => setShowDeleteModal(false)}
          deleting={false}
        />
      )}
    </div>
  );
}

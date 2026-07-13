"use client";

import { useState } from "react";

/** Confirm-by-typing modal for irreversible workspace deletion. Shared by the
 *  consolidated settings page and the /settings/workspace sub-route so the
 *  confirm logic lives in one place. */
export function DeleteWorkspaceModal({
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
        className="relative w-full max-w-md rounded-xl p-6 shadow-card"
        style={{ backgroundColor: "var(--color-bg-surface)" }}
      >
        <h3 className="text-section-title" style={{ color: "var(--color-text-primary)" }}>
          Delete workspace
        </h3>
        <p className="text-body-sm mt-2" style={{ color: "var(--color-text-secondary)" }}>
          This action is permanent and cannot be undone. All sites, forms, members, and data in this workspace will be deleted.
        </p>

        <div
          className="mt-4 rounded-lg p-3 text-body-sm"
          style={{ backgroundColor: "var(--color-error-subtle)", color: "var(--color-error)" }}
        >
          If this workspace has an active subscription, it will be cancelled immediately.
        </div>

        <div className="mt-4">
          <label className="block text-body-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
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
            style={{ backgroundColor: "var(--color-error)" }}
          >
            {deleting ? "Deleting…" : "Delete workspace"}
          </button>
        </div>
      </div>
    </div>
  );
}

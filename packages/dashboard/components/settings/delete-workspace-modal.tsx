"use client";

import { useState } from "react";
import { Button, Modal } from "@/components/dashboard/primitives";

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
    <Modal
      open={true}
      onClose={onClose}
      title="Delete workspace"
      width={448}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} disabled={!matches || deleting}>
            {deleting ? "Deleting…" : "Delete workspace"}
          </Button>
        </>
      }
    >
      <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
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
    </Modal>
  );
}

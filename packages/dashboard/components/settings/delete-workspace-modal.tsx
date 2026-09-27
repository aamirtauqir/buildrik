"use client";

import { useId, useState } from "react";
import { Button, InputField, Modal } from "@/components/dashboard/primitives";

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
  const confirmId = useId();
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
        Your workspace will be deleted 30 days from now. Until then you can cancel from the dashboard home page.
      </p>

      <div
        className="mt-4 rounded-lg p-3 text-body-sm"
        style={{ backgroundColor: "var(--color-error-subtle)", color: "var(--color-error)" }}
      >
        On that date every site is taken offline, the subscription is cancelled, and all sites, forms, members and data are removed for good.
      </div>

      <div className="mt-4">
        <label htmlFor={confirmId} className="block text-body-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
          Type <span className="font-semibold">{workspaceName}</span> to confirm
        </label>
        <InputField
          id={confirmId}
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={workspaceName}
          autoFocus
        />
      </div>
    </Modal>
  );
}

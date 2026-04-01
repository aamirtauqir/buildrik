/**
 * Delete Confirmation Modal
 * Extracted from ProInspector.tsx for 500-line compliance.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Modal } from "../../../shared/ui/Modal";

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  elementLabel: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  elementLabel,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Delete Element" size="sm">
    <div style={{ padding: "var(--aqb-space-4)" }}>
      <p
        role="alert"
        style={{
          margin: "0 0 var(--aqb-space-4)",
          color: "var(--aqb-text-secondary)",
          fontSize: "var(--aqb-text-md)",
          lineHeight: 1.5,
        }}
      >
        Delete <strong>{elementLabel}</strong>? You can undo this with{" "}
        <kbd style={{ fontFamily: "var(--aqb-font-mono)", fontSize: "0.9em" }}>Ctrl+Z</kbd>.
      </p>
      <div style={{ display: "flex", gap: "var(--aqb-space-3)", justifyContent: "flex-end" }}>
        <button
          onClick={onClose}
          style={{
            padding: "8px 16px",
            background: "var(--aqb-surface-4)",
            border: "1px solid var(--aqb-border)",
            borderRadius: "var(--aqb-radius-md)",
            color: "var(--aqb-text-primary)",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          style={{
            padding: "8px 16px",
            background: "var(--aqb-error)",
            border: "none",
            borderRadius: "var(--aqb-radius-md)",
            color: "white",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Delete
        </button>
      </div>
    </div>
  </Modal>
);

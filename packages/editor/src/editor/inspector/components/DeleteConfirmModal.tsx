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
    <div style={{ padding: "var(--buildrick-design-space-4)" }}>
      <p
        role="alert"
        style={{
          margin: "0 0 var(--buildrick-design-space-4)",
          color: "var(--buildrick-text-secondary)",
          fontSize: "var(--buildrick-text-md)",
          lineHeight: 1.5,
        }}
      >
        Delete <strong>{elementLabel}</strong>? You can undo this with{" "}
        <kbd style={{ fontFamily: "var(--buildrick-design-font-mono)", fontSize: "0.9em" }}>Ctrl+Z</kbd>.
      </p>
      <div style={{ display: "flex", gap: "var(--buildrick-design-space-3)", justifyContent: "flex-end" }}>
        <button
          onClick={onClose}
          style={{
            padding: "8px 16px",
            background: "var(--buildrick-surface-4)",
            border: "1px solid var(--buildrick-border)",
            borderRadius: "var(--buildrick-design-radius-md)",
            color: "var(--buildrick-text-primary)",
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
            background: "var(--buildrick-error)",
            border: "none",
            borderRadius: "var(--buildrick-design-radius-md)",
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

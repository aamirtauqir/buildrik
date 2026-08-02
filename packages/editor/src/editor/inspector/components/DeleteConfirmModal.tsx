/**
 * Delete Confirmation Modal
 * Extracted from ProInspector.tsx for 500-line compliance.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, Kbd, ModalBody, ModalClose, ModalContent, ModalRoot, ModalTitle } from "@/editor/chrome-ui";

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
  <ModalRoot open={isOpen} onOpenChange={(next) => !next && onClose()}>
    <ModalContent size="lg">
      <ModalTitle>Delete Element</ModalTitle>
      <ModalClose aria-label="Close modal">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </ModalClose>
      <ModalBody>
        <div style={{ padding: "var(--bk-space-16)" }}>
    <p
      role="alert"
      style={{
        margin: "0 0 var(--bk-space-16)",
        color: "var(--bk-ink-soft)",
        fontSize: "var(--bk-text-13)",
        lineHeight: 1.5,
      }}
    >
      Delete <strong>{elementLabel}</strong>? You can undo this with{" "}
      <Kbd style={{ fontFamily: "var(--bk-font-mono)", fontSize: "0.9em" }}>Ctrl+Z</Kbd>.
    </p>
    <div style={{ display: "flex", gap: "var(--bk-space-12)", justifyContent: "flex-end" }}>
      <Button
        onClick={onClose}
        style={{
          padding: "8px 16px",
          background: "var(--bk-gray-200)",
          border: "1px solid var(--bk-border)",
          borderRadius: "var(--bk-radius-lg)",
          color: "var(--bk-ink)",
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        style={{
          padding: "8px 16px",
          background: "var(--bk-error)",
          border: "none",
          borderRadius: "var(--bk-radius-lg)",
          color: "white",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Delete
      </Button>
    </div>
  </div>
      </ModalBody>
    </ModalContent>
  </ModalRoot>
);

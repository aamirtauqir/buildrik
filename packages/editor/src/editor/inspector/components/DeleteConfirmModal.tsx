import { Kbd } from "@/editor/shared/vibcoder/Kbd";
import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * Delete Confirmation Modal
 * Extracted from ProInspector.tsx for 500-line compliance.
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  Modal,
  ModalContent,
  ModalTitle,
  ModalClose,
  OverlayMount,
} from "@/editor/shared/vibcoder";

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
  <OverlayMount>
    <Modal open={isOpen} onOpenChange={(next) => !next && onClose()}>
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
        <div className="bd-modal__body">
          <div style={{ padding: "var(--buildrick-space-4)" }}>
      <p
        role="alert"
        style={{
          margin: "0 0 var(--buildrick-space-4)",
          color: "var(--buildrick-text-secondary)",
          fontSize: "var(--buildrick-text-md)",
          lineHeight: 1.5,
        }}
      >
        Delete <strong>{elementLabel}</strong>? You can undo this with{" "}
        <Kbd style={{ fontFamily: "var(--buildrick-font-family-mono)", fontSize: "0.9em" }}>Ctrl+Z</Kbd>.
      </p>
      <div style={{ display: "flex", gap: "var(--buildrick-space-3)", justifyContent: "flex-end" }}>
        <Button
          onClick={onClose}
          style={{
            padding: "8px 16px",
            background: "var(--buildrick-surface-4)",
            border: "1px solid var(--buildrick-border)",
            borderRadius: "var(--buildrick-radius-md)",
            color: "var(--buildrick-text-primary)",
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
            background: "var(--buildrick-error)",
            border: "none",
            borderRadius: "var(--buildrick-radius-md)",
            color: "white",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Delete
        </Button>
      </div>
    </div>
        </div>
      </ModalContent>
    </Modal>
  </OverlayMount>
);

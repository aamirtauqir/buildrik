/**
 * DetachConfirmModal — confirmation modal for detaching a component instance
 * from its master. Shows instance label, master name + total instance count
 * meta strip, and 4 bullet rows explaining the consequences.
 *
 * Used by ComponentDetailScreen before invoking detachInstance.
 *
 * Matches prototype-v3 s15 (component-library detach flow).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { ModalClose, ModalContent, ModalRoot, ModalTitle, Button } from "@/editor/chrome-ui";

export interface DetachConfirmModalProps {
  /** Label for the instance being detached, e.g. "#3". */
  instanceLabel: string;
  /** Display name of the master component. */
  masterName: string;
  /** Total instance count for the master (singular/plural in meta strip). */
  masterInstanceCount: number;
  /** Cancel handler — close without detaching. */
  onCancel: () => void;
  /** Confirm handler — proceed with detach. */
  onConfirm: () => void;
}

const metaStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--bk-ink-muted)",
  margin: "0 0 12px 0",
};

const bulletsStyle: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
};

const bulletItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  padding: "6px 0",
  fontSize: 12,
  color: "var(--bk-ink-soft)",
};

const bulletIconStyle: React.CSSProperties = {
  flex: "0 0 auto",
  fontWeight: 600,
  lineHeight: 1.4,
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 16,
  justifyContent: "flex-end",
};

const BULLETS: ReadonlyArray<{ icon: string; color: string; text: string }> = [
  {
    icon: "✓",
    color: "var(--bk-success-text)",
    text: "Current resolved bindings will be snapshotted",
  },
  {
    icon: "✓",
    color: "var(--bk-success-text)",
    text: "This instance becomes free-form (edit anything)",
  },
  {
    icon: "⚠",
    color: "var(--bk-warning-text)",
    text: "Master edits will no longer affect this instance",
  },
  {
    icon: "↩",
    color: "var(--bk-accent-text)",
    text: "Undo restores the link (Cmd+Z)",
  },
];

export function DetachConfirmModal({
  instanceLabel,
  masterName,
  masterInstanceCount,
  onCancel,
  onConfirm,
}: DetachConfirmModalProps) {
  const instancesLabel =
    masterInstanceCount === 1 ? "1 instance" : `${masterInstanceCount} instances`;

  return (
    <ModalRoot
      open
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <ModalContent size="lg">
        <ModalTitle>Detach instance {instanceLabel} from master?</ModalTitle>
        <ModalClose aria-label="Close modal" onClick={onCancel}>
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
          <p style={metaStyle}>
            Master: {masterName} &middot; {instancesLabel} total
          </p>
          <ul style={bulletsStyle}>
            {BULLETS.map((b, i) => (
              <li key={i} style={bulletItemStyle}>
                <span
                  style={{ ...bulletIconStyle, color: b.color }}
                  aria-hidden="true"
                >
                  {b.icon}
                </span>
                <span>{b.text}</span>
              </li>
            ))}
          </ul>
          <div style={footerStyle}>
            <Button color="light" onClick={onCancel} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
              Cancel
            </Button>
            <Button onClick={onConfirm}>
              Detach
            </Button>
          </div>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}

export default DetachConfirmModal;

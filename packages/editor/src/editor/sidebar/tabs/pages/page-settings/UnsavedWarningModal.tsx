/**
 * @lint-hex-policy: component-theme
 *   Intentional component-specific palette (error boundary / overlay / preview
 *   frame / warm neutral / onboarding theme). Chrome-hex lint rules do not apply.
 *
 * UnsavedWarningModal — Confirms tab switch with unsaved changes.
 * Form atoms (action buttons) use ROW_MD from layout constants + radius-sm
 * token per Chrome Axiom A1.3 (form atoms exempt for radius scale).
 *
 * Three actions:
 * - "Save & Switch": persists current tab state, then confirms navigation
 * - "Discard": reverts current tab state, then confirms navigation
 * - "Cancel": closes modal, stays on current tab
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Modal } from "@shared/ui/Modal";
import { ROW_MD } from "@shared/constants/layout";

interface Props {
  isOpen: boolean;
  pendingTab: string;
  onSaveAndSwitch: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export const UnsavedWarningModal: React.FC<Props> = ({
  isOpen,
  pendingTab,
  onSaveAndSwitch,
  onDiscard,
  onCancel,
}) => {
  const discardRef = React.useRef<HTMLButtonElement>(null);

  const tabLabel = pendingTab === "social" ? "Social" : pendingTab === "advanced" ? "Advanced" : "SEO";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      size="sm"
      closeOnOverlay
      closeOnEscape
      showCloseButton={false}
      initialFocusRef={discardRef}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {/* Title */}
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#F5F5F0",
            marginBottom: 8,
            letterSpacing: "-0.01em",
          }}
        >
          Unsaved changes
        </div>

        {/* Message */}
        <div
          style={{
            fontSize: 13,
            color: "#A09D96",
            lineHeight: 1.5,
            marginBottom: 20,
          }}
        >
          You have unsaved changes in{" "}
          <span style={{ color: "#F5F5F0", fontWeight: 500 }}>{tabLabel}</span> tab.
          What would you like to do?
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <button
            ref={discardRef}
            onClick={onDiscard}
            style={discardBtn}
            aria-label="Discard changes and switch tab"
          >
            Discard
          </button>
          <button
            onClick={onCancel}
            style={cancelBtn}
            aria-label="Cancel and stay on current tab"
          >
            Cancel
          </button>
          <button
            onClick={onSaveAndSwitch}
            style={saveBtn}
            aria-label="Save changes and switch tab"
          >
            Save &amp; Switch
          </button>
        </div>
      </div>
    </Modal>
  );
};

const discardBtn: React.CSSProperties = {
  height: ROW_MD,
  padding: "0 12px",
  borderRadius: "var(--buildrick-radius-sm)",
  border: "1px solid rgba(239,68,68,0.25)",
  background: "rgba(239,68,68,0.1)",
  color: "#f5a3a3",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "inherit",
  transition: "background 0.1s",
};

const cancelBtn: React.CSSProperties = {
  height: ROW_MD,
  padding: "0 12px",
  borderRadius: "var(--buildrick-radius-sm)",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.06)",
  color: "#A09D96",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "inherit",
  transition: "background 0.1s",
};

const saveBtn: React.CSSProperties = {
  height: ROW_MD,
  padding: "0 12px",
  borderRadius: "var(--buildrick-radius-sm)",
  border: "none",
  background: "#2D6DFF",
  color: "var(--buildrick-text-on-accent)",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
  transition: "background 0.1s",
};

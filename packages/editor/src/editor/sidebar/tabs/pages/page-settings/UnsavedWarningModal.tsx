/**
 * UnsavedWarningModal — confirms tab switch with unsaved changes.
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
import { ModalContent as VibcoderModalContent, ModalRoot, ModalTitle } from "@/editor/chrome-ui";
import { ROW_MD } from "@shared/constants/layout";
import { Button } from "@/editor/chrome-ui";
// Phase 5 escape: Radix.Dialog.Content props (onOpenAutoFocus) are hidden
// from vibcoder's public ModalContentProps per Contract E2 (no Radix types
// leaked). Vibcoder's ModalContent still spreads these to Radix at runtime.
// Cast bypasses the narrowed type without changing behavior.
type ModalContentEscapeProps = {
  size?: "lg" | "xl";
  onOpenAutoFocus?: (e: { preventDefault: () => void }) => void;
  children: React.ReactNode;
};
const ModalContent =
  VibcoderModalContent as unknown as React.ComponentType<ModalContentEscapeProps>;

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
    <ModalRoot open={isOpen} onOpenChange={(next) => !next && onCancel()}>
      <ModalContent
        size="lg"
        onOpenAutoFocus={(e) => {
          if (discardRef.current) {
            e.preventDefault();
            discardRef.current.focus();
          }
        }}
      >
        <div className="bd-modal__body">
          <div className="tw:flex tw:flex-col tw:gap-1">
            {/* Title */}
            <ModalTitle
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--bk-ink)",
                margin: "0 0 8px",
                letterSpacing: "-0.01em",
              }}
            >
              Unsaved changes
            </ModalTitle>

            {/* Message */}
            <div
              style={{
                fontSize: 13,
                color: "var(--bk-ink-muted)",
                lineHeight: 1.5,
                marginBottom: 20,
              }}
            >
              You have unsaved changes in{" "}
              <span style={{ color: "var(--bk-ink)", fontWeight: 500 }}>{tabLabel}</span> tab.
              What would you like to do?
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <Button
                ref={discardRef}
                onClick={onDiscard}
                style={discardBtn}
                aria-label="Discard changes and switch tab"
              >
                Discard
              </Button>
              <Button
                onClick={onCancel}
                style={cancelBtn}
                aria-label="Cancel and stay on current tab"
              >
                Cancel
              </Button>
              <Button
                onClick={onSaveAndSwitch}
                style={saveBtn}
                aria-label="Save changes and switch tab"
              >
                Save &amp; Switch
              </Button>
            </div>
          </div>
        </div>
      </ModalContent>
    </ModalRoot>
  );
};

const discardBtn: React.CSSProperties = {
  height: ROW_MD,
  padding: "0 12px",
  borderRadius: "var(--bk-radius-sm)",
  border: "1px solid var(--bk-error)",
  background: "rgba(220, 38, 38, 0.08)",
  color: "var(--bk-error)",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "inherit",
  transition: "background 0.1s",
};

const cancelBtn: React.CSSProperties = {
  height: ROW_MD,
  padding: "0 12px",
  borderRadius: "var(--bk-radius-sm)",
  border: "1px solid var(--bk-border)",
  background: "var(--bk-bg-subtle)",
  color: "var(--bk-ink-muted)",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "inherit",
  transition: "background 0.1s",
};

const saveBtn: React.CSSProperties = {
  height: ROW_MD,
  padding: "0 12px",
  borderRadius: "var(--bk-radius-sm)",
  border: "none",
  background: "var(--bk-accent)",
  color: "var(--bk-accent-on)",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
  transition: "background 0.1s",
};

/**
 * TokenReplaceModal — B4 follow-up (2026-05-17).
 *
 * Picker shown when a Pro-mode user tries to delete a token that still has
 * live consumers. Lets them pick a same-kind replacement; resulting call is
 * `onConfirm(replaceWith)` which the caller forwards to
 * `useColorTokens.deleteToken(id, { replaceWith })` / its useTokensForKind
 * equivalent — both apply the B1 `replacedBy` bridge.
 *
 * "Hard delete anyway" is intentionally NOT offered here: by contract the
 * caller only opens this modal when usage > 0; consumers would break on a
 * hard delete and the chrome should refuse it. usage=0 deletes skip the
 * modal entirely and call deleteToken(id) directly from TokenDetailView.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import {
  Modal,
  ModalContent,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "../../../shared/vibcoder";
import { Button } from "@/editor/shared/vibcoder/Button";
import type { DesignToken } from "../../types";

export interface TokenReplaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Token to be deleted. Used for the modal title + self-exclusion in candidates. */
  token: DesignToken;
  /** Pre-filtered candidates list — same kind, not self, not already soft-deleted. */
  candidates: ReadonlyArray<DesignToken>;
  /** Consumer count for the title. */
  usage: number;
  /** Called with the chosen replacement id when the user confirms. */
  onConfirm: (replaceWithId: string) => void;
}

const listStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  maxHeight: 320,
  overflowY: "auto",
  padding: "8px 0",
};

const rowStyle = (selected: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 12px",
  background: selected ? "var(--bk-bg-card)" : "transparent",
  border: `1px solid ${selected ? "var(--bk-accent)" : "var(--bk-border)"}`,
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 12,
  color: "var(--bk-ink)",
});

const nameStyle: React.CSSProperties = {
  fontWeight: 500,
};

const idMonoStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--bk-ink-muted)",
  fontFamily: "var(--bk-font-mono, ui-monospace, monospace)",
};

const emptyStyle: React.CSSProperties = {
  padding: 16,
  fontSize: 12,
  color: "var(--bk-ink-muted)",
  textAlign: "center",
};

const btnRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "6px 12px",
  background: "transparent",
  border: "1px solid var(--bk-border)",
  borderRadius: 6,
  color: "var(--bk-ink)",
  fontSize: 12,
  cursor: "pointer",
};

const confirmBtnStyle = (enabled: boolean): React.CSSProperties => ({
  padding: "6px 12px",
  background: enabled ? "var(--bk-accent)" : "var(--bk-bg-card)",
  border: "1px solid var(--bk-border)",
  borderRadius: 6,
  color: enabled ? "var(--bk-accent-on)" : "var(--bk-ink-muted)",
  fontSize: 12,
  cursor: enabled ? "pointer" : "not-allowed",
});

export const TokenReplaceModal: React.FC<TokenReplaceModalProps> = ({
  open,
  onOpenChange,
  token,
  candidates,
  usage,
  onConfirm,
}) => {
  // Reset selection whenever the modal opens fresh (different token).
  const [selectedId, setSelectedId] = React.useState<string | undefined>(undefined);
  React.useEffect(() => {
    if (open) setSelectedId(undefined);
  }, [open, token.id]);

  const handleConfirm = () => {
    if (!selectedId) return;
    onConfirm(selectedId);
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="lg" data-token-replace-modal={token.id}>
        <ModalTitle>Replace {token.name}?</ModalTitle>
        <ModalDescription>
          {usage} consumer{usage === 1 ? "" : "s"} reference this token. Pick a
          replacement and Buildrick will redirect every binding via the rename
          bridge — no consumer breaks.
        </ModalDescription>
        <div style={listStyle} role="radiogroup" aria-label="Replacement candidates">
          {candidates.length === 0 ? (
            <div style={emptyStyle}>
              No same-kind tokens available. Add one first, then come back to delete.
            </div>
          ) : (
            candidates.map((c) => {
              const selected = selectedId === c.id;
              return (
                <div
                  key={c.id}
                  data-replace-candidate={c.id}
                  role="radio"
                  aria-checked={selected}
                  tabIndex={0}
                  onClick={() => setSelectedId(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(c.id);
                    }
                  }}
                  style={rowStyle(selected)}
                >
                  <span style={nameStyle}>{c.name}</span>
                  <span style={idMonoStyle}>{c.id}</span>
                </div>
              );
            })
          )}
        </div>
        <ModalFooter>
          <div style={btnRowStyle}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              style={cancelBtnStyle}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              data-token-replace-confirm
              disabled={!selectedId}
              onClick={handleConfirm}
              style={confirmBtnStyle(!!selectedId)}
            >
              Delete and replace
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

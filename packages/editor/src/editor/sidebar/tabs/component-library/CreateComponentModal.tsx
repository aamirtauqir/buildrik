/**
 * CreateComponentModal - Modal for creating a new reusable component.
 * Two invocation modes:
 *   1. "+" button flow → name + group only (legacy + sidebar header).
 *   2. Canvas right-click flow (T12) → name + group + pre-fill bindings checkbox,
 *      driven by a passed-in `selectionContext` containing extracted token bindings.
 *
 * @license BSD-3-Clause
 */

// Canvas right-click "Save as component" flow routes here via the
// SaveAsComponentModal alias in editor/shell/StudioModals.tsx (T12 shipped
// via the SaveAsComponentModal re-import — see StudioModals.tsx:29). The
// shell/modals/CreateComponentModal.tsx serves the LeftSidebar "+" button
// flow (simple name + group). Two distinct UX surfaces, intentionally
// separate: this file is the binding-aware variant used by canvas
// right-click, the shell one is the lightweight sidebar header variant.

import * as React from "react";
import { Input } from "@/editor/shared/vibcoder/Input";
import { Button } from "@/editor/shared/vibcoder/Button";
import {
  Modal,
  ModalContent,
  ModalTitle,
  ModalClose,
  OverlayMount,
  Stack,
} from "@/editor/shared/vibcoder";
import {
  dialogCancelBtnStyles,
  dialogInputStyles,
  dialogPrimaryBtnStyles,
} from "./styles";

export interface SelectionContext {
  selectionIds: readonly string[];
  /** "elementId:prop" → "tokenId" — produced by tokenBindingResolver.resolveForElements(). */
  extractedBindings: Map<string, string>;
}

export interface CreateComponentSubmitPayload {
  name: string;
  group: string | null;
  prefillBindings: boolean;
}

export interface CreateComponentModalProps {
  onClose: () => void;
  onSubmit: (payload: CreateComponentSubmitPayload) => void;
  selectionContext?: SelectionContext;
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  color: "var(--bd-fg-muted, #64748B)",
  marginBottom: 4,
};

const bindingsCardStyle: React.CSSProperties = {
  background: "var(--bd-bg-muted, #F1F5F9)",
  border: "1px solid var(--bd-border, #E2E8F0)",
  borderRadius: 6,
  padding: "10px 12px",
};

const bindingsCheckboxStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 12,
  cursor: "pointer",
};

const bindingsHintStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--bd-fg-muted, #64748B)",
  marginTop: 4,
  paddingLeft: 22,
};

export const CreateComponentModal: React.FC<CreateComponentModalProps> = ({
  onClose,
  onSubmit,
  selectionContext,
}) => {
  const [name, setName] = React.useState("");
  const [group, setGroup] = React.useState<string>("");
  const [prefillBindings, setPrefillBindings] = React.useState<boolean>(true);

  const bindingCount = selectionContext?.extractedBindings.size ?? 0;

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({
      name: trimmed,
      group: group || null,
      prefillBindings: selectionContext ? prefillBindings : false,
    });
    onClose();
  };

  return (
    <OverlayMount>
      <Modal open onOpenChange={(next) => !next && onClose()}>
        <ModalContent size="lg">
          <ModalTitle>Save as component</ModalTitle>
          <ModalClose aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </ModalClose>
          <div className="bd-modal__body">
            <Stack gap="md">
              <Stack gap="xs">
                <label htmlFor="create-component-name" style={labelStyle}>
                  Name
                </label>
                <Input
                  id="create-component-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                    if (e.key === "Escape") onClose();
                  }}
                  placeholder="Component name"
                  autoFocus
                  style={dialogInputStyles}
                />
              </Stack>

              <Stack gap="xs">
                <label htmlFor="create-component-group" style={labelStyle}>
                  Group
                </label>
                <select
                  id="create-component-group"
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  style={dialogInputStyles}
                >
                  <option value="">Your symbols</option>
                </select>
              </Stack>

              {selectionContext && (
                <div style={bindingsCardStyle}>
                  <label style={bindingsCheckboxStyle}>
                    <input
                      type="checkbox"
                      checked={prefillBindings}
                      onChange={(e) => setPrefillBindings(e.target.checked)}
                      aria-label="Pre-fill bindings from DS"
                    />
                    Pre-fill bindings from DS
                  </label>
                  <p style={bindingsHintStyle}>
                    {bindingCount === 1
                      ? "1 style will bind to your DS tokens. Editing tokens later updates this component too."
                      : `${bindingCount} styles will bind to your DS tokens. Editing tokens later updates this component too.`}
                  </p>
                </div>
              )}
            </Stack>
          </div>
          <div className="bd-modal__foot">
            <Button onClick={onClose} style={dialogCancelBtnStyles}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!name.trim()}
              style={{
                ...dialogPrimaryBtnStyles,
                opacity: name.trim() ? 1 : 0.5,
                cursor: name.trim() ? "pointer" : "not-allowed",
              }}
            >
              Save component
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </OverlayMount>
  );
};

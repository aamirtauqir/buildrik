import { Input } from "@/editor/shared/vibcoder/Input";
import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * CreateComponentModal - Simple modal for creating a new reusable component
 * Shown when user clicks "+" in the Components tab header.
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
import { dialogCancelBtnStyles, dialogInputStyles, dialogPrimaryBtnStyles } from "./styles";
import { Stack } from "@/editor/shared/vibcoder";

export interface CreateComponentModalProps {
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export const CreateComponentModal: React.FC<CreateComponentModalProps> = ({
  onClose,
  onSubmit,
}) => {
  const [name, setName] = React.useState("");

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    onClose();
  };

  return (
    <OverlayMount>
      <Modal open onOpenChange={(next) => !next && onClose()}>
        <ModalContent size="lg">
          <ModalTitle>Create Component</ModalTitle>
          <ModalClose aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </ModalClose>
          <div className="bd-modal__body">
      <Stack>
        <Stack gap="xs">
          <label
            htmlFor="create-component-name"
            style={{ fontSize: 12, color: "var(--bd-fg-muted)" }}
          >
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
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
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
            Create
          </Button>
        </div>
      </Stack>
          </div>
        </ModalContent>
      </Modal>
    </OverlayMount>
  );
};

/**
 * CreateComponentModal - Simple modal for creating a new reusable component
 * Shown when user clicks "+" in the Components tab header.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Modal } from "../../../../shared/ui/Modal";
import { dialogCancelBtnStyles, dialogInputStyles, dialogPrimaryBtnStyles } from "./styles";

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
    <Modal isOpen onClose={onClose} title="Create Component" size="sm">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label
            htmlFor="create-component-name"
            style={{ fontSize: 12, color: "var(--aqb-text-muted)" }}
          >
            Name
          </label>
          <input
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
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={dialogCancelBtnStyles}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            style={{
              ...dialogPrimaryBtnStyles,
              opacity: name.trim() ? 1 : 0.5,
              cursor: name.trim() ? "pointer" : "not-allowed",
            }}
          >
            Create
          </button>
        </div>
      </div>
    </Modal>
  );
};

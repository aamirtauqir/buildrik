/**
 * Aquibra Save Template Modal
 * @license BSD-3-Clause
 */

import * as React from "react";
import { InputField, TextareaField, SelectField } from "../shared/forms";
import { Button, ModalBody, ModalClose, ModalContent, ModalRoot, ModalTitle } from "@/editor/chrome-ui";

export interface SaveTemplateProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; category: string; description: string }) => void;
  html?: string;
}

export const SaveTemplate: React.FC<SaveTemplateProps> = ({
  isOpen,
  onClose,
  onSave,
  // html prop available for future preview feature
}) => {
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("Custom");
  const [description, setDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSave({ name, category, description });
      onClose();
      setName("");
      setDescription("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalRoot open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <ModalContent size="lg">
        <ModalTitle>Save as Template</ModalTitle>
        <ModalClose aria-label="Close modal" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </ModalClose>
        <ModalBody>
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <InputField
        label="Template Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="My Template"
        autoFocus
      />

      <SelectField
        label="Category"
        value={category}
        onChange={setCategory}
        options={[
          { value: "Custom", label: "Custom" },
          { value: "Landing Pages", label: "Landing Pages" },
          { value: "Portfolio", label: "Portfolio" },
          { value: "Business", label: "Business" },
          { value: "E-Commerce", label: "E-Commerce" },
          { value: "Blog", label: "Blog" },
        ]}
      />

      <TextareaField
        label="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe your template..."
        rows={3}
      />
    </div>
    <div
      style={{
        display: "flex",
        gap: 8,
        marginTop: 24,
        justifyContent: "flex-end",
      }}
    >
      <Button color="light" onClick={onClose} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
        Cancel
      </Button>
      <Button onClick={handleSave} disabled={!name.trim() || saving} aria-busy={saving || undefined}>
        Save Template
      </Button>
    </div>
        </ModalBody>
      </ModalContent>
    </ModalRoot>
  );
};

export default SaveTemplate;

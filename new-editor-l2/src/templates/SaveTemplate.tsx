/**
 * Aquibra Save Template Modal
 * @license BSD-3-Clause
 */

import * as React from "react";
import { InputField, TextareaField, SelectField } from "../shared/forms";
import { Modal, Button } from "../shared/ui";

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
    <Modal isOpen={isOpen} onClose={onClose} title="Save as Template" size="sm">
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
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} loading={saving} disabled={!name.trim()}>
          Save Template
        </Button>
      </div>
    </Modal>
  );
};

export default SaveTemplate;

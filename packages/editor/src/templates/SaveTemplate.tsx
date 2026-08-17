/**
 * Aquibra Save Template Modal
 * @license BSD-3-Clause
 */

import * as React from "react";
import { InputField, TextareaField } from "../shared/forms";
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
  /* The saved row still carries a category so the stored shape does not change
     under anyone reading old entries; nothing chooses it any more, and nothing
     ever read it back. */
  const category = "Custom";
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
        <ModalTitle>Save page as template</ModalTitle>
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

      {/* The Category select that stood here is gone. Board 1169:4753 draws one
          field, and the value was never read back: `getUserTemplates` parses
          the stored row as { id, name, description, html } and hardcodes
          `category: "my-templates"` on every one. The user chose from six
          options and the reader ignored all six. Description stays — the board
          does not draw it, but unlike category it IS read: the drawer gallery
          searches on it and TemplateDetail prints it. */}
      <TextareaField
        label="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe your template..."
        rows={3}
      />

      {/* Board 1169:4753's hint. It is printed now because it became TRUE in
          this commit: `handleSaveTemplate` runs `inverseResolveTokens` over the
          exported HTML, so the saved template carries `{{token.…}}`
          placeholders and the apply path re-resolves them against whichever
          site it lands in. Before that the sentence would have been a promise
          the code did not keep. */}
      <p className="tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
        Tokens are snapshotted — applying it later re-maps them to that site&rsquo;s brand.
      </p>
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
        Save template
      </Button>
    </div>
        </ModalBody>
      </ModalContent>
    </ModalRoot>
  );
};

export default SaveTemplate;

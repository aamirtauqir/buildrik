/**
 * Save a version — board 4418:165661. A centred modal, not the inline form
 * it replaces: "<Site> · current draft", what a version is, the name field,
 * suggestion chips (plus "Clear name"), Cancel · Save version.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, ModalBody, ModalContent, ModalFooter, ModalRoot, ModalTitle, TextInput } from "@/editor/chrome-ui";

/** The board's two suggestions — the moments a named version protects. */
export const VERSION_NAME_SUGGESTIONS = ["Before design updates", "Before template replacement"] as const;
const MAX_NAME = 50;

export interface SaveVersionModalProps {
  open: boolean;
  siteName: string;
  onClose: () => void;
  /** Resolves when saved; rejects to keep the modal open. */
  onSave: (name: string) => Promise<void>;
}

export const SaveVersionModal: React.FC<SaveVersionModalProps> = ({ open, siteName, onClose, onSave }) => {
  const [name, setName] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) setName("");
  }, [open]);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await onSave(trimmed);
      onClose();
    } catch {
      // The caller toasts the failure; the name stays for a retry.
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalRoot open={open} onOpenChange={(next) => !next && onClose()}>
      <ModalContent size="form" data-testid="save-version-modal">
        <ModalTitle className="tw:text-[length:var(--bk-text-16)]">Save a version</ModalTitle>
        <ModalBody>
          <p className={LEAD}>
            {siteName} · current draft
            <br />
            Save a named milestone so you can return to this exact draft later. Saving does not publish anything.
          </p>
          <label htmlFor="save-version-name" className={LABEL}>
            Version name
          </label>
          <TextInput
            id="save-version-name"
            sizing="sm"
            value={name}
            maxLength={MAX_NAME}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
            autoFocus
            data-testid="save-version-name"
          />
          <div className="tw:mt-3 tw:flex tw:flex-wrap tw:gap-2" data-testid="save-version-chips">
            {VERSION_NAME_SUGGESTIONS.map((s) => (
              <Button key={s} color="light" size="xs" className={CHIP} onClick={() => setName(s)}>
                {s}
              </Button>
            ))}
            <Button color="light" size="xs" className={CHIP} onClick={() => setName("")}>
              Clear name
            </Button>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="light" size="xs" className="tw:border-transparent tw:bg-transparent" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="xs" onClick={() => void submit()} disabled={!name.trim() || saving} data-testid="save-version-submit">
            {saving ? "Saving…" : "Save version"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalRoot>
  );
};

/* Board 4418:165661: 12/18 lead in ink-soft, 12 label, gray-100 chips. */
const LEAD = "tw:m-0 tw:mb-3 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]";
const LABEL = "tw:mb-2 tw:block tw:text-[12px] tw:text-[var(--bk-ink-soft)]";
const CHIP =
  "tw:h-7 tw:rounded-md tw:border-transparent tw:bg-[var(--bk-gray-100)] tw:px-2 tw:text-[12px] tw:font-normal tw:text-[var(--bk-ink-soft)]";

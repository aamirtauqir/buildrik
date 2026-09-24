/**
 * TokenRenameDialog — "Rename token ID", board 4418:173685 (C5 G3-137;
 * replaced a window.prompt).
 *
 * The board's shape: a breadcrumb (site › Site brand › id) over the title and
 * a ✕; Current ID as a read-only field; New ID with the format helper under
 * it; a tinted note on what the rename does to what already uses the token —
 * the registry keeps the old id as a soft-deleted alias (`replacedBy`), so
 * every bound element follows to the new id; Cancel · Rename token.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { X } from "lucide-react";
import { Button, Label, ModalBody, ModalClose, ModalContent, ModalFooter, ModalRoot, ModalTitle, TextInput } from "@/editor/chrome-ui";

export interface TokenRenameDialogProps {
  open: boolean;
  currentId: string;
  /** Every other id in use — a rename may not collide. */
  takenIds: readonly string[];
  /** Elements bound to the token today. */
  usage: number;
  /** The site's name, for the breadcrumb; omitted when unknown. */
  siteName?: string;
  onCancel(): void;
  onRename(newId: string): void;
}

/* The board's field labels: 12, regular, soft ink. */
const FIELD_LABEL = "tw:text-[length:var(--bk-text-12)] tw:font-normal tw:leading-4 tw:text-[var(--bk-ink-soft)]";

const ID_SHAPE = /^[a-z0-9][a-z0-9.-]*$/;

export function renameError(next: string, currentId: string, takenIds: readonly string[]): string | null {
  if (!next) return "Enter an ID.";
  if (next === currentId) return "That is the current ID.";
  if (!ID_SHAPE.test(next)) return "Use lower-case letters, numbers, dots and dashes.";
  if (takenIds.includes(next)) return "Another token already uses that ID.";
  return null;
}

export function TokenRenameDialog({ open, currentId, takenIds, usage, siteName, onCancel, onRename }: TokenRenameDialogProps) {
  const [value, setValue] = React.useState(currentId);
  const [touched, setTouched] = React.useState(false);
  React.useEffect(() => {
    if (open) {
      setValue(currentId);
      setTouched(false);
    }
  }, [open, currentId]);

  const next = value.trim();
  const error = renameError(next, currentId, takenIds);
  const submit = () => {
    setTouched(true);
    if (!error) onRename(next);
  };

  const crumb = [siteName, "Site brand", currentId].filter(Boolean).join(" › ");
  const note =
    usage === 0
      ? "No elements reference this token yet. Nothing on the site changes."
      : `${usage} ${usage === 1 ? "element references" : "elements reference"} this token. References update automatically — nothing on the site breaks.`;

  return (
    <ModalRoot open={open} onClose={onCancel}>
      <ModalContent size="md" data-testid="brand-token-rename" srTitle="Rename token ID">
        <div className="tw:px-6 tw:pr-12 tw:pt-5 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="brand-token-rename-crumb">
          {crumb}
        </div>
        <ModalTitle className="tw:pt-0.5">Rename token ID</ModalTitle>
        <ModalClose aria-label="Close">
          <X size={16} aria-hidden />
        </ModalClose>
        <ModalBody>
          <div className="tw:flex tw:flex-col tw:gap-3">
            <div className="tw:flex tw:flex-col tw:gap-1">
              <Label htmlFor="brand-token-rename-current" className={FIELD_LABEL}>Current ID</Label>
              <TextInput
                id="brand-token-rename-current"
                readOnly
                value={currentId}
                data-testid="brand-token-rename-current"
              />
            </div>
            <div className="tw:flex tw:flex-col tw:gap-1">
              <Label htmlFor="brand-token-rename-input" className={FIELD_LABEL}>New ID</Label>
              <TextInput
                id="brand-token-rename-input"
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
                data-testid="brand-token-rename-input"
              />
              {touched && error ? (
                <span role="alert" className="tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-error-text)]" data-testid="brand-token-rename-error">
                  {error}
                </span>
              ) : (
                <span className="tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
                  Lowercase, hyphen-separated. Must be unique in this site.
                </span>
              )}
            </div>
            <p
              className="tw:m-0 tw:rounded-md tw:border tw:border-[var(--bk-accent-tint)] tw:bg-[var(--bk-accent-tint)] tw:px-3 tw:py-2 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-accent-text)]"
              data-testid="brand-token-rename-note"
            >
              {note}
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button size="xs" variant="secondary" onClick={onCancel} data-testid="brand-token-rename-cancel">
            Cancel
          </Button>
          <Button size="xs" onClick={submit} disabled={Boolean(error) && touched} data-testid="brand-token-rename-confirm">
            Rename token
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalRoot>
  );
}

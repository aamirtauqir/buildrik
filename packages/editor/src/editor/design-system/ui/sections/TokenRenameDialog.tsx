/**
 * TokenRenameDialog — "Rename token" (C5 G3-137; replaces a window.prompt).
 *
 * Current ID, New ID, and what the rename does to what already uses the
 * token: the registry keeps the old id as a soft-deleted alias
 * (`replacedBy`), so every element bound to it follows to the new id — the
 * line says how many.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Label, Modal, TextInput } from "@/editor/chrome-ui";

export interface TokenRenameDialogProps {
  open: boolean;
  currentId: string;
  /** Every other id in use — a rename may not collide. */
  takenIds: readonly string[];
  /** Elements bound to the token today. */
  usage: number;
  onCancel(): void;
  onRename(newId: string): void;
}

const ID_SHAPE = /^[a-z0-9][a-z0-9.-]*$/;

export function renameError(next: string, currentId: string, takenIds: readonly string[]): string | null {
  if (!next) return "Enter an ID.";
  if (next === currentId) return "That is the current ID.";
  if (!ID_SHAPE.test(next)) return "Use lower-case letters, numbers, dots and dashes.";
  if (takenIds.includes(next)) return "Another token already uses that ID.";
  return null;
}

export function TokenRenameDialog({ open, currentId, takenIds, usage, onCancel, onRename }: TokenRenameDialogProps) {
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

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Rename token"
      kind="question"
      testId="brand-token-rename"
      footer={
        <>
          <Button size="xs" variant="secondary" onClick={onCancel} data-testid="brand-token-rename-cancel">
            Cancel
          </Button>
          <Button size="xs" onClick={submit} disabled={Boolean(error) && touched} data-testid="brand-token-rename-confirm">
            Rename
          </Button>
        </>
      }
    >
      <div className="tw:flex tw:flex-col tw:gap-3">
        <div className="tw:flex tw:items-center tw:gap-2 tw:text-[length:var(--bk-text-13)] tw:leading-5">
          <span className="tw:text-[var(--bk-ink-muted)]">Current ID</span>
          <span className="tw:[font-family:var(--bk-font-mono)] tw:text-[var(--bk-ink)]" data-testid="brand-token-rename-current">
            {currentId}
          </span>
        </div>
        <div className="tw:flex tw:flex-col tw:gap-1">
          <Label htmlFor="brand-token-rename-input">New ID</Label>
          <TextInput
            id="brand-token-rename-input"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            className="tw:[font-family:var(--bk-font-mono)]"
            data-testid="brand-token-rename-input"
          />
          {touched && error && (
            <span role="alert" className="tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-error-text)]" data-testid="brand-token-rename-error">
              {error}
            </span>
          )}
        </div>
        <p className="tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="brand-token-rename-note">
          {usage === 0
            ? "Nothing uses this token yet."
            : `${usage} ${usage === 1 ? "reference follows" : "references follow"} the new ID.`}
        </p>
      </div>
    </Modal>
  );
}

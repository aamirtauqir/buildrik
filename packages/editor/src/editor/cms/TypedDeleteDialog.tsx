/**
 * TypedDeleteDialog — the typed-DELETE confirm for an irreversible, wide
 * delete (decision #29): a whole collection (4757:150118 / 6758:59135) or a
 * record that owns a generated page (6881:70349 / 6881:70368). Narrow,
 * reversible deletes take #17's instant delete + Undo instead.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Modal, TextInput } from "@/editor/chrome-ui";

export interface TypedDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  /** The thing being deleted, quoted in the title: Delete “Menu items”? */
  name: string;
  /** What goes with it — "Deleting removes 24 records and 4 generated pages." */
  consequence: string;
  /** Names the action: "Delete collection", "Delete record". */
  confirmLabel: string;
  testId: string;
}

const WORD = "DELETE";

export function TypedDeleteDialog({ open, onClose, onConfirm, name, consequence, confirmLabel, testId }: TypedDeleteDialogProps) {
  const [typed, setTyped] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => {
    if (!open) setTyped("");
  }, [open]);
  const armed = typed.trim() === WORD;

  const confirm = async () => {
    if (!armed || busy) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Delete “${name}”?`}
      kind="question"
      dismissOnScrimClick={false}
      testId={testId}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} data-testid={`${testId}-cancel`}>
            Cancel
          </Button>
          <Button variant="danger" disabled={!armed || busy} onClick={() => void confirm()} data-testid={`${testId}-confirm`}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]">
        {consequence} This can’t be undone.
      </p>
      <label className="tw:mt-4 tw:block tw:text-[11px] tw:leading-4 tw:font-semibold tw:text-[var(--bk-ink)]" htmlFor={`${testId}-input`}>
        Type {WORD} to confirm:
      </label>
      <TextInput
        id={`${testId}-input`}
        className="tw:mt-1.5"
        sizing="sm"
        autoComplete="off"
        placeholder={`Click to type ${WORD}`}
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void confirm();
        }}
        data-testid={`${testId}-input`}
      />
    </Modal>
  );
}

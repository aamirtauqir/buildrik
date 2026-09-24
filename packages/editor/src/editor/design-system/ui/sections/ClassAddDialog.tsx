/**
 * ClassAddDialog — Classes' "+ Add class" (7316:83357).
 *
 * A class exists only on the elements that carry it — there is no site-level
 * class registry — so adding one means putting it on elements. The dialog
 * takes a name and adds it to the canvas selection, in one undoable step
 * (the same `el.addClass` + transaction the inspector's Classes field uses).
 * With nothing selected it says so and Add stays off: a class added to no
 * element would not exist.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "../../../../engine/Composer";
import { runTransaction } from "../../../../shared/utils/helpers/transaction";
import { Button, Label, Modal, TextInput } from "@/editor/chrome-ui";

const CLASS_SHAPE = /^-?[_a-zA-Z][_a-zA-Z0-9-]*$/;

export function classNameError(raw: string): string | null {
  const name = raw.trim().replace(/^\./, "");
  if (!name) return "Enter a class name.";
  if (!CLASS_SHAPE.test(name)) return "Use letters, numbers, dashes and underscores; start with a letter.";
  if (name.startsWith("buildrick-")) return "buildrick- names are reserved for the editor.";
  return null;
}

export interface ClassAddDialogProps {
  open: boolean;
  composer: Composer | null;
  onClose(): void;
}

export function ClassAddDialog({ open, composer, onClose }: ClassAddDialogProps) {
  const [value, setValue] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const selected = open ? (composer?.selection?.getAllSelected?.() ?? []) : [];
  React.useEffect(() => {
    if (open) {
      setValue("");
      setTouched(false);
    }
  }, [open]);

  const error = classNameError(value);
  const submit = () => {
    setTouched(true);
    if (error || !composer || selected.length === 0) return;
    const name = value.trim().replace(/^\./, "");
    runTransaction(composer, "add-class", () => {
      for (const el of selected) {
        if (!el.getClasses?.().includes(name)) el.addClass?.(name);
      }
    });
    onClose();
  };

  const n = selected.length;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add class"
      kind="question"
      testId="brand-class-add"
      footer={
        <>
          <Button size="xs" variant="secondary" onClick={onClose} data-testid="brand-class-add-cancel">
            Cancel
          </Button>
          <Button size="xs" onClick={submit} disabled={n === 0} data-testid="brand-class-add-confirm">
            Add class
          </Button>
        </>
      }
    >
      <div className="tw:flex tw:flex-col tw:gap-3">
        <div className="tw:flex tw:flex-col tw:gap-1">
          <Label htmlFor="brand-class-add-input">Class name</Label>
          <TextInput
            id="brand-class-add-input"
            autoFocus
            placeholder="btn-primary"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            className="tw:[font-family:var(--bk-font-mono)]"
            data-testid="brand-class-add-input"
          />
          {touched && error && (
            <span role="alert" className="tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-error-text)]" data-testid="brand-class-add-error">
              {error}
            </span>
          )}
        </div>
        <p className="tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="brand-class-add-target">
          {n === 0
            ? "Select one or more elements on the canvas first — a class lives on the elements that carry it."
            : `Adds it to the ${n === 1 ? "selected element" : `${n} selected elements`}.`}
        </p>
      </div>
    </Modal>
  );
}

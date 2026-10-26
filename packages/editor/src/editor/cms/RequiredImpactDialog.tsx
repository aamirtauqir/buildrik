/**
 * RequiredImpactDialog — turning Required on for a field that published
 * records leave empty (2L9 B5-F33 257:53654, default step B5-F34 257:53846,
 * receipt B5-F43 259:95932).
 *
 * The board says those records "will be skipped on the next publish". The
 * code does not do that: Required is checked when a record is saved as
 * published (cmsValueError on the save path), and publish reads the records
 * as they stand. So the copy says what happens — they stay published, and
 * each needs a value the next time it is saved as published
 * (authority: code:required-checked-on-save). The board's "Required for new
 * only" has no rule behind it in the validator and is an owner decision.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { CMSField } from "@/shared/types/cms";
import { Button, Modal, TextInput } from "@/editor/chrome-ui";
import { cmsValueError } from "@buildrik/shared/schemas/cms";
import { TYPED_VALUE_TYPES, parseDefault } from "./fieldTypes";

export interface RequiredImpactDialogProps {
  field: CMSField;
  /** Published records with no value in the field. */
  emptyCount: number;
  onClose: () => void;
  onMakeRequired: () => void;
  /** Saves the default on the field, fills it into the empty published
   *  records and turns Required on; resolves with how many it filled. */
  onSetDefault: (value: unknown) => Promise<number>;
}

function records(n: number): string {
  return `${n} published record${n === 1 ? "" : "s"}`;
}

export function RequiredImpactDialog({ field, emptyCount, onClose, onMakeRequired, onSetDefault }: RequiredImpactDialogProps) {
  const [step, setStep] = React.useState<"ask" | "default">("ask");
  const [raw, setRaw] = React.useState(field.defaultValue == null ? "" : String(field.defaultValue));
  const [busy, setBusy] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const value = parseDefault(field.type, raw);
  const error = value === undefined ? null : cmsValueError({ ...field, name: "Default value" }, value);
  const canDefault = TYPED_VALUE_TYPES.has(field.type);

  if (step === "default") {
    const save = async () => {
      if (value === undefined || error || busy) return;
      setBusy(true);
      setFailed(false);
      try {
        await onSetDefault(value);
        onClose();
      } catch {
        setFailed(true);
      } finally {
        setBusy(false);
      }
    };
    return (
      <Modal
        open
        onClose={onClose}
        title={`Default ${field.name} value`}
        kind="form"
        testId="cms-required-default"
        footer={
          <>
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button disabled={value === undefined || Boolean(error) || busy} onClick={() => void save()} data-testid="cms-required-default-save">
              {busy ? "Saving…" : failed ? "Retry" : "Save default"}
            </Button>
          </>
        }
      >
        <p className="tw:m-0 tw:mb-2">
          Apply a default to the {records(emptyCount)} that have no value. Existing values will be kept.
        </p>
        <label className="tw:mb-1 tw:block tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]" htmlFor="cms-required-default-input">
          Default value
        </label>
        <TextInput
          id="cms-required-default-input"
          sizing="sm"
          autoFocus
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void save()}
          data-testid="cms-required-default-input"
        />
        {error ? (
          <p className="tw:m-0 tw:mt-1 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-error-text)]" role="alert">
            {error}
          </p>
        ) : null}
        {failed ? (
          <p className="tw:m-0 tw:mt-2 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-error-text)]" role="alert" data-testid="cms-required-default-failed">
            Couldn’t save the default. Required is unchanged.
          </p>
        ) : null}
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Make ${field.name} required?`}
      kind="form"
      testId="cms-required-impact"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {canDefault ? (
            <Button variant="secondary" onClick={() => setStep("default")} data-testid="cms-required-set-default">
              Set a default value
            </Button>
          ) : null}
          <Button
            onClick={() => {
              onMakeRequired();
              onClose();
            }}
            data-testid="cms-required-confirm"
          >
            Make required
          </Button>
        </>
      }
    >
      <p className="tw:m-0" data-testid="cms-required-impact-body">
        {records(emptyCount)} {emptyCount === 1 ? "has" : "have"} no {field.name} value. They stay published as they are; each needs a
        value the next time it is saved as published.
      </p>
    </Modal>
  );
}

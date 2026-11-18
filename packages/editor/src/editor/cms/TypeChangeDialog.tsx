/**
 * TypeChangeDialog — changing the type of a field records hold values in
 * (2L9 B5-F22 257:51318 preview, F23/F24 typed clear, F25/F37 pending,
 * F27 refused). The preview shows what each value becomes; Convert writes
 * the converted values, Clear values… empties them after the count is
 * typed back. Field values are server records outside the document's
 * history, so the clear says document Undo cannot bring them back.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { CMSCollection, CMSContentItem, CMSField, CMSFieldType } from "@/shared/types/cms";
import { Button, Modal, TextInput } from "@/editor/chrome-ui";
import { cmsTextOf } from "@buildrik/shared/schemas/cms";
import { FIELD_TYPE_LABEL } from "./fieldTypes";
import { planConversion } from "./fieldConversion";
import { recordTitle } from "./RecordsTable";

export type TypeChangeMode = "convert" | "clear";

export interface TypeChangeDialogProps {
  collection: CMSCollection;
  field: CMSField;
  to: CMSFieldType;
  records: CMSContentItem[];
  onClose: () => void;
  /** Changes the type and writes (or clears) the values; rejects when the
   *  server refused part of it. */
  onApply: (mode: TypeChangeMode) => Promise<void>;
  /** How many elements read this field (the Fields table's "Used by"). */
  usedBy?: number;
}

const PREVIEW_ROWS = 5;
/* 257:51318: a mono table — title, the stored value right-aligned, →, the
   new value — read as one block, not two columns at the dialog's edges. */
const ROW =
  "tw:grid tw:grid-cols-[minmax(0,140px)_minmax(24px,auto)_auto_minmax(0,1fr)] tw:items-baseline tw:gap-x-3 " +
  "tw:[font-family:var(--bk-font-mono)] tw:tabular-nums tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink)]";

function shown(v: unknown): string {
  return typeof v === "string" ? `“${v}”` : cmsTextOf(v);
}

export function TypeChangeDialog({ collection, field, to, records, onClose, onApply, usedBy }: TypeChangeDialogProps) {
  const plan = React.useMemo(() => planConversion(field, records, to), [field, records, to]);
  const [step, setStep] = React.useState<"preview" | "clear">("preview");
  const [typed, setTyped] = React.useState("");
  const [busy, setBusy] = React.useState<TypeChangeMode | null>(null);
  const [failed, setFailed] = React.useState<TypeChangeMode | null>(null);
  const n = plan.touched.length;
  const from = FIELD_TYPE_LABEL[field.type];
  const toLabel = FIELD_TYPE_LABEL[to];
  const lossless = plan.failing.length === 0;

  const run = async (mode: TypeChangeMode) => {
    setBusy(mode);
    setFailed(null);
    try {
      await onApply(mode);
      onClose();
    } catch {
      setFailed(mode);
    } finally {
      setBusy(null);
    }
  };

  if (busy) {
    return (
      <Modal open onClose={() => undefined} title={busy === "convert" ? `Converting ${field.name}…` : `Clearing ${field.name} values…`} width="xl" placement="panel" testId="cms-type-change-busy">
        {/* 257:51906 / 257:52092. The type itself has already moved (see
            CmsWorkspace.changeType), so the convert copy claims only the values. */}
        <p className="tw:m-0">
          {busy === "convert"
            ? `Waiting for the server to confirm all ${n} value${n === 1 ? "" : "s"}.`
            : `Waiting for acknowledgment. The ${n} stored value${n === 1 ? "" : "s"} remain${n === 1 ? "s" : ""} unchanged until the server confirms ${n === 1 ? "it" : "each one"}.`}
        </p>
      </Modal>
    );
  }

  if (failed) {
    return (
      <Modal
        open
        onClose={onClose}
        title={`Couldn’t change ${field.name}`}
        width="xl" placement="panel" testId="cms-type-change-failed"
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Back to Fields
            </Button>
            <Button onClick={() => void run(failed)} data-testid="cms-type-change-retry">
              Retry
            </Button>
          </>
        }
      >
        <p className="tw:m-0">
          The server refused part of the change. {field.name} may already read as {toLabel} with some values not yet{" "}
          {failed === "convert" ? "converted" : "cleared"}; Retry finishes the rest.
        </p>
      </Modal>
    );
  }

  if (step === "clear") {
    const armed = typed.trim() === String(n);
    return (
      <Modal
        open
        onClose={onClose}
        title={`Clear ${field.name} values?`}
        width="xl" placement="panel" testId="cms-type-change-clear"
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="danger" disabled={!armed} onClick={() => void run("clear")} data-testid="cms-type-change-clear-confirm">
              Clear {n} value{n === 1 ? "" : "s"}
            </Button>
          </>
        }
      >
        <p className="tw:m-0">
          {n} record{n === 1 ? "" : "s"} will lose {n === 1 ? "its" : "their"} {field.name} value. This cannot be reversed by document Undo.
        </p>
        <label className="tw:mt-3 tw:block tw:text-[11px] tw:leading-4 tw:font-semibold tw:text-[var(--bk-ink)]" htmlFor="cms-type-change-typed">
          Type {n} to confirm
        </label>
        <TextInput
          id="cms-type-change-typed"
          className="tw:mt-1.5"
          sizing="sm"
          autoComplete="off"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          data-testid="cms-type-change-typed"
        />
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Change ${field.name} type`}
      subtitle={`${n} record${n === 1 ? " has" : "s have"} a value. Preview ${n > PREVIEW_ROWS ? "the first five" : n === 1 ? "it" : "them"} before changing ${from} to ${toLabel}.`}
      kind="form"
      /* 257:51318 — a 720 dialog, like Create collection page. */
      width="xl" placement="panel"
      testId="cms-type-change"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="ghost" onClick={() => setStep("clear")} data-testid="cms-type-change-clear-start">
            Clear values…
          </Button>
          <Button disabled={!lossless} onClick={() => void run("convert")} data-testid="cms-type-change-convert">
            Convert {n} value{n === 1 ? "" : "s"}
          </Button>
        </>
      }
    >
      <div className="tw:flex tw:flex-col tw:gap-1" data-testid="cms-type-change-preview">
        {plan.touched.slice(0, PREVIEW_ROWS).map((r) => {
          const c = plan.converts.find((x) => x.record.id === r.id);
          return (
            <div key={r.id} className={ROW}>
              <span className="tw:truncate">{recordTitle(collection, r)}</span>
              <span className="tw:text-right">{cmsTextOf(r.data[field.slug])}</span>
              <span aria-hidden="true">→</span>
              <span className="tw:truncate">
                <span className="tw:sr-only">becomes </span>
                {c ? shown(c.value) : "can’t convert"}
              </span>
            </div>
          );
        })}
      </div>
      <p className="tw:m-0 tw:mt-3 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]" data-testid="cms-type-change-summary">
        {lossless
          ? `Lossless conversion${usedBy === undefined ? "" : ` · Used by ${usedBy}`} · Values remain intact.`
          : `${plan.failing.length} of ${n} values can’t become ${toLabel}. Clear values… changes the type without them.`}
      </p>
    </Modal>
  );
}

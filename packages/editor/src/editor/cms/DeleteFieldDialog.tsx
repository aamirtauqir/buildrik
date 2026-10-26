/**
 * DeleteFieldDialog — a field's delete, in one of two states:
 *  - unbound: "Delete {field}?" (2L9 257:52890) — names how many records
 *    hold a value and, when any do, asks for that number typed back; while
 *    the delete runs it reads "Deleting {field}…" (257:53280) and a refused
 *    delete keeps the dialog with Retry. The board's "stay in Recently
 *    deleted for 30 days" waits on the restore server slice — until then the
 *    copy says the delete cannot be undone;
 *  - bound: "Cannot delete — field is bound" (4418:165439) — lists what
 *    depends on it and offers the way there instead of a delete. Deleting a
 *    bound field was unguarded; the binding would have resolved to its
 *    fallback on the canvas and in every export.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { CircleX, TriangleAlert } from "lucide-react";
import type { CMSCollection, CMSField } from "@/shared/types/cms";
import { Button, ModalBody, ModalContent, ModalFooter, ModalRoot, ModalTitle, TextInput } from "@/editor/chrome-ui";
import { FIELD_TYPE_LABEL } from "./fieldTypes";
import type { FieldUse } from "./fieldUsage";

const CALLOUT = "tw:mt-2 tw:flex tw:gap-2 tw:rounded-[6px] tw:border tw:px-3 tw:py-2 tw:text-[11px] tw:leading-4";

export function DeleteFieldDialog({
  collection,
  field,
  uses,
  onClose,
  onDelete,
  onOpenUse,
  siteName,
  valueCount,
}: {
  collection: CMSCollection;
  field: CMSField;
  uses: FieldUse[];
  /** For the breadcrumb over the title (4418:165425). */
  siteName: string;
  /** Records that hold a value in the field. */
  valueCount: number;
  onClose: () => void;
  /** Resolves when the delete landed; a rejection keeps the dialog. */
  onDelete: () => Promise<void>;
  /** Takes the person to a binding (selects its element on the canvas). */
  onOpenUse: (elementId: string) => void;
}) {
  const type = FIELD_TYPE_LABEL[field.type] ?? field.type;
  const first = uses.find((u) => u.elementId);
  const [typed, setTyped] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  /* 4418:165425 / :165439 — both states put a breadcrumb over the title and
     a bordered callout under it, 11/16. */
  const frame = (testId: string, size: "md" | "table", title: string, body: React.ReactNode, foot: React.ReactNode) => (
    <ModalRoot open onClose={onClose}>
      <ModalContent size={size} data-testid={testId} srTitle={title}>
        <div className="tw:px-6 tw:pt-5 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid={`${testId}-crumb`}>
          {`${siteName} › ${collection.name} › ${field.name}`}
        </div>
        <ModalTitle className="tw:pt-0.5">{title}</ModalTitle>
        <ModalBody>{body}</ModalBody>
        <ModalFooter data-testid={`modal-foot-${testId}`}>{foot}</ModalFooter>
      </ModalContent>
    </ModalRoot>
  );
  if (uses.length) {
    return frame(
      "cms-field-locked",
      /* 640 — dialog-lg (ModalContent's own "lg" is 720). */
      "table",
      "Cannot delete — field is bound",
      <>
        <div className={`${CALLOUT} tw:border-[color-mix(in_srgb,var(--bk-error)_30%,transparent)] tw:bg-[var(--bk-error-tint)] tw:text-[var(--bk-error-text)]`}>
          <CircleX size={12} className="tw:mt-0.5 tw:flex-none" aria-hidden="true" />
          <span>
            {field.name} is locked because {uses.length === 1 ? "a live binding depends" : `${uses.length} live bindings depend`} on it.
            Remove the {uses.length === 1 ? "binding" : "bindings"}, then delete the field.
          </span>
        </div>
        <ul className="tw:m-0 tw:mt-2 tw:flex tw:list-none tw:flex-col tw:gap-2 tw:p-0" data-testid="cms-field-locked-uses">
          {uses.map((u, i) => (
            <li
              key={`${u.label}-${i}`}
              className="tw:flex tw:h-8 tw:items-center tw:rounded-[6px] tw:bg-[var(--bk-gray-50)] tw:px-3 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-soft)]"
            >
              {u.label} › {field.name}
            </li>
          ))}
        </ul>
      </>,
      <>
        <Button variant="secondary" onClick={onClose} data-testid="cms-field-locked-back">
          Back to field
        </Button>
        {first?.elementId ? (
          <Button onClick={() => onOpenUse(first.elementId!)} data-testid="cms-field-locked-open">
            Open the {first.label} binding
          </Button>
        ) : null}
      </>,
    );
  }
  /* 257:52890 — the number of values at stake is what gets typed back. */
  const armed = valueCount === 0 || typed.trim() === String(valueCount);
  const confirm = async () => {
    if (!armed || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await onDelete();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };
  return frame(
    "cms-field-delete",
    "md",
    busy ? `Deleting ${field.name}…` : `Delete ${field.name}?`,
    <>
      <div className={`${CALLOUT} tw:border-[color-mix(in_srgb,var(--bk-yellow-300)_45%,transparent)] tw:bg-[var(--bk-yellow-100)] tw:text-[var(--bk-warning-text)]`}>
        <TriangleAlert size={12} className="tw:mt-0.5 tw:flex-none" aria-hidden="true" />
        <span data-testid="cms-field-delete-impact">
          {valueCount === 0
            ? `No record has a value in ${field.name}.`
            : `${valueCount} record${valueCount === 1 ? " has a" : "s have a"} value in ${field.name}.`}{" "}
          {field.name} is a {type} field on the {collection.name} collection.
        </span>
      </div>
      <p className="tw:m-0 tw:mt-3 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
        {busy
          ? "The field stays available until the deletion finishes."
          : "Records keep their other fields. This cannot be undone."}
      </p>
      {valueCount > 0 ? (
        <>
          <label className="tw:mt-3 tw:block tw:text-[11px] tw:leading-4 tw:font-semibold tw:text-[var(--bk-ink)]" htmlFor="cms-field-delete-typed">
            Type {valueCount} to confirm
          </label>
          <TextInput
            id="cms-field-delete-typed"
            className="tw:mt-1.5"
            sizing="sm"
            autoComplete="off"
            value={typed}
            disabled={busy}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void confirm()}
            data-testid="cms-field-delete-typed"
          />
        </>
      ) : null}
      {failed ? (
        <p className="tw:m-0 tw:mt-2 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-error-text)]" role="alert" data-testid="cms-field-delete-failed">
          Couldn’t delete {field.name}. The field and its values are unchanged.
        </p>
      ) : null}
    </>,
    <>
      <Button variant="secondary" onClick={onClose} disabled={busy} data-testid="cms-field-delete-cancel">
        Cancel
      </Button>
      <Button variant="danger" disabled={!armed || busy} onClick={() => void confirm()} data-testid="cms-field-delete-confirm">
        {busy ? "Deleting…" : failed ? "Retry" : "Delete field"}
      </Button>
    </>,
  );
}

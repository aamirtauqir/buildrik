/**
 * DeleteFieldDialog — a field's delete, in one of two states:
 *  - unbound: "Delete this field?" (4418:165425) — the values on every record
 *    go with it, records keep their other fields;
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
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalRoot, ModalTitle } from "@/editor/chrome-ui";
import { FIELD_TYPE_LABEL } from "./fieldTypes";
import type { FieldUse } from "./fieldUsage";

const CALLOUT = "tw:flex tw:gap-2 tw:rounded-[6px] tw:px-3 tw:py-2 tw:text-[12px] tw:leading-[18px]";

export function DeleteFieldDialog({
  collection,
  field,
  uses,
  onClose,
  onDelete,
  onOpenUse,
  siteName,
  recordCount,
}: {
  collection: CMSCollection;
  field: CMSField;
  uses: FieldUse[];
  /** For the breadcrumb over the title (4418:165425). */
  siteName: string;
  recordCount: number;
  onClose: () => void;
  onDelete: () => void;
  /** Takes the person to a binding (selects its element on the canvas). */
  onOpenUse: (elementId: string) => void;
}) {
  const type = FIELD_TYPE_LABEL[field.type] ?? field.type;
  const first = uses.find((u) => u.elementId);
  if (uses.length) {
    return (
      <Modal
        open
        onClose={onClose}
        title="Cannot delete — field is bound"
        subtitle={`${collection.name} › ${field.name}`}
        testId="cms-field-locked"
        footer={
          <>
            <Button variant="secondary" onClick={onClose} data-testid="cms-field-locked-back">
              Back to field
            </Button>
            {first?.elementId ? (
              <Button onClick={() => onOpenUse(first.elementId!)} data-testid="cms-field-locked-open">
                Open the {first.label} binding
              </Button>
            ) : null}
          </>
        }
      >
        <div className={`${CALLOUT} tw:bg-[var(--bk-error-tint)] tw:text-[var(--bk-error-text)]`}>
          <CircleX size={14} className="tw:mt-0.5 tw:flex-none" aria-hidden="true" />
          <span>
            {field.name} is locked because {uses.length === 1 ? "a live binding depends" : `${uses.length} live bindings depend`} on it.
            Unbind {uses.length === 1 ? "it" : "them"} first, then delete the field.
          </span>
        </div>
        <ul className="tw:m-0 tw:mt-3 tw:list-none tw:rounded-[6px] tw:border tw:border-[var(--bk-border)] tw:p-0 tw:py-1" data-testid="cms-field-locked-uses">
          {uses.map((u, i) => (
            <li key={`${u.label}-${i}`} className="tw:flex tw:h-[26px] tw:items-center tw:px-2 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
              {u.label} › {field.name}
            </li>
          ))}
        </ul>
      </Modal>
    );
  }
  /* 4418:165425 — a breadcrumb over the title, a bordered warning callout
     that counts the records, an 11px note. */
  const records = recordCount === 1 ? "the 1 record" : `all ${recordCount} records`;
  return (
    <ModalRoot open onClose={onClose}>
      <ModalContent size="md" data-testid="cms-field-delete" srTitle="Delete this field?">
        <div className="tw:px-6 tw:pt-5 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="cms-field-delete-crumb">
          {`${siteName} › ${collection.name} › ${field.name}`}
        </div>
        <ModalTitle className="tw:pt-0.5">Delete this field?</ModalTitle>
        <ModalBody>
          <div
            className="tw:mt-2 tw:flex tw:gap-2 tw:rounded-[6px] tw:border tw:border-[color-mix(in_srgb,var(--bk-yellow-300)_45%,transparent)] tw:bg-[var(--bk-yellow-100)] tw:px-3 tw:py-2 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-warning-text)]"
          >
            <TriangleAlert size={12} className="tw:mt-0.5 tw:flex-none" aria-hidden="true" />
            <span>
              {field.name} is a {type} field on the {collection.name} collection. Deleting it removes the value from {records}.
            </span>
          </div>
          <p className="tw:m-0 tw:mt-3 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
            Records keep their other fields. This cannot be undone.
          </p>
        </ModalBody>
        <ModalFooter data-testid="modal-foot-cms-field-delete">
          <Button variant="secondary" onClick={onClose} data-testid="cms-field-delete-cancel">
            Cancel
          </Button>
          <Button variant="danger" onClick={onDelete} data-testid="cms-field-delete-confirm">
            Delete field
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalRoot>
  );
}

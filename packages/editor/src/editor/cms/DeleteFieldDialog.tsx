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
import { Button, ModalBody, ModalContent, ModalFooter, ModalRoot, ModalTitle } from "@/editor/chrome-ui";
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
  const records = recordCount === 1 ? "the 1 record" : `all ${recordCount} records`;
  return frame(
    "cms-field-delete",
    "md",
    "Delete this field?",
    <>
      <div className={`${CALLOUT} tw:border-[color-mix(in_srgb,var(--bk-yellow-300)_45%,transparent)] tw:bg-[var(--bk-yellow-100)] tw:text-[var(--bk-warning-text)]`}>
        <TriangleAlert size={12} className="tw:mt-0.5 tw:flex-none" aria-hidden="true" />
        <span>
          {field.name} is a {type} field on the {collection.name} collection. Deleting it removes the value from {records}.
        </span>
      </div>
      <p className="tw:m-0 tw:mt-3 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
        Records keep their other fields. This cannot be undone.
      </p>
    </>,
    <>
      <Button variant="secondary" onClick={onClose} data-testid="cms-field-delete-cancel">
        Cancel
      </Button>
      <Button variant="danger" onClick={onDelete} data-testid="cms-field-delete-confirm">
        Delete field
      </Button>
    </>,
  );
}

/**
 * FieldsTable — a collection's Fields tab (4428:147552): NAME · TYPE ·
 * REQUIRED · USED BY, one row per field, each with a ⋯ whose Delete field…
 * asks first (4418:165425) or refuses while something is bound to the field
 * (4418:165439). Deleted → "Field deleted" toast (4418:165458).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Check } from "lucide-react";
import type { Composer } from "@/engine";
import type { CMSCollection, CMSField } from "@/shared/types/cms";
import { IconButton, Menu, MenuItem, Popover, useToast } from "@/editor/chrome-ui";
import { FIELD_TYPE_LABEL } from "./fieldTypes";
import { fieldUsage } from "./fieldUsage";
import { DeleteFieldDialog } from "./DeleteFieldDialog";

const HEAD_ROW =
  "tw:flex tw:h-9 tw:flex-none tw:items-center tw:px-4 tw:bg-[var(--bk-gray-50)] tw:border-b tw:border-[var(--bk-border)]";
const HEAD_CELL =
  "tw:flex tw:h-9 tw:items-center tw:overflow-hidden tw:text-[11px] tw:leading-4 tw:font-medium " +
  "tw:tracking-[0.88px] tw:uppercase tw:text-[var(--bk-gray-500)]";
const ROW = "tw:flex tw:h-10 tw:w-full tw:flex-none tw:items-center tw:px-4 tw:bg-[var(--bk-bg-panel)] tw:border-b tw:border-[var(--bk-border)]";
/* No flex sizing here: on a plain element `flex-none` and USED BY's `flex-1`
   would both compile and the stylesheet's order would pick (it picked none). */
const CELL = "tw:flex tw:h-10 tw:items-center tw:gap-1.5 tw:overflow-hidden tw:pr-3 tw:text-[13px] tw:leading-5 tw:whitespace-nowrap";
const CELL_SOFT = `${CELL} tw:text-[var(--bk-ink-soft)]`;
const W_NAME = "tw:w-[240px] tw:flex-none";
const W_TYPE = "tw:w-[140px] tw:flex-none";
const W_REQ = "tw:w-[110px] tw:flex-none";
const W_USED = "tw:min-w-0 tw:flex-1";

export interface FieldsTableProps {
  composer: Composer | null;
  collection: CMSCollection;
  onDeleteField: (fieldId: string) => Promise<void>;
}

export function FieldsTable({ composer, collection, onDeleteField }: FieldsTableProps) {
  const { addToast } = useToast();
  const [menuFor, setMenuFor] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<CMSField | null>(null);
  const usage = fieldUsage(composer, collection);

  const remove = async (field: CMSField) => {
    setDeleting(null);
    await onDeleteField(field.id);
    addToast({ tone: "success", title: "Field deleted", description: `${field.name} has been removed from ${collection.name}.` });
  };

  const openUse = (elementId: string) => {
    const el = composer?.elements.getElement(elementId);
    if (!composer || !el) return;
    setDeleting(null);
    composer.selection.select(el);
    composer.emit("ui:switch-tab", { tab: "layers" });
  };

  return (
    <div className="tw:flex tw:min-h-0 tw:flex-1 tw:flex-col" role="table" aria-label={`${collection.name} fields`} data-testid="cms-fields">
      <div role="row" className={HEAD_ROW}>
        <div role="columnheader" className={`${HEAD_CELL} ${W_NAME}`}>Name</div>
        <div role="columnheader" className={`${HEAD_CELL} ${W_TYPE}`}>Type</div>
        <div role="columnheader" className={`${HEAD_CELL} ${W_REQ}`}>Required</div>
        <div role="columnheader" className={`${HEAD_CELL} ${W_USED}`}>Used by</div>
        <div className="tw:w-8 tw:flex-none" />
      </div>
      <div className="tw:min-h-0 tw:flex-1 tw:overflow-y-auto">
        {collection.fields.map((f) => {
          const uses = usage.get(f.slug) ?? [];
          return (
            <div key={f.id} role="row" className={ROW} data-testid={`cms-field-${f.id}`}>
              <div role="cell" className={`${CELL} ${W_NAME} tw:font-medium tw:text-[var(--bk-ink)]`}>{f.name}</div>
              <div role="cell" className={`${CELL_SOFT} ${W_TYPE}`} data-testid={`cms-field-type-${f.id}`}>
                {FIELD_TYPE_LABEL[f.type] ?? f.type}
              </div>
              <div role="cell" className={`${CELL_SOFT} ${W_REQ}`} data-testid={`cms-field-req-${f.id}`}>
                {f.validation?.required ? <Check size={14} aria-label="Required" /> : null}
              </div>
              <div role="cell" className={`${CELL_SOFT} ${W_USED}`} data-testid={`cms-field-used-${f.id}`}>
                <span className="tw:truncate">{uses.map((u) => u.label).join(" · ")}</span>
              </div>
              <Popover
                open={menuFor === f.id}
                onClose={() => setMenuFor(null)}
                placement="bottom-end"
                label={`Actions for ${f.name}`}
                trigger={
                  <IconButton label={`Actions for field ${f.name}`} size="sm" onClick={() => setMenuFor((p) => (p === f.id ? null : f.id))}>
                    ⋯
                  </IconButton>
                }
              >
                <Menu label={`Actions for ${f.name}`}>
                  <MenuItem data-testid={`cms-field-delete-${f.id}`} onClick={() => { setMenuFor(null); setDeleting(f); }}>
                    Delete field…
                  </MenuItem>
                </Menu>
              </Popover>
            </div>
          );
        })}
      </div>
      {deleting ? (
        <DeleteFieldDialog
          collection={collection}
          field={deleting}
          uses={usage.get(deleting.slug) ?? []}
          onClose={() => setDeleting(null)}
          onDelete={() => void remove(deleting)}
          onOpenUse={openUse}
        />
      ) : null}
    </div>
  );
}

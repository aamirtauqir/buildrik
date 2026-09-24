/**
 * FieldsTable — a collection's Fields tab (4428:147552 / 6103:52202): NAME ·
 * TYPE · REQUIRED · USED BY, one row per field. A row opens its settings in
 * the right column (FieldInspector); the selected row takes the accent wash.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { CMSCollection } from "@/shared/types/cms";
import { FIELD_TYPE_LABEL } from "./fieldTypes";
import type { FieldUse } from "./fieldUsage";

const HEAD_ROW =
  "tw:flex tw:h-9 tw:flex-none tw:items-center tw:px-4 tw:bg-[var(--bk-gray-50)] tw:border-b tw:border-[var(--bk-border)]";
const HEAD_CELL =
  "tw:flex tw:h-9 tw:items-center tw:overflow-hidden tw:text-[11px] tw:leading-4 tw:font-medium " +
  "tw:tracking-[0.88px] tw:uppercase tw:text-[var(--bk-gray-500)]";
const ROW_BASE =
  "tw:flex tw:h-10 tw:w-full tw:flex-none tw:items-center tw:px-4 tw:border-b tw:border-[var(--bk-border)] tw:cursor-pointer " +
  "tw:focus-visible:outline-none tw:focus-visible:[box-shadow:inset_var(--bk-shadow-focus)]";
const ROW = `${ROW_BASE} tw:bg-[var(--bk-bg-panel)] tw:hover:bg-[var(--bk-gray-50)]`;
const ROW_SELECTED = `${ROW_BASE} tw:bg-[var(--bk-accent-tint)]`;
/* No flex sizing here: on a plain element `flex-none` and USED BY's `flex-1`
   would both compile and the stylesheet's order would pick (it picked none). */
const CELL = "tw:flex tw:h-10 tw:items-center tw:gap-1.5 tw:overflow-hidden tw:pr-3 tw:text-[13px] tw:leading-5 tw:whitespace-nowrap";
const CELL_SOFT = `${CELL} tw:text-[var(--bk-ink-soft)]`;
/* 6103:52202 at 1440: 240 · 160 · 120 · the rest. */
const W_NAME = "tw:w-[240px] tw:flex-none";
const W_TYPE = "tw:w-[160px] tw:flex-none";
const W_REQ = "tw:w-[120px] tw:flex-none";
const W_USED = "tw:min-w-0 tw:flex-1";

export interface FieldsTableProps {
  collection: CMSCollection;
  usage: Map<string, FieldUse[]>;
  selectedId: string | null;
  onSelect: (fieldId: string) => void;
}

export function FieldsTable({ collection, usage, selectedId, onSelect }: FieldsTableProps) {
  return (
    <div className="tw:flex tw:min-h-0 tw:flex-1 tw:flex-col" role="table" aria-label={`${collection.name} fields`} data-testid="cms-fields">
      <div role="row" className={HEAD_ROW}>
        <div role="columnheader" className={`${HEAD_CELL} ${W_NAME}`}>Name</div>
        <div role="columnheader" className={`${HEAD_CELL} ${W_TYPE}`}>Type</div>
        <div role="columnheader" className={`${HEAD_CELL} ${W_REQ}`}>Required</div>
        <div role="columnheader" className={`${HEAD_CELL} ${W_USED}`}>Used by</div>
      </div>
      <div className="tw:min-h-0 tw:flex-1 tw:overflow-y-auto">
        {collection.fields.map((f) => {
          const uses = usage.get(f.slug) ?? [];
          const selected = f.id === selectedId;
          return (
            <div
              key={f.id}
              role="row"
              tabIndex={0}
              aria-selected={selected}
              className={selected ? ROW_SELECTED : ROW}
              data-testid={`cms-field-${f.id}`}
              onClick={() => onSelect(f.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(f.id);
                }
              }}
            >
              <div role="cell" className={`${CELL} ${W_NAME} tw:text-[var(--bk-ink)]`}>{f.name}</div>
              <div role="cell" className={`${CELL_SOFT} ${W_TYPE}`} data-testid={`cms-field-type-${f.id}`}>
                {FIELD_TYPE_LABEL[f.type] ?? f.type}
              </div>
              <div
                role="cell"
                className={`${CELL} ${W_REQ} ${f.validation?.required ? "tw:text-[var(--bk-ink)]" : "tw:text-[var(--bk-ink-muted)]"}`}
                data-testid={`cms-field-req-${f.id}`}
              >
                {f.validation?.required ? "Yes" : "No"}
              </div>
              <div role="cell" className={`${CELL_SOFT} ${W_USED}`} data-testid={`cms-field-used-${f.id}`}>
                <span className="tw:truncate">{uses.map((u) => u.label).join(" · ")}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

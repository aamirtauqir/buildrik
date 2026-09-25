/**
 * RecordPreview — the record sheet's read-only preview column (7116:76427,
 * "Preview ▸"). It draws the record the way a list card on the site would:
 * the first image field, the title with the first short value beside it, the
 * first long text under it — from the FORM's current values, so an edit shows
 * here before it is saved. The status reads the SAVED record: a draft stays
 * "Draft · not published" until it is saved as published.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { CMSCollection, CMSContentItem, CMSField } from "@/shared/types/cms";
import { Button } from "@/editor/chrome-ui";
import { resolveUrl } from "./DynamicPagesPane";

const text = (v: unknown) => (v === undefined || v === null ? "" : String(v));
const firstOf = (fields: CMSField[], types: CMSField["type"][], skip: string[] = []) =>
  fields.find((f) => types.includes(f.type) && !skip.includes(f.slug));

export function RecordPreview({
  collection,
  record,
  form,
  title,
  onDelete,
}: {
  collection: CMSCollection;
  record: CMSContentItem | null;
  form: Record<string, unknown>;
  title: string;
  /** Absent for a record that is not saved yet — there is nothing to delete. */
  onDelete?: () => void;
}) {
  const fields = [...collection.fields].sort((a, b) => a.order - b.order);
  const image = firstOf(fields, ["image"]);
  /* The short value beside the title (a price) — never the title itself or the URL slug. */
  const meta = firstOf(fields, ["number", "text"], [collection.displayField ?? "name", "slug"]);
  const body = firstOf(fields, ["textarea", "richtext"]);
  const src = image ? text(form[image.slug]) : "";
  const metaValue = meta ? text(form[meta.slug]) : "";
  const url = collection.pageSlugPattern ? resolveUrl(collection.pageSlugPattern, form) : null;
  const live = record?.status === "published";

  return (
    <aside
      className="tw:flex tw:w-[420px] tw:flex-none tw:flex-col tw:gap-3 tw:overflow-y-auto tw:border-l tw:border-[var(--bk-border)] tw:px-4 tw:py-3"
      aria-label="Record preview"
      data-testid="cms-record-preview"
    >
      <div className="tw:flex tw:h-8 tw:items-center tw:gap-2">
        <h4 className="tw:m-0 tw:flex-1 tw:text-[13px] tw:leading-5 tw:font-semibold tw:text-[var(--bk-ink)]">Record preview</h4>
        <span
          className={`tw:inline-flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:leading-4 ${live ? "tw:text-[var(--bk-success-text)]" : "tw:text-[var(--bk-warning-text)]"}`}
          data-testid="cms-record-preview-status"
        >
          <span
            className={`tw:size-1.5 tw:rounded-full ${live ? "tw:bg-[var(--bk-success)]" : "tw:bg-[var(--bk-warning)]"}`}
            aria-hidden="true"
          />
          {live ? "Published" : "Draft · not published"}
        </span>
      </div>
      <p className="tw:m-0 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
        Read-only. This is how {title} will appear{url ? ` on ${url}` : ""} once published — editing happens in the form on the
        left.
      </p>
      <div className="tw:flex tw:flex-col tw:gap-2 tw:rounded-[8px] tw:border tw:border-[var(--bk-border)] tw:p-3" data-testid="cms-record-preview-card">
        {src ? (
          <img src={src} alt="" className="tw:h-32 tw:w-full tw:rounded-[6px] tw:object-cover" />
        ) : (
          <div className="tw:flex tw:h-32 tw:items-center tw:justify-center tw:rounded-[6px] tw:bg-[var(--bk-gray-100)] tw:text-[11px] tw:text-[var(--bk-ink-muted)]">
            No image selected
          </div>
        )}
        <div className="tw:flex tw:items-baseline tw:gap-2 tw:pt-1">
          <span className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-[16px] tw:leading-6 tw:font-semibold tw:text-[var(--bk-ink)]">{title}</span>
          {metaValue ? <span className="tw:flex-none tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">{metaValue}</span> : null}
        </div>
        {body && text(form[body.slug]) ? (
          <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]">{text(form[body.slug])}</p>
        ) : null}
      </div>
      {onDelete ? (
        <div className="tw:flex tw:justify-end">
          <Button size="xs" variant="secondary" className="tw:h-7 tw:px-3 tw:text-[12px] tw:text-[var(--bk-error-text)]" onClick={onDelete} data-testid="cms-record-preview-delete">
            Delete record…
          </Button>
        </div>
      ) : null}
    </aside>
  );
}

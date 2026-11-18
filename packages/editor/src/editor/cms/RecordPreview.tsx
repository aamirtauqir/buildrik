/**
 * RecordPreview — the record sheet's always-on "Preview (unsaved)" column
 * (2L9 165:520): the record as the site would draw it, from the FORM's
 * current values, so an edit shows here before it is saved. "Preview saved
 * record" opens the saved record on its collection page.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { CMSCollection, CMSField } from "@/shared/types/cms";
import { Button } from "@/editor/chrome-ui";
import { stripAllTags } from "@/shared/utils/html/sanitization";

const text = (v: unknown) => (v === undefined || v === null ? "" : String(v));
const firstOf = (fields: CMSField[], types: CMSField["type"][], skip: string[] = []) =>
  fields.find((f) => types.includes(f.type) && !skip.includes(f.slug));

/** The record as the site's card draws it — from `values` (the form's, or
 *  the saved record's for 183:20974): image, title, a summary, a short line. */
export function RecordCard({ collection, values, title, meta: showMeta = true }: { collection: CMSCollection; values: Record<string, unknown>; title: string; meta?: boolean }) {
  const fields = [...collection.fields].sort((a, b) => a.order - b.order);
  const display = collection.displayField ?? "name";
  const image = firstOf(fields, ["image"]);
  /* The summary under the title (an excerpt), then a short line under that
     (an author) — never the title itself or the URL slug. */
  const body = firstOf(fields, ["textarea", "richtext", "text"], [display, "slug"]);
  const meta = firstOf(fields, ["reference", "select", "text"], [display, "slug", body?.slug ?? ""]);
  const bodyText = body ? (body.type === "richtext" ? stripAllTags(text(values[body.slug])) : text(values[body.slug])) : "";
  const src = image ? text(values[image.slug]) : "";
  const metaValue = meta && meta.type !== "reference" ? text(values[meta.slug]) : "";
  return (
    <div className="tw:flex tw:flex-col tw:gap-4" data-testid="cms-record-preview-card">
      {src ? <img src={src} alt="" className="tw:h-32 tw:w-full tw:rounded-[6px] tw:object-cover" /> : null}
      <div className="tw:m-0 tw:text-[20px] tw:leading-7 tw:font-semibold tw:text-[var(--bk-ink)] tw:[overflow-wrap:anywhere]">{title}</div>
      {bodyText ? <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-soft)]">{bodyText}</p> : null}
      {showMeta && metaValue ? <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]">{metaValue}</p> : null}
    </div>
  );
}

export function RecordPreview({
  collection,
  form,
  title,
  onPreviewSaved,
  dirty,
}: {
  /** "Preview (unsaved)" while the form differs from the saved record (165:520); "Preview" once it matches (173:16169). */
  dirty: boolean;
  collection: CMSCollection;
  form: Record<string, unknown>;
  title: string;
  /** Absent for a record that is not saved yet — there is nothing saved to preview. */
  onPreviewSaved?: () => void;
}) {

  return (
    <aside
      className="tw:flex tw:w-[260px] tw:flex-none tw:flex-col tw:overflow-y-auto tw:pt-7"
      aria-label="Record preview"
      data-testid="cms-record-preview"
    >
      <h4 className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:font-semibold tw:text-[var(--bk-ink)]">{dirty ? "Preview (unsaved)" : "Preview"}</h4>
      <p className="tw:m-0 tw:mt-4 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">Reflects the values in this form.</p>
      <div className="tw:mt-5">
        <RecordCard collection={collection} values={form} title={title} />
      </div>
      {onPreviewSaved ? (
        <Button size="xs" variant="secondary" className="tw:mt-6 tw:h-8 tw:w-[260px] tw:text-[13px] tw:font-medium" onClick={onPreviewSaved} data-testid="cms-sheet-preview-template">
          Preview saved record
        </Button>
      ) : null}
    </aside>
  );
}

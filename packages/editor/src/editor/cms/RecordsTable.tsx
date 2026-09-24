/**
 * RecordsTable — a collection's records as a table (board 4428:143182).
 *
 * Columns come off the collection's own fields: the display field first, then
 * the next short fields in the user's order, then a fixed "Updated". Long-form
 * and media fields (description, rich text, photo) and the slug are left to
 * the record sheet — the board draws Name · Price · Category · Available ·
 * Updated from a collection that also holds Description, Slug and Photo.
 *
 * Sort: click a column head (asc → desc). Search: the topbar field (board
 * 6819:59209 "Search Menu items…"), passed in as `query`. Pagination: 50 rows
 * a page; the pager only draws when there is more than one page, since no
 * board draws one (every board's collection fits in a page).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { CMSCollection, CMSContentItem, CMSField } from "@/shared/types/cms";
import { Button, IconButton } from "@/editor/chrome-ui";
import { formatRelativeTime } from "@/shared/utils/relativeTime";
import { ChevronLeft, ChevronRight, TriangleAlert } from "lucide-react";

export const PAGE_SIZE = 50;

/** Field types the table leaves to the sheet: long text, media, the slug. */
const SHEET_ONLY: ReadonlySet<CMSField["type"]> = new Set([
  "textarea",
  "richtext",
  "image",
  "file",
  "multiselect",
]);

/* 4428:143479… — NAME 240, then 120 · 140 · 110, UPDATED 150. */
const FIELD_WIDTHS = ["tw:w-[120px]", "tw:w-[140px]", "tw:w-[110px]"] as const;
const MAX_EXTRA_COLUMNS = FIELD_WIDTHS.length;

const HEAD_ROW =
  "tw:flex tw:h-9 tw:flex-none tw:items-center tw:px-4 tw:bg-[var(--bk-gray-50)] tw:border-b tw:border-[var(--bk-border)]";
const HEAD_CELL =
  "tw:flex tw:h-9 tw:flex-none tw:items-center tw:overflow-hidden tw:text-[11px] tw:leading-4 tw:font-medium " +
  "tw:tracking-[0.88px] tw:uppercase tw:text-[var(--bk-gray-500)]";
/* Flowbite's Button, flattened to the head's own text: same-property
   utilities so twMerge displaces the xs size's height, padding and type. */
const HEAD_BTN =
  "tw:h-auto tw:min-h-0 tw:gap-1 tw:rounded-none tw:border-0 tw:bg-transparent tw:p-0 tw:text-[11px] tw:leading-4 " +
  "tw:font-medium tw:tracking-[0.88px] tw:uppercase tw:text-[var(--bk-gray-500)] tw:shadow-none " +
  "tw:enabled:hover:bg-transparent tw:enabled:hover:text-[var(--bk-ink)] tw:focus:ring-0";
const ROW =
  "tw:flex tw:h-10 tw:w-full tw:flex-none tw:items-center tw:px-4 tw:bg-[var(--bk-bg-panel)] tw:border-b tw:border-[var(--bk-border)] " +
  "tw:cursor-pointer tw:hover:bg-[var(--bk-gray-50)] tw:focus-visible:outline-none tw:focus-visible:[box-shadow:inset_var(--bk-shadow-focus)]";
const CELL = "tw:flex tw:h-10 tw:flex-none tw:items-center tw:gap-1.5 tw:overflow-hidden tw:pr-3 tw:text-[13px] tw:leading-5 tw:whitespace-nowrap";
const CELL_SOFT = `${CELL} tw:text-[var(--bk-ink-soft)]`;

export interface RecordsTableProps {
  collection: CMSCollection;
  records: CMSContentItem[];
  query: string;
  onOpenRecord: (id: string) => void;
}

type SortKey = { key: string; dir: "asc" | "desc" };

/** The field whose value names a record. */
function displayFieldOf(collection: CMSCollection): CMSField | undefined {
  return collection.fields.find((f) => f.slug === collection.displayField) ?? collection.fields[0];
}

/** A record's name, from its display field. */
export function recordTitle(collection: CMSCollection, record: CMSContentItem): string {
  const f = displayFieldOf(collection);
  const v = f ? record.data[f.slug] : undefined;
  return typeof v === "string" && v.trim() ? v : `Record ${record.id.slice(-4)}`;
}

/** A value as the table prints it. */
function cellText(field: CMSField, value: unknown): string {
  if (field.type === "boolean") return value ? "Yes" : "No";
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

export function RecordsTable({ collection, records, query, onOpenRecord }: RecordsTableProps) {
  const [sort, setSort] = React.useState<SortKey | null>(null);
  const [page, setPage] = React.useState(0);

  const nameField = displayFieldOf(collection);
  const extra = React.useMemo(
    () =>
      collection.fields
        .filter((f) => f !== nameField && f.slug !== "slug" && !SHEET_ONLY.has(f.type))
        .slice(0, MAX_EXTRA_COLUMNS),
    [collection, nameField],
  );

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? records.filter((r) =>
          collection.fields.some((f) => cellText(f, r.data[f.slug]).toLowerCase().includes(q)),
        )
      : records;
    if (!sort) return matched;
    const read = (r: CMSContentItem): string | number => {
      if (sort.key === "__updated") return Date.parse(r.updatedAt) || 0;
      const v = r.data[sort.key];
      return typeof v === "number" ? v : cellText(collection.fields.find((f) => f.slug === sort.key)!, v).toLowerCase();
    };
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...matched].sort((a, b) => {
      const x = read(a);
      const y = read(b);
      return x < y ? -dir : x > y ? dir : 0;
    });
  }, [records, query, sort, collection]);

  React.useEffect(() => setPage(0), [query, collection.id]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = rows.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null));

  const head = (key: string, label: string, width: string) => (
    <div
      className={`${HEAD_CELL} ${width}`}
      role="columnheader"
      aria-sort={sort?.key === key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <Button type="button" size="xs" color="light" className={HEAD_BTN} data-testid={`cms-th-${key}`} onClick={() => toggleSort(key)}>
        {label}
        {sort?.key === key ? <span aria-hidden="true">{sort.dir === "asc" ? "↑" : "↓"}</span> : null}
      </Button>
    </div>
  );

  return (
    <div className="tw:flex tw:min-h-0 tw:flex-1 tw:flex-col" role="table" aria-label={`${collection.name} records`} data-testid="cms-table">
      <div className={HEAD_ROW} role="row">
        {nameField ? head(nameField.slug, nameField.name, "tw:w-[240px]") : null}
        {extra.map((f, i) => head(f.slug, f.name, FIELD_WIDTHS[i]))}
        {head("__updated", "Updated", "tw:w-[150px]")}
      </div>
      <div className="tw:min-h-0 tw:flex-1 tw:overflow-y-auto">
        {visible.map((r) => (
          <div
            key={r.id}
            role="row"
            tabIndex={0}
            className={ROW}
            data-testid={`cms-row-${r.id}`}
            onClick={() => onOpenRecord(r.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpenRecord(r.id);
              }
            }}
          >
            <div role="cell" className={`${CELL} tw:w-[240px] tw:font-medium tw:text-[var(--bk-ink)]`}>
              {recordTitle(collection, r)}
              {r.status === "draft" ? (
                <span className="tw:text-[12px] tw:font-normal tw:text-[var(--bk-ink-muted)]" data-testid={`cms-row-draft-${r.id}`}>
                  · Draft
                </span>
              ) : null}
            </div>
            {extra.map((f, i) => (
              <div key={f.id} role="cell" className={`${CELL_SOFT} ${FIELD_WIDTHS[i]}`}>
                {/* 4428:143182 Tiramisu — a required value that is missing says
                    so in its own cell, so the table shows why a record is not
                    eligible for publishing. */}
                {f.validation?.required && isEmpty(r.data[f.slug]) ? (
                  <>
                    <TriangleAlert size={12} aria-hidden="true" />
                    {f.name} required
                  </>
                ) : (
                  cellText(f, r.data[f.slug])
                )}
              </div>
            ))}
            <div role="cell" className={`${CELL_SOFT} tw:w-[150px]`}>
              {r.updatedAt ? formatRelativeTime(Date.parse(r.updatedAt), { fallback: "weeks" }) : ""}
            </div>
          </div>
        ))}
        {query.trim() && rows.length === 0 ? (
          <div className="tw:flex tw:flex-col tw:items-center tw:gap-1 tw:pt-16 tw:text-center" data-testid="cms-no-results">
            <p className="tw:m-0 tw:text-[13px] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]">
              No {collection.name} match “{query.trim()}”
            </p>
            <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]">
              Search looks at every field of every record in this collection.
            </p>
          </div>
        ) : null}
      </div>
      {pages > 1 ? (
        <div
          className="tw:flex tw:h-10 tw:flex-none tw:items-center tw:justify-end tw:gap-2 tw:border-t tw:border-[var(--bk-border)] tw:px-4 tw:text-[12px] tw:text-[var(--bk-ink-muted)]"
          data-testid="cms-pager"
        >
          <span data-testid="cms-pager-range">
            {current * PAGE_SIZE + 1}–{Math.min(rows.length, (current + 1) * PAGE_SIZE)} of {rows.length}
          </span>
          <IconButton label="Previous page" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)} data-testid="cms-pager-prev">
            <ChevronLeft size={14} />
          </IconButton>
          <IconButton label="Next page" size="sm" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} data-testid="cms-pager-next">
            <ChevronRight size={14} />
          </IconButton>
        </div>
      ) : null}
    </div>
  );
}


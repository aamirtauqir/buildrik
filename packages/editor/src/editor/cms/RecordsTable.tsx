/**
 * RecordsTable — a collection's records (2L9 board 165:2 "Blog records at
 * scale").
 *
 * Toolbar: Search {collection}…, a status filter ("All statuses"), a sort
 * ("Updated · Newest" first) and Columns, which picks the field columns.
 * Columns: Title (the display field), Status, Updated, then the chosen field
 * columns — by default the first short fields; long text, media and the slug
 * stay in the record sheet unless chosen. A column head still sorts on click.
 * Footer: "1–50 of N records" with Previous / Next, 50 rows a page.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { CMSCollection, CMSContentItem, CMSField } from "@/shared/types/cms";
import { Badge, Button, Checkbox, Menu, Popover, Select, TextInput } from "@/editor/chrome-ui";
import { formatRelativeTime } from "@/shared/utils/relativeTime";
import { cmsRecordLabel, type CmsRecordStatus } from "@buildrik/shared/schemas/cms";
import type { ColorToken } from "@/themes/tokens.generated";
import { TriangleAlert } from "lucide-react";

export const PAGE_SIZE = 50;

/** Field types the table leaves to the sheet: long text, media, the slug. */
const SHEET_ONLY: ReadonlySet<CMSField["type"]> = new Set([
  "textarea",
  "richtext",
  "image",
  "file",
  "multiselect",
]);

/* 165:2 at 1440: Title takes the rest; Status 216, Updated 176, each
   chosen field 176. */
const DEFAULT_EXTRA_COLUMNS = 1;
const W_STATUS = "tw:w-[216px]";
const W_UPDATED = "tw:w-[176px]";
const W_FIELD = "tw:w-[176px]";

/* 165:2 — a 40-tall tinted head in sentence case, 13/20 medium. */
const HEAD_ROW =
  "tw:flex tw:h-10 tw:flex-none tw:items-center tw:pl-6 tw:bg-[var(--bk-bg-subtle)]";
const HEAD_CELL = "tw:flex tw:h-10 tw:items-center tw:overflow-hidden tw:pr-3 tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink-soft)]";
/* Flowbite's Button, flattened to the head's own text: same-property
   utilities so twMerge displaces the xs size's height, padding and type. */
const HEAD_BTN =
  "tw:h-auto tw:min-h-0 tw:gap-1 tw:rounded-none tw:border-0 tw:bg-transparent tw:p-0 tw:text-[13px] tw:leading-5 " +
  "tw:font-medium tw:text-[var(--bk-ink-soft)] tw:shadow-none " +
  "tw:enabled:hover:bg-transparent tw:enabled:hover:text-[var(--bk-ink)] tw:focus:ring-0";
const ROW =
  "tw:flex tw:h-10 tw:w-full tw:flex-none tw:items-center tw:pl-6 tw:bg-[var(--bk-bg-panel)] " +
  "tw:cursor-pointer tw:hover:bg-[var(--bk-gray-50)] tw:focus-visible:outline-none tw:focus-visible:[box-shadow:inset_var(--bk-shadow-focus)]";
const CELL = "tw:flex tw:h-10 tw:items-center tw:gap-1.5 tw:overflow-hidden tw:pr-3 tw:text-[13px] tw:leading-5 tw:whitespace-nowrap";
const CELL_SOFT = `${CELL} tw:text-[var(--bk-ink-soft)]`;
/* 165:2 toolbar: 32-tall controls on the page's 24 gutter. */
/* 165:2 draws the toolbar's fields filled (bg-subtle) on a hairline, no
   search glyph. */
const TOOL_SELECT =
  "tw:[&_select]:h-8 tw:[&_select]:py-0 tw:[&_select]:pl-2.5 tw:[&_select]:text-[13px] tw:[&_select]:rounded-[6px] " +
  "tw:[&_select]:bg-[var(--bk-bg-subtle)] tw:[&_select]:border-[var(--bk-border)]";
const TOOL_INPUT =
  "tw:[&_input]:h-8 tw:[&_input]:py-0 tw:[&_input]:pl-2.5 tw:[&_input]:text-[13px] tw:[&_input]:rounded-[6px] " +
  "tw:[&_input]:bg-[var(--bk-bg-subtle)] tw:[&_input]:border-[var(--bk-border)]";
const PAGER_BTN = "tw:h-8 tw:w-[112px] tw:px-3 tw:text-[13px] tw:leading-5 tw:font-medium tw:rounded-[6px]";

/* StatusBadge (2L9 500:342149): 20 tall, a tinted pill whose text always
   names the state, so it never rests on colour alone. Each tone names its
   token pair once; the class string spells the same tokens literally,
   because Tailwind only compiles class names it can read in source. */
export type StatusTone = "neutral" | "success" | "warning";
const BADGE =
  "tw:h-5 tw:rounded-[var(--bk-radius-sm)] tw:px-2 tw:py-0 tw:text-[length:var(--bk-text-12)] tw:font-medium tw:leading-4 tw:whitespace-nowrap";
export const STATUS_TONES: Record<StatusTone, { fg: ColorToken; bg: ColorToken; className: string }> = {
  neutral: { fg: "ink-soft", bg: "bg-subtle", className: "tw:text-[var(--bk-ink-soft)] tw:bg-[var(--bk-bg-subtle)]" },
  success: { fg: "success-text", bg: "success-tint", className: "tw:text-[var(--bk-success-text)] tw:bg-[var(--bk-success-tint)]" },
  warning: { fg: "warning-text", bg: "warning-tint", className: "tw:text-[var(--bk-warning-text)] tw:bg-[var(--bk-warning-tint)]" },
};

/** One badge per status in the CMS record schema (CMS_RECORD_STATUSES). */
const STATUS_BADGES: Record<CmsRecordStatus, { label: string; tone: StatusTone }> = {
  draft: { label: "Draft", tone: "neutral" },
  published: { label: "Published", tone: "success" },
  archived: { label: "Archived", tone: "neutral" },
};

/** A record's status badge. "Changed since publish" is a published record
 *  edited after its publish stamp; server rows carry no stamp, so they read
 *  Published. A status the schema does not know shows its raw label. */
export function recordStatusBadge(record: CMSContentItem): { label: string; tone: StatusTone } {
  const status: string = record.status;
  if (
    status === "published" &&
    record.publishedAt &&
    Date.parse(record.updatedAt) > Date.parse(record.publishedAt)
  ) {
    return { label: "Changed since publish", tone: "warning" };
  }
  return Object.prototype.hasOwnProperty.call(STATUS_BADGES, status)
    ? STATUS_BADGES[record.status]
    : { label: status, tone: "neutral" };
}

export interface RecordsTableProps {
  collection: CMSCollection;
  records: CMSContentItem[];
  onOpenRecord: (id: string) => void;
  /** A Reference cell's record name (by field key, then record id); absent
   *  until the referenced records are read. */
  referenceLabels?: ReadonlyMap<string, ReadonlyMap<string, string>>;
}

type SortKey = { key: string; dir: "asc" | "desc" };

/** The toolbar's named orders (165:2 "Updated · Newest"); a click on any
 *  other column head reads as that column in the select. */
const NAMED_SORTS: ReadonlyArray<{ id: string; label: string; sort: SortKey }> = [
  { id: "updated-desc", label: "Updated · Newest", sort: { key: "__updated", dir: "desc" } },
  { id: "updated-asc", label: "Updated · Oldest", sort: { key: "__updated", dir: "asc" } },
  { id: "title-asc", label: "Title · A–Z", sort: { key: "__title", dir: "asc" } },
  { id: "title-desc", label: "Title · Z–A", sort: { key: "__title", dir: "desc" } },
];

/** The status filter's choices: the schema's statuses plus the edited-after-publish state. */
const STATUS_FILTERS = ["Draft", "Published", "Changed since publish", "Archived"] as const;

/** The field whose value names a record. */
function displayFieldOf(collection: CMSCollection): CMSField | undefined {
  return collection.fields.find((f) => f.slug === collection.displayField) ?? collection.fields[0];
}

/** A record's name, from its display field. */
export function recordTitle(collection: CMSCollection, record: CMSContentItem): string {
  return cmsRecordLabel(collection, record.data) || `Record ${record.id.slice(-4)}`;
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

export function RecordsTable({ collection, records, onOpenRecord, referenceLabels }: RecordsTableProps) {
  /* A reference cell names its record — "Deleted record" for a target that
     is gone — never the raw id (UI-05). */
  const cell = (f: CMSField, v: unknown): string => {
    if (f.type !== "reference" || typeof v !== "string" || !v) return cellText(f, v);
    const labels = referenceLabels?.get(f.slug);
    return labels ? labels.get(v) ?? "Deleted record" : "";
  };
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>(NAMED_SORTS[0].sort);
  const [page, setPage] = React.useState(0);
  const [columnsOpen, setColumnsOpen] = React.useState(false);

  const nameField = displayFieldOf(collection);
  /* Columns: the field columns the person chose; until they choose, the first
     short field (165:2 draws one, Author). */
  const candidates = collection.fields.filter((f) => f !== nameField);
  /* A choice field (an author, a category) reads best in a narrow column;
     free text comes after. */
  const rank = (f: CMSField) => (["select", "reference", "boolean", "number", "date", "datetime"].includes(f.type) ? 0 : 1);
  const defaults = candidates
    .filter((f) => f.type !== "slug" && !SHEET_ONLY.has(f.type))
    .sort((a, b) => rank(a) - rank(b) || a.order - b.order)
    .slice(0, DEFAULT_EXTRA_COLUMNS)
    .map((f) => f.slug);
  const [chosen, setChosen] = React.useState<string[] | null>(null);
  const shownSlugs = chosen ?? defaults;
  const extra = candidates.filter((f) => shownSlugs.includes(f.slug));

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let matched = q
      ? records.filter((r) =>
          collection.fields.some((f) => cell(f, r.data[f.slug]).toLowerCase().includes(q)),
        )
      : records;
    if (status) matched = matched.filter((r) => recordStatusBadge(r).label === status);
    const sortField = collection.fields.find((f) => f.slug === sort.key);
    const read = (r: CMSContentItem): string | number => {
      if (sort.key === "__status") return recordStatusBadge(r).label.toLowerCase();
      if (sort.key === "__title") return recordTitle(collection, r).toLowerCase();
      if (sort.key === "__updated" || !sortField) return Date.parse(r.updatedAt) || 0;
      const v = r.data[sort.key];
      return typeof v === "number" ? v : cell(sortField, v).toLowerCase();
    };
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...matched].sort((a, b) => {
      const x = read(a);
      const y = read(b);
      return x < y ? -dir : x > y ? dir : 0;
    });
  }, [records, query, status, sort, collection, referenceLabels]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => setPage(0), [query, status, collection.id]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = rows.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  const toggleSort = (key: string) =>
    setSort((s) => (s.key !== key ? { key, dir: "asc" } : { key, dir: s.dir === "asc" ? "desc" : "asc" }));
  const named = NAMED_SORTS.find((n) => n.sort.key === sort.key && n.sort.dir === sort.dir);
  const headLabel = (key: string) =>
    key === "__status" ? "Status" : collection.fields.find((f) => f.slug === key)?.name ?? key;

  const head = (key: string, label: string, width: string) => {
    const sortKey = key === nameField?.slug ? "__title" : key;
    const dir = sort.key === sortKey ? sort.dir : null;
    /* The select names a toolbar order; only a head-chosen order marks its head. */
    const arrow = dir !== null && !named;
    return (
      <div
        key={key}
        className={`${HEAD_CELL} ${width}`}
        role="columnheader"
        aria-sort={dir === null ? "none" : dir === "asc" ? "ascending" : "descending"}
      >
        <Button type="button" size="xs" color="light" className={HEAD_BTN} data-testid={`cms-th-${key}`} onClick={() => toggleSort(sortKey)}>
          {label}
          {arrow ? <span aria-hidden="true">{dir === "asc" ? "↑" : "↓"}</span> : null}
        </Button>
      </div>
    );
  };

  const statusBadge = (r: CMSContentItem) => {
    const { label, tone } = recordStatusBadge(r);
    return (
      <Badge className={`${BADGE} ${STATUS_TONES[tone].className}`} data-tone={tone} data-testid={`cms-row-status-${r.id}`}>
        {label}
      </Badge>
    );
  };

  const first = rows.length === 0 ? 0 : current * PAGE_SIZE + 1;
  const last = Math.min(rows.length, (current + 1) * PAGE_SIZE);

  return (
    <div className="tw:flex tw:min-h-0 tw:flex-1 tw:flex-col" data-testid="cms-records">
      {/* 165:2 — Search · All statuses · Updated · Newest · Columns. */}
      <div className="tw:flex tw:h-12 tw:flex-none tw:items-center tw:gap-3 tw:pl-6 tw:pr-[67px]" data-testid="cms-records-toolbar">
        <TextInput
          type="search"
          sizing="sm"
          aria-label={`Search ${collection.name}`}
          placeholder={`Search ${collection.name}…`}
          className={`${TOOL_INPUT} tw:w-[520px] tw:flex-none`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && query) {
              e.stopPropagation();
              setQuery("");
            }
          }}
          data-testid="cms-ws-search"
        />
        <Select
          sizing="sm"
          aria-label="Status"
          className={`${TOOL_SELECT} tw:w-[180px]`}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          data-testid="cms-records-status-filter"
        >
          <option value="">All statuses</option>
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select
          sizing="sm"
          aria-label="Sort"
          className={`${TOOL_SELECT} tw:w-[192px]`}
          value={named?.id ?? "column"}
          onChange={(e) => {
            const next = NAMED_SORTS.find((n) => n.id === e.target.value);
            if (next) setSort(next.sort);
          }}
          data-testid="cms-records-sort"
        >
          {NAMED_SORTS.map((n) => (
            <option key={n.id} value={n.id}>
              {n.label}
            </option>
          ))}
          {named ? null : (
            <option value="column">
              {headLabel(sort.key)} · {sort.dir === "asc" ? "Ascending" : "Descending"}
            </option>
          )}
        </Select>
        <span className="tw:flex-1" />
        <Popover
          open={columnsOpen}
          onClose={() => setColumnsOpen(false)}
          label="Columns"
          placement="bottom-end"
          trigger={
            <Button size="xs" variant="ghost" className="tw:h-8 tw:px-3 tw:text-[13px] tw:font-medium" onClick={() => setColumnsOpen((o) => !o)} data-testid="cms-records-columns">
              Columns
            </Button>
          }
        >
          <Menu label="Columns">
            <div className="tw:flex tw:flex-col tw:gap-1 tw:p-2" data-testid="cms-records-columns-menu">
              {candidates.map((f) => (
                <label key={f.id} className="tw:flex tw:h-7 tw:items-center tw:gap-2 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
                  <Checkbox
                    checked={shownSlugs.includes(f.slug)}
                    onChange={(e) =>
                      setChosen(e.target.checked ? [...shownSlugs, f.slug] : shownSlugs.filter((s) => s !== f.slug))
                    }
                    data-testid={`cms-records-column-${f.slug}`}
                  />
                  {f.name}
                </label>
              ))}
            </div>
          </Menu>
        </Popover>
      </div>
      <div className="tw:flex tw:min-h-0 tw:flex-1 tw:flex-col" role="table" aria-label={`${collection.name} records`} data-testid="cms-table">
        <div className={HEAD_ROW} role="row">
          {nameField ? head(nameField.slug, "Title", "tw:min-w-0 tw:flex-1") : null}
          {head("__status", "Status", W_STATUS)}
          {head("__updated", "Updated", W_UPDATED)}
          {extra.map((f) => head(f.slug, f.name, W_FIELD))}
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
              <div role="cell" className={`${CELL} tw:min-w-0 tw:flex-1 tw:text-[var(--bk-ink)]`}>
                <span className="tw:truncate">{recordTitle(collection, r)}</span>
              </div>
              <div role="cell" className={`${CELL} ${W_STATUS}`}>
                {statusBadge(r)}
              </div>
              <div role="cell" className={`${CELL_SOFT} ${W_UPDATED}`}>
                <span className="tw:truncate">{r.updatedAt ? formatRelativeTime(Date.parse(r.updatedAt), { fallback: "weeks" }) : ""}</span>
              </div>
              {extra.map((f) => (
                <div key={f.id} role="cell" className={`${CELL_SOFT} ${W_FIELD}`}>
                  {/* 4428:143182 Tiramisu — a required value that is missing says
                      so in its own cell, so the table shows why a record is not
                      eligible for publishing. */}
                  {f.validation?.required && isEmpty(r.data[f.slug]) ? (
                    <>
                      <TriangleAlert size={12} aria-hidden="true" />
                      <span className="tw:truncate">{f.name} required</span>
                    </>
                  ) : (
                    /* Long values end in an ellipsis inside their column — an
                       excerpt ran on into Updated (165:2 live walk). */
                    <span className="tw:truncate" title={cell(f, r.data[f.slug])}>
                      {cell(f, r.data[f.slug])}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
          {(query.trim() || status) && rows.length === 0 ? (
            <div className="tw:flex tw:flex-col tw:items-center tw:gap-1 tw:pt-16 tw:text-center" data-testid="cms-no-results">
              <p className="tw:m-0 tw:text-[13px] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]">
                {query.trim() ? `No ${collection.name} match “${query.trim()}”` : `No ${status} records`}
              </p>
              <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]">
                Search looks at every field of every record in this collection.
              </p>
            </div>
          ) : null}
        </div>
      </div>
      {/* 165:2 — "1–50 of 1,000 records", Previous · Next. */}
      <div className="tw:flex tw:h-14 tw:flex-none tw:items-center tw:gap-3 tw:pl-6 tw:pr-[52px]" data-testid="cms-pager">
        <span className="tw:flex-1 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]" data-testid="cms-pager-range">
          {first}–{last} of {rows.length.toLocaleString("en-US")} record{rows.length === 1 ? "" : "s"}
        </span>
        <Button size="xs" variant="secondary" className={PAGER_BTN} disabled={current === 0} onClick={() => setPage(current - 1)} data-testid="cms-pager-prev">
          Previous
        </Button>
        <Button size="xs" variant="secondary" className={PAGER_BTN} disabled={current >= pages - 1} onClick={() => setPage(current + 1)} data-testid="cms-pager-next">
          Next
        </Button>
      </div>
    </div>
  );
}

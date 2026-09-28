/**
 * Breadcrumb — a path whose crumbs are places you can go (Inspector v4
 * header, board 1: "Home › Hero › Heading").
 *
 * A `nav` landmark named by `label`, an ordered list, every crumb but the
 * last a button, the last the current place (`aria-current="page"`, never
 * truncated). When the path is longer than `maxItems`, the middle collapses
 * to one "…" crumb that expands the full path in place.
 *
 * Native `<button>` here on purpose: chrome-ui owns the native elements
 * (Gate 24), and a flowbite Button's own min-height would make a 16px text
 * crumb 32 tall.
 *
 * @license BSD-3-Clause
 */
import React from "react";

export interface BreadcrumbItem {
  id: string;
  label: string;
  /** Absent on the current (last) crumb. */
  onSelect?: () => void;
}

export interface BreadcrumbProps {
  items: readonly BreadcrumbItem[];
  /** The landmark's name, e.g. "Element path". */
  label: string;
  /** Crumbs shown before the middle collapses (first, "…", then the tail). */
  maxItems?: number;
  className?: string;
  "data-testid"?: string;
}

const CRUMB =
  "tw:min-w-0 tw:max-w-[120px] tw:truncate tw:border-0 tw:bg-transparent tw:p-0 tw:cursor-pointer " +
  "tw:[font-family:var(--bk-font-ui)] tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)] tw:hover:text-[var(--bk-ink)] " +
  "tw:rounded-[2px] tw:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";
const CURRENT = "tw:shrink-0 tw:whitespace-nowrap tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const SEP = "tw:shrink-0 tw:px-1 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

export function Breadcrumb({ items, label, maxItems = 4, className, ...rest }: BreadcrumbProps) {
  const [expanded, setExpanded] = React.useState(false);
  /* A new path starts collapsed again. */
  const key = items.map((i) => i.id).join("/");
  React.useEffect(() => setExpanded(false), [key]);

  const collapse = !expanded && items.length > maxItems && maxItems >= 3;
  const tailCount = maxItems - 2;
  const shown: (BreadcrumbItem | "ellipsis")[] = collapse
    ? [items[0], "ellipsis", ...items.slice(items.length - tailCount)]
    : [...items];
  const hidden = collapse ? items.slice(1, items.length - tailCount) : [];

  return (
    <nav aria-label={label} className={className} data-testid={rest["data-testid"]}>
      <ol className="tw:m-0 tw:flex tw:min-w-0 tw:list-none tw:items-center tw:p-0">
        {shown.map((item, i) => {
          const last = i === shown.length - 1;
          const body =
            item === "ellipsis" ? (
              <button
                type="button"
                className={CRUMB}
                aria-label={`Show ${hidden.length} more: ${hidden.map((h) => h.label).join(", ")}`}
                onClick={() => setExpanded(true)}
              >
                …
              </button>
            ) : last ? (
              <span className={CURRENT} aria-current="page">
                {item.label}
              </span>
            ) : (
              <button type="button" className={CRUMB} title={item.label} onClick={item.onSelect}>
                {item.label}
              </button>
            );
          return (
            <li key={item === "ellipsis" ? "…" : item.id} className="tw:flex tw:min-w-0 tw:items-center">
              {body}
              {last ? null : (
                <span aria-hidden="true" className={SEP}>
                  ›
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

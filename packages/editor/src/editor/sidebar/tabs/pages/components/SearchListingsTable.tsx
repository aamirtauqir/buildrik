/**
 * SearchListingsTable — the "Search listings" view of the Pages panel
 * (prototype 50-pages). Where the page list answers "what pages exist", this
 * answers "what Google will show for each page" across the whole site at once —
 * the single-page SEO form doesn't scale past a handful of pages.
 *
 * Each card shows the EFFECTIVE title/description (page-set override vs inherited
 * site default), whether the page is indexed, and a computed status flag
 * (good / no description / duplicate title / hidden ok). Read-only summary;
 * clicking a card opens that page's settings to edit. All values are derived
 * from the live PageItem list — no new engine state.
 *
 * Layout: a stacked card per page (not a 5-column table) so the whole listing
 * reads top-to-bottom inside the ~340px rail without horizontal scroll. The
 * prototype's wide table is the same columns in a wide surface; this is the
 * rail-appropriate form.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { PageItem } from "../types";

interface SearchListingsTableProps {
  pages: PageItem[];
  onEditPage: (pageId: string) => void;
}

type Source = "custom" | "site default";
type Flag = { label: string; tone: "ok" | "warn" };

interface Row {
  page: PageItem;
  path: string;
  title: string;
  titleSource: Source;
  description: string | null; // null = missing
  descriptionSource: Source;
  indexed: boolean;
  flag: Flag;
}

// Effective value = the page's own override, else the inherited site default.
// Title falls back to the page name (what the engine renders when unset);
// description has no fallback — an unset description is a real SEO gap.
function buildRows(pages: PageItem[]): Row[] {
  const effectiveTitles = pages.map((p) => (p.seo?.metaTitle?.trim() || p.name).toLowerCase());
  const titleCounts = effectiveTitles.reduce<Record<string, number>>((acc, t) => {
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  return pages.map((page, i) => {
    const customTitle = page.seo?.metaTitle?.trim();
    const customDesc = page.seo?.metaDescription?.trim();
    const indexed = !page.seo?.noIndex;
    const title = customTitle || page.name;
    const description = customDesc || null;

    let flag: Flag;
    if (!indexed) flag = { label: "hidden ok", tone: "ok" };
    else if (!description) flag = { label: "no description", tone: "warn" };
    else if (titleCounts[effectiveTitles[i]] > 1) flag = { label: "duplicate title", tone: "warn" };
    else flag = { label: "good", tone: "ok" };

    return {
      page,
      path: page.isHome ? "/" : `/${page.slug || ""}`,
      title,
      titleSource: customTitle ? "custom" : "site default",
      description,
      descriptionSource: customDesc ? "custom" : "site default",
      indexed,
      flag,
    };
  });
}

/** "custom" / "site default" tag after a value. */
const SRC_TAG =
  "tw:flex-none tw:whitespace-nowrap tw:ml-[5px] tw:px-[5px] tw:py-px tw:rounded-[3px] " +
  "tw:text-[8.5px] tw:uppercase tw:tracking-[0.02em]";
const FIELD_LABEL =
  "tw:w-[34px] tw:flex-none tw:text-[9px] tw:uppercase tw:tracking-[0.03em] tw:text-gray-500";
const FLAG_PILL = "tw:whitespace-nowrap tw:px-1.5 tw:py-px tw:rounded-[3px] tw:border tw:text-[9px]";
const ELLIPSIS = "tw:overflow-hidden tw:text-ellipsis";

function SourceTag({ source }: { source: Source }) {
  return source === "custom" ? (
    <span className={`${SRC_TAG} tw:bg-blue-700 tw:text-white`}>custom</span>
  ) : (
    <span className={`${SRC_TAG} tw:border tw:border-dashed tw:border-gray-200 tw:text-gray-500`}>
      site default
    </span>
  );
}

function FlagPill({ flag }: { flag: Flag }) {
  const ok = flag.tone === "ok";
  return (
    <span
      className={`${FLAG_PILL} ${
        ok
          ? "tw:border-gray-200 tw:font-normal tw:text-gray-500"
          : "tw:border-gray-900 tw:font-semibold tw:text-gray-900"
      }`}
    >
      {flag.label}
    </span>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="tw:flex tw:items-baseline tw:gap-1.5 tw:min-w-0">
      <span className={FIELD_LABEL}>{label}</span>
      <span className="tw:flex tw:flex-wrap tw:items-center tw:min-w-0 tw:text-[11px] tw:text-gray-900">
        {children}
      </span>
    </div>
  );
}

export function SearchListingsTable({ pages, onEditPage }: SearchListingsTableProps) {
  const rows = React.useMemo(() => buildRows(pages), [pages]);
  const issues = rows.filter((r) => r.flag.tone === "warn");

  return (
    <div className="tw:flex tw:flex-col tw:gap-1.5 tw:px-2.5 tw:py-2 tw:overflow-y-auto">
      {rows.map((r) => (
        <div
          key={r.page.id}
          onClick={() => onEditPage(r.page.id)}
          title={`Edit ${r.page.name}'s search listing`}
          className="tw:flex tw:flex-col tw:gap-1 tw:px-[9px] tw:py-[7px] tw:rounded-md tw:border tw:border-gray-200 tw:cursor-pointer tw:hover:bg-gray-50"
        >
          <div className="tw:flex tw:items-center tw:gap-1.5">
            <strong className="tw:text-xs tw:text-gray-900">{r.page.name}</strong>
            <span className="tw:text-[10px] tw:text-gray-500">{r.path}</span>
            <span className="tw:flex tw:items-center tw:gap-[5px] tw:ml-auto">
              {!r.indexed && (
                <span className="tw:whitespace-nowrap tw:text-[9px] tw:text-gray-500">
                  hidden from Google
                </span>
              )}
              <FlagPill flag={r.flag} />
            </span>
          </div>
          <FieldRow label="Title">
            <span className={ELLIPSIS}>{r.title}</span>
            <SourceTag source={r.titleSource} />
          </FieldRow>
          <FieldRow label="Desc">
            {r.description ? (
              <>
                <span className={ELLIPSIS}>{r.description}</span>
                <SourceTag source={r.descriptionSource} />
              </>
            ) : (
              <span className="tw:text-gray-500">— missing —</span>
            )}
          </FieldRow>
        </div>
      ))}
      <p className="tw:mx-0.5 tw:mt-1 tw:mb-0 tw:text-[11px] tw:leading-normal tw:text-gray-500">
        {issues.length === 0 ? (
          <>All pages have a title &amp; description Google can use.</>
        ) : (
          <>
            <strong className="tw:text-gray-900">{issues.length}</strong>{" "}
            {issues.length === 1 ? "page needs" : "pages need"} attention — click a card to fix its search listing.
          </>
        )}
      </p>
    </div>
  );
}

export default SearchListingsTable;

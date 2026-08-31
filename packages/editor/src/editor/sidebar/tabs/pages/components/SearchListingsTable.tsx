/**
 * SearchListingsTable — the Listings view of the Pages panel, board 141:207.
 *
 * The board draws a compact four-column table — PAGE | TITLE | DESC | SCORE —
 * with a caps header band, 32h rows, "Set"/"Missing" for the description and
 * a mono score, plus an "Open full listings ›" footer link that widens the
 * drawer (the 700 view is the "full" table).
 *
 * Every value derives from the live PageItem list — no new engine state. The
 * score is a deterministic rollup of the real SEO signals (title override,
 * description present, indexed, duplicate title), not a stored number.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import type { PageItem } from "../types";

interface SearchListingsTableProps {
  pages: PageItem[];
  onEditPage: (pageId: string) => void;
  /** Board 141:207 footer: widens the drawer to the full-table view. */
  onOpenFull?: () => void;
}

interface Row {
  page: PageItem;
  title: string;
  hasDescription: boolean;
  score: number;
}

/**
 * Deterministic score from the real SEO signals. 100 minus penalties:
 * no description −40, title falling back to the page name −15, duplicate
 * effective title −25, noIndex −20. Clamped at 0.
 */
function buildRows(pages: PageItem[]): Row[] {
  const effectiveTitles = pages.map((p) => (p.seo?.metaTitle?.trim() || p.name).toLowerCase());
  const titleCounts = effectiveTitles.reduce<Record<string, number>>((acc, t) => {
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  return pages.map((page, i) => {
    const customTitle = page.seo?.metaTitle?.trim();
    const customDesc = page.seo?.metaDescription?.trim();
    let score = 100;
    if (!customDesc) score -= 40;
    if (!customTitle) score -= 15;
    if (titleCounts[effectiveTitles[i]] > 1) score -= 25;
    if (page.seo?.noIndex) score -= 20;
    return {
      page,
      title: customTitle || page.name,
      hasDescription: !!customDesc,
      score: Math.max(0, score),
    };
  });
}

const GRID = "tw:grid tw:grid-cols-[86px_1fr_56px_48px] tw:items-center tw:gap-2 tw:px-4";

export const SearchListingsTable: React.FC<SearchListingsTableProps> = ({
  pages,
  onEditPage,
  onOpenFull,
}) => {
  const rows = buildRows(pages);

  return (
    <div className="tw:flex tw:flex-col tw:flex-1 tw:min-h-0 tw:h-full" data-testid="pages-listings">
      {/* Board header band: caps 11 on gray. */}
      <div
        className={`${GRID} tw:h-7 tw:bg-[var(--bk-gray-50)] tw:text-[11px] tw:leading-4 tw:font-medium tw:tracking-[0.5px] tw:text-[var(--bk-ink-muted)]`}
        aria-hidden="true"
      >
        <span>PAGE</span>
        <span>TITLE</span>
        <span>DESC</span>
        <span className="tw:text-right">SCORE</span>
      </div>

      <div className="tw:flex-1 tw:min-h-0 tw:overflow-y-auto" role="table" aria-label="Search listings">
        {rows.map(({ page, title, hasDescription, score }) => (
          <div
            key={page.id}
            role="row"
            tabIndex={0}
            className={`${GRID} tw:h-8 tw:cursor-pointer tw:select-none hover:tw:bg-[var(--bk-bg-subtle)]`}
            data-testid={`listing-row-${page.id}`}
            onClick={() => onEditPage(page.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onEditPage(page.id); }
            }}
          >
            <span className="tw:truncate tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
              {page.name}
            </span>
            <span className="tw:truncate tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-muted)]">
              {title}
            </span>
            {hasDescription ? (
              <span className="tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-muted)]">Set</span>
            ) : (
              <span className="tw:text-[13px] tw:leading-5 tw:text-[var(--bk-error)]">Missing</span>
            )}
            <span
              className={`tw:text-right tw:font-[family-name:var(--bk-font-mono)] tw:text-[11px] tw:leading-4 tw:font-medium tw:tabular-nums ${
                score < 50 ? "tw:text-[var(--bk-error)]" : "tw:text-[var(--bk-ink-soft)]"
              }`}
            >
              {score}
            </span>
          </div>
        ))}
      </div>

      {/* Board footer: accent link — the 700 drawer is the full table. */}
      {onOpenFull && (
        <div className="tw:px-4 tw:py-2.5 tw:shrink-0">
          <Button
            color="light"
            size="xs"
            variant="link"
            data-testid="listings-open-full"
            onClick={onOpenFull}
          >
            Open full listings {"›"}
          </Button>
        </div>
      )}
    </div>
  );
};

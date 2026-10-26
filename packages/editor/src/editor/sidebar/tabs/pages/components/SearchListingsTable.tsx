/**
 * SearchListingsTable — the Listings view of the Pages panel, design-2l9 board
 * 63:21262: "Page and URL · SEO score · Visibility", one row per page, and
 * the note "Search names and URLs. Scores match Page settings → SEO."
 *
 * The score IS the Page settings SEO score (`calculateSeoScore`, the same
 * function and inputs the SEO tab grades) — so it is printed only where the
 * listing can know those inputs exactly: a page with its own SEO title. A page
 * that inherits its title from the site's title pattern reads "—" here and
 * shows its score in Page settings. (The old rollup had its own penalties and
 * disagreed with the SEO tab.)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import type { PageItem } from "../types";
import { calculateSeoScore } from "../utils/seoScore";
import { pageRoute } from "../utils/slug";
import { getStatusLabel } from "../utils/statusLabel";

interface SearchListingsTableProps {
  pages: PageItem[];
  onEditPage: (pageId: string) => void;
  /** The Pages search, applied to names and URLs. */
  search?: string;
  /** Widens the drawer to the full-table view (code-ahead, kept). */
  onOpenFull?: () => void;
}

/** The SEO tab's score for a page with its own SEO title; null otherwise. */
export function listingScore(page: PageItem): number | null {
  const title = page.seo?.metaTitle?.trim();
  if (!title) return null;
  return calculateSeoScore({
    title,
    desc: page.seo?.metaDescription?.trim() ?? "",
    slug: page.slug,
    allowIndex: !page.seo?.noIndex,
  });
}

/* The listing names a hidden page by its state alone. */
const visibilityOf = (page: PageItem) =>
  page.status === "hidden" ? "Hidden" : getStatusLabel(page.status ?? "live") ?? "Live";

const GRID = "tw:grid tw:grid-cols-[1fr_72px_72px] tw:items-center tw:gap-2 tw:px-4";

export const SearchListingsTable: React.FC<SearchListingsTableProps> = ({
  pages,
  onEditPage,
  search = "",
  onOpenFull,
}) => {
  const q = search.trim().toLowerCase();
  const rows = q ? pages.filter((p) => p.name.toLowerCase().includes(q) || pageRoute(p).toLowerCase().includes(q)) : pages;

  return (
    <div className="tw:flex tw:flex-col tw:flex-1 tw:min-h-0" data-testid="pages-listings">
      <div
        className={`${GRID} tw:h-7 tw:bg-[var(--bk-gray-50)] tw:text-[11px] tw:leading-4 tw:font-medium tw:text-[var(--bk-ink-muted)]`}
        aria-hidden="true"
      >
        <span>Page and URL</span>
        <span className="tw:text-right">SEO score</span>
        <span>Visibility</span>
      </div>

      <div className="tw:flex-1 tw:min-h-0 tw:overflow-y-auto" role="table" aria-label="Search listings">
        {rows.map((page) => {
          const score = listingScore(page);
          return (
            <div
              key={page.id}
              role="row"
              tabIndex={0}
              className={`${GRID} tw:h-11 tw:cursor-pointer tw:select-none hover:tw:bg-[var(--bk-bg-subtle)]`}
              data-testid={`listing-row-${page.id}`}
              onClick={() => onEditPage(page.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onEditPage(page.id); }
              }}
            >
              <span className="tw:flex tw:min-w-0 tw:flex-col">
                <span className="tw:truncate tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">{page.name}</span>
                <span className="tw:truncate tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)] tw:[font-family:var(--bk-font-mono)]">
                  {pageRoute(page)}
                </span>
              </span>
              <span
                className={`tw:text-right tw:[font-family:var(--bk-font-mono)] tw:text-[11px] tw:leading-4 tw:font-medium tw:tabular-nums ${
                  score !== null && score < 50 ? "tw:text-[var(--bk-error)]" : "tw:text-[var(--bk-ink-soft)]"
                }`}
                data-testid={`listing-score-${page.id}`}
              >
                {score ?? "—"}
              </span>
              <span className="tw:truncate tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]" data-testid={`listing-visibility-${page.id}`}>
                {visibilityOf(page)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="tw:flex tw:shrink-0 tw:flex-col tw:gap-1 tw:px-4 tw:py-2">
        <p className="tw:m-0 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="listings-note">
          Search names and URLs. Scores match Page settings → SEO.
        </p>
        {onOpenFull && (
          <Button
            color="light"
            size="xs"
            variant="link"
            className="tw:h-5 tw:self-start tw:px-0"
            data-testid="listings-open-full"
            onClick={onOpenFull}
          >
            Open full listings {"›"}
          </Button>
        )}
      </div>
    </div>
  );
};

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
 * Board geometry (720 wide): a 40-tall header in 13/600 ink, 52-tall rows with
 * the page glyph, name over URL, score and visibility in fixed columns from
 * x476 / x556, and the row's ⋯ (the same page menu as the Pages view). The
 * note sits under the last row; the caller keeps the Pages footer below.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { File, House } from "lucide-react";
import { IconButton } from "@/editor/chrome-ui";
import type { PageItem } from "../types";
import { calculateSeoScore } from "../utils/seoScore";
import { pageRoute } from "../utils/slug";
import { getStatusLabel } from "../utils/statusLabel";

interface SearchListingsTableProps {
  pages: PageItem[];
  onEditPage: (pageId: string) => void;
  /** The row's ⋯ — opens the page menu at the click. */
  onRowMenu: (pageId: string, x: number, y: number) => void;
  /** The Pages search, applied to names and URLs. */
  search?: string;
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

const GRID = "tw:grid tw:grid-cols-[minmax(0,1fr)_80px_120px_32px] tw:items-center tw:px-3";

export const SearchListingsTable: React.FC<SearchListingsTableProps> = ({ pages, onEditPage, onRowMenu, search = "" }) => {
  const q = search.trim().toLowerCase();
  const rows = q ? pages.filter((p) => p.name.toLowerCase().includes(q) || pageRoute(p).toLowerCase().includes(q)) : pages;

  return (
    <div className="tw:flex tw:min-h-0 tw:flex-1 tw:flex-col tw:overflow-y-auto" data-testid="pages-listings">
      <div
        className={`${GRID} tw:mb-2.5 tw:h-10 tw:shrink-0 tw:text-[13px] tw:leading-5 tw:font-semibold tw:text-[var(--bk-ink)]`}
        aria-hidden="true"
      >
        <span>Page and URL</span>
        <span>SEO score</span>
        <span>Visibility</span>
      </div>

      <div role="table" aria-label="Search listings">
        {rows.map((page) => {
          const score = listingScore(page);
          const Glyph = page.isHome ? House : File;
          return (
            <div
              key={page.id}
              role="row"
              tabIndex={0}
              className={`${GRID} tw:h-13 tw:cursor-pointer tw:select-none tw:rounded-md hover:tw:bg-[var(--bk-bg-subtle)]`}
              data-testid={`listing-row-${page.id}`}
              onClick={() => onEditPage(page.id)}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onEditPage(page.id); }
              }}
            >
              <span className="tw:flex tw:min-w-0 tw:items-center tw:gap-2 tw:pl-2">
                <Glyph size={16} strokeWidth={1.8} className="tw:shrink-0 tw:text-[var(--bk-ink-soft)]" aria-hidden="true" />
                <span className="tw:flex tw:min-w-0 tw:flex-col">
                  <span className="tw:truncate tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">{page.name}</span>
                  <span className="tw:truncate tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">{pageRoute(page)}</span>
                </span>
              </span>
              <span
                className={`tw:text-[13px] tw:leading-5 tw:tabular-nums ${
                  score !== null && score < 50 ? "tw:text-[var(--bk-error)]" : "tw:text-[var(--bk-ink)]"
                }`}
                data-testid={`listing-score-${page.id}`}
              >
                {score ?? "—"}
              </span>
              <span className="tw:truncate tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-muted)]" data-testid={`listing-visibility-${page.id}`}>
                {visibilityOf(page)}
              </span>
              <IconButton
                label={`More options for ${page.name}`}
                aria-haspopup="menu"
                data-testid={`listing-menu-${page.id}`}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onRowMenu(page.id, Math.min(e.clientX, window.innerWidth - 288), e.clientY);
                }}
              >
                ⋯
              </IconButton>
            </div>
          );
        })}
      </div>

      <p className="tw:m-0 tw:px-3 tw:pt-3 tw:pb-2 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="listings-note">
        Search names and URLs. Scores match Page settings → SEO.
      </p>
    </div>
  );
};

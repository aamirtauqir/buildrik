/**
 * TemplatePagination — page-number bar for the Templates grid.
 *
 * Renders Prev / numbered pages / Next. Hides itself when there's only one
 * page. Numbered buttons use aria-current to mark the active page.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface TemplatePaginationProps {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export const TemplatePagination: React.FC<TemplatePaginationProps> = ({
  currentPage,
  totalPages,
  onChange,
}) => {
  if (totalPages <= 1) return null;

  const goPrev = () => onChange(Math.max(1, currentPage - 1));
  const goNext = () => onChange(Math.min(totalPages, currentPage + 1));

  // For modest totals, list every page. Above ~8 pages we'd want windowing,
  // but the templates catalog is small enough that this stays simple.
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="tpl-pagination" aria-label="Templates pagination">
      <button
        type="button"
        className="tpl-pagination-btn tpl-pagination-prev"
        onClick={goPrev}
        disabled={currentPage <= 1}
        aria-label="Previous page"
      >
        ‹
      </button>

      {pages.map((p) => {
        const isActive = p === currentPage;
        return (
          <button
            key={p}
            type="button"
            className={`tpl-pagination-btn tpl-pagination-page${
              isActive ? " tpl-pagination-page--active" : ""
            }`}
            onClick={() => onChange(p)}
            aria-current={isActive ? "page" : undefined}
            aria-label={`Page ${p}`}
          >
            {p}
          </button>
        );
      })}

      <button
        type="button"
        className="tpl-pagination-btn tpl-pagination-next"
        onClick={goNext}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  );
};

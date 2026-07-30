/**
 * TemplatePagination — page-number bar for the Templates grid.
 *
 * Renders Prev / numbered pages / Next. Hides itself when there's only one
 * page. Numbered buttons use aria-current to mark the active page.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "flowbite-react";

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

  // Build windowed page list: always show 1 + last, current ± 1, ellipsis in gaps.
  // Matches prototype-v3 §1 pattern: ‹ 1 2 3 … 7 ›
  const windowed: (number | "…")[] = [];
  const add = (p: number | "…") => {
    if (p === "…" || !windowed.includes(p)) windowed.push(p);
  };
  if (totalPages <= 5) {
    for (let p = 1; p <= totalPages; p++) add(p);
  } else {
    add(1);
    if (currentPage > 3) add("…");
    for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) {
      add(p);
    }
    if (currentPage < totalPages - 2) add("…");
    add(totalPages);
  }

  return (
    <nav className="tpl-pagination" aria-label="Templates pagination">
      <Button
        type="button"
        className="tpl-pagination-btn tpl-pagination-prev"
        onClick={goPrev}
        disabled={currentPage <= 1}
        aria-label="Previous page"
      >
        ‹
      </Button>
      {windowed.map((p, i) => {
        if (p === "…") {
          return (
            <span key={`gap-${i}`} className="tpl-pagination-gap" aria-hidden="true">…</span>
          );
        }
        const isActive = p === currentPage;
        return (
          <Button
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
          </Button>
        );
      })}
      <Button
        type="button"
        className="tpl-pagination-btn tpl-pagination-next"
        onClick={goNext}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
      >
        ›
      </Button>
    </nav>
  );
};

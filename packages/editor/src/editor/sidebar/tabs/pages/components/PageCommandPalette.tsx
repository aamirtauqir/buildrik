/**
 * PageCommandPalette — ⌘K fuzzy-search overlay for quick page navigation.
 *
 * Triggered from PagesTab via ⌘K / Ctrl+K.
 * Shows all pages with fuzzy name filter. Pressing Enter or clicking
 * a row selects that page in the composer.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { PageItem } from "../types";

interface Props {
  pages: PageItem[];
  onSelect: (pageId: string) => void;
  onClose: () => void;
}

function statusLabel(status: PageItem["status"]): string {
  switch (status) {
    case "draft":    return "Draft";
    case "hidden":   return "Hidden";
    case "password": return "Password";
    case "external": return "External";
    case "error":    return "Error";
    default:         return "Live";
  }
}

function fuzzyMatch(query: string, target: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

export const PageCommandPalette: React.FC<Props> = ({ pages, onSelect, onClose }) => {
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const filtered = React.useMemo(
    () => pages.filter((p) => fuzzyMatch(query, p.name)),
    [query, pages]
  );

  // Reset active index when filtered list changes
  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Focus input on mount
  React.useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  // Scroll active item into view
  React.useEffect(() => {
    const item = listRef.current?.querySelector<HTMLElement>(
      `[data-palette-index="${activeIndex}"]`
    );
    item?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const page = filtered[activeIndex];
      if (page) {
        onSelect(page.id);
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleItemClick = (pageId: string) => {
    onSelect(pageId);
    onClose();
  };

  return (
    <div
      className="pg-palette-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Page search"
      onClick={handleBackdropClick}
    >
      <div className="pg-palette">
        {/* Search input */}
        <div className="pg-palette__search-wrap">
          <svg
            className="pg-palette__search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            className="pg-palette__input"
            placeholder="Search pages…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Search pages"
            aria-autocomplete="list"
            aria-activedescendant={
              filtered[activeIndex] ? `pg-palette-item-${filtered[activeIndex].id}` : undefined
            }
            autoComplete="off"
          />
          <kbd className="pg-palette__esc-hint">esc</kbd>
        </div>

        {/* Results list */}
        <div
          ref={listRef}
          className="pg-palette__list aqb-scrollbar"
          role="listbox"
          aria-label="Pages"
        >
          {filtered.length === 0 ? (
            <div className="pg-palette__empty">No pages match &ldquo;{query}&rdquo;</div>
          ) : (
            filtered.map((page, idx) => (
              <div
                key={page.id}
                id={`pg-palette-item-${page.id}`}
                className={[
                  "pg-palette__item",
                  idx === activeIndex ? "pg-palette__item--active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                role="option"
                aria-selected={idx === activeIndex}
                data-palette-index={idx}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => handleItemClick(page.id)}
              >
                {/* Page icon */}
                <svg
                  className="pg-palette__item-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {page.status === "external" ? (
                    <>
                      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                    </>
                  ) : (
                    <>
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </>
                  )}
                </svg>

                <span className="pg-palette__item-name">{page.name}</span>

                {page.isHome && (
                  <span className="pg-palette__item-home" aria-label="Homepage">HOME</span>
                )}

                <span
                  className={`pg-palette__item-status pg-palette__item-status--${page.status ?? "live"}`}
                >
                  {statusLabel(page.status)}
                </span>

                {page.isActive && (
                  <span className="pg-palette__item-active-dot" aria-label="Currently active" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="pg-palette__footer">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
};

PageCommandPalette.displayName = "PageCommandPalette";

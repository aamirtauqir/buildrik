/**
 * PageCommandPalette — Cmd+K fuzzy-search overlay for quick page navigation.
 *
 * Triggered from PagesTab via Cmd+K / Ctrl+K. Pressing Enter or clicking a
 * row selects that page in the composer.
 *
 * IRON RULE: status labels come from the centralized getStatusLabel util.
 * Pre-fix bug: this file had its own switch statement missing case 'scheduled',
 * causing scheduled pages to render as 'Live'. The util's exhaustive
 * Record<PageStatus, string> map prevents this class of bug at the type level.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Kbd } from "@/editor/chrome-ui";
import { TextField } from "@/editor/chrome-ui";
import type { PageItem } from "../types";
import { getStatusLabel } from "../utils/statusLabel";

interface Props {
  pages: PageItem[];
  onSelect: (pageId: string) => void;
  onClose: () => void;
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
    [query, pages],
  );

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  React.useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  React.useEffect(() => {
    const item = listRef.current?.querySelector<HTMLElement>(
      `[data-palette-index="${activeIndex}"]`,
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
      className="bd-pg-palette-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Page search"
      onClick={handleBackdropClick}
    >
      <div className="bd-pg-palette">
        <TextField
          ref={inputRef}
          type="text"
          className="bd-pg-palette-input"
          placeholder="Search pages…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Search pages"
          aria-autocomplete="list"
          aria-activedescendant={
            filtered[activeIndex] ? `bd-pg-palette-item-${filtered[activeIndex].id}` : undefined
          }
          autoComplete="off"
        />

        <div
          ref={listRef}
          className="bd-pg-palette-list"
          role="listbox"
          aria-label="Pages"
        >
          {filtered.length === 0 ? (
            <div className="bd-pg-palette-empty">No pages match &ldquo;{query}&rdquo;</div>
          ) : (
            filtered.map((page, idx) => {
              const label = getStatusLabel(page.status ?? "live");
              return (
                <div
                  key={page.id}
                  id={`bd-pg-palette-item-${page.id}`}
                  className={`bd-pg-palette-item${idx === activeIndex ? " active" : ""}`}
                  role="option"
                  aria-selected={idx === activeIndex}
                  data-palette-index={idx}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => handleItemClick(page.id)}
                >
                  <span className="bd-pg-palette-item-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                  </span>

                  <span className="bd-pg-palette-item-name">{page.name}</span>

                  {page.isHome && (
                    <span className="bd-pg-home-chip" aria-label="Homepage">
                      <span className="dot" aria-hidden="true" />
                      Home
                    </span>
                  )}

                  {label && (
                    <span
                      className={`bd-pg-chip ${page.status ?? "live"}`}
                      aria-label={`${page.status ?? "live"} status`}
                    >
                      <span className="dot" aria-hidden="true" />
                      {label}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="bd-pg-palette-footer">
          <span><Kbd>↑↓</Kbd> navigate</span>
          <span><Kbd>↵</Kbd> select</span>
          <span><Kbd>esc</Kbd> close</span>
        </div>
      </div>
    </div>
  );
};

PageCommandPalette.displayName = "PageCommandPalette";

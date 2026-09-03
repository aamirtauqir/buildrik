/**
 * PageCommandPalette — ⌘K jump-to-page, board 1171:4807.
 *
 * The board draws it as a 256-wide dropdown ANCHORED IN THE PANEL under the
 * header, not the screen-centred 560-wide modal on a scrim this used to be:
 * the palette navigates the list it is sitting on, so it stays on that
 * surface. 256 is the drawer's 280 less a 12 gutter each side — the 296 this
 * carried was the same arithmetic against the old 320 drawer, and only the
 * `max-width` clamp in PagesTab.css kept it on screen after the drawer moved.
 * Rows are name + the home ⌂ glyph, active row on --bk-accent-tint. No status
 * chips, no file icons, no shortcut footer — the board draws none of them,
 * and the list they duplicated is two rows away.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { TextField } from "@/editor/chrome-ui";
import type { PageItem } from "../types";

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
          placeholder="go to page…"
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
            filtered.map((page, idx) => (
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
                <span className="bd-pg-palette-item-name">{page.name}</span>
                {page.isHome && (
                  <span className="bd-pg-palette-item-home" aria-label="Homepage">
                    {"\u2302"}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

PageCommandPalette.displayName = "PageCommandPalette";

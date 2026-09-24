/**
 * PageTabBar - Horizontal tab bar for page switching
 *
 * Tabs only SWITCH (owner decision 14, 2026-09-21; audit G1-097 SH-77/78).
 * Rename, duplicate, set-as-homepage and delete live in the Pages panel's
 * row menu — this bar carried a second context menu (right-click / ⇧F10),
 * an inline F2 rename with its own validation popover and its own delete
 * confirm, all of them a second implementation of the panel's.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import { EVENTS } from "../../shared/constants";
import type { PageData } from "../../shared/types";
import { useDirtyPages } from "../shared/useDirtyPages";
// ============================================================================
// TYPES
// ============================================================================

interface PageTabBarProps {
  composer: Composer | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const PageTabBar: React.FC<PageTabBarProps> = ({ composer }) => {
  const [pages, setPages] = React.useState<PageData[]>([]);
  const [activePageId, setActivePageId] = React.useState<string | null>(null);
  const dirtyPages = useDirtyPages(composer);

  // Sync pages from composer — subscribe to all page events
  React.useEffect(() => {
    if (!composer) return;

    const syncPages = () => {
      const allPages = composer.elements.getAllPages();
      setPages(allPages);
      const active = composer.elements.getActivePage();
      setActivePageId(active?.id ?? null);
    };

    syncPages();
    /* PROJECT_CHANGED is the whole list: PageManager announces create, delete
       and activate through it with a `type` discriminator (:91, :270, :225).
       The four bare "page:*" names that sat beside it are emitted by nothing —
       this bar worked only because the one real name was also here.

       PROJECT_LOADED is the other half, and its absence hid the entire bar.
       The pages arrive asynchronously: this component mounts against an empty
       project (`pages.length === 0` → renders null), the project then loads and
       emits PROJECT_LOADED — which nothing here listened for. So after a plain
       page load there was no tab bar at all, and it appeared only once some
       unrelated edit happened to fire PROJECT_CHANGED. Found live 2026-08-14
       against board 435:2348. */
    composer.on(EVENTS.PROJECT_CHANGED, syncPages);
    composer.on(EVENTS.PROJECT_LOADED, syncPages);
    return () => {
      composer.off(EVENTS.PROJECT_CHANGED, syncPages);
      composer.off(EVENTS.PROJECT_LOADED, syncPages);
    };
  }, [composer]);

  const handleTabClick = (pageId: string) => {
    composer?.elements.setActivePage(pageId);
  };

  if (!composer || pages.length === 0) return null;

  return (
    <div className={BAR}>
      {/* Board 4418:123573: the tabs only (no ⌂ glyph, no "+" — Add page
          lives in the Pages panel, decision #19). */}
      <div className={ROW}>
        {/* Tab list with keyboard navigation */}
        <div
          className={TABS}
          role="tablist"
          aria-label="Site pages"
          onKeyDown={(e) => {
            const tabs = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]'));
            const idx = tabs.indexOf(document.activeElement as HTMLElement);
            if (e.key === "ArrowRight") {
              e.preventDefault();
              tabs[(idx + 1) % tabs.length]?.focus();
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              tabs[(idx - 1 + tabs.length) % tabs.length]?.focus();
            }
          }}
        >
          {pages.map((page) => (
            <div
              key={page.id}
              role="tab"
              tabIndex={page.id === activePageId ? 0 : -1}
              aria-selected={page.id === activePageId}
              aria-label={`${page.name}${page.isHome ? ", Homepage" : ""}${dirtyPages.has(page.id) ? ", unsaved changes" : ""}`}
              onClick={() => handleTabClick(page.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleTabClick(page.id);
                }
              }}
              className={`${TAB} ${page.id === activePageId ? TAB_ACTIVE : TAB_RESTING}`}
              data-testid={`page-tab-${page.id}`}
            >
              <span className={TAB_NAME} data-testid={`page-tab-name-${page.id}`}>
                {page.name}
              </span>
              {dirtyPages.has(page.id) && (
                <span className={DIRTY_DOT} aria-hidden="true" title="Unsaved changes" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// CLASSES
// ============================================================================

/* Board 4418:123573 (parity V1 #5): a 36-tall WHITE strip at the TOP of the
   canvas column with a hairline under it; the active page is a gray-100
   rounded chip, resting pages are muted text; the dirty dot is amber. */
const BAR = "tw:relative tw:z-[1] tw:flex-none tw:h-9 tw:border-b tw:border-[var(--bk-gray-100)] tw:bg-[var(--bk-bg-card)]";
const ROW = "tw:flex tw:h-full tw:items-center tw:gap-2 tw:px-2";
const TABS = "tw:flex tw:min-w-0 tw:items-center tw:gap-1 tw:overflow-x-auto";
const TAB =
  "tw:flex tw:h-7 tw:items-center tw:gap-1.5 tw:px-2.5 tw:whitespace-nowrap tw:cursor-pointer tw:rounded-md tw:text-[13px]";
const TAB_RESTING = "tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:bg-[var(--bk-gray-50)]";
const TAB_ACTIVE = "tw:bg-[var(--bk-gray-100)] tw:text-[var(--bk-ink)]";
/** inline-block is required for overflow+ellipsis to trigger on a span. */
const TAB_NAME = "tw:inline-block tw:max-w-30 tw:overflow-hidden tw:text-ellipsis tw:align-middle";
const DIRTY_DOT = "tw:size-1.5 tw:flex-none tw:rounded-full tw:bg-[var(--bk-warning)]";
export default PageTabBar;

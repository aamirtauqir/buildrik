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
import { Button } from "@/editor/chrome-ui";
import type { Composer } from "../../engine";
import { EVENTS } from "../../shared/constants";
import type { PageData } from "../../shared/types";
import { useDirtyPages } from "../shared/useDirtyPages";
// ============================================================================
// TYPES
// ============================================================================

interface PageTabBarProps {
  composer: Composer | null;
  /**
   * View mode. Switching pages is looking, so the tabs stay — Figma's view
   * mode navigates a file too. Adding a page is not, so the + button is
   * withheld. Hiding the rail and the inspector had left it reachable here.
   */
  readOnly?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const PageTabBar: React.FC<PageTabBarProps> = ({ composer, readOnly = false }) => {
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

  /* Decision #19: "+" asks for the New-page modal, like every Add-page door. */
  const handleAddPage = () => composer?.emit(EVENTS.UI_NEW_PAGE_REQUESTED, {});

  if (!composer || pages.length === 0) return null;

  return (
    <div className={BAR}>
      {/* Outer flex row — tablist + add button side by side */}
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
              {page.isHome && (
                <span
                  className={`tw:text-[12px] tw:font-medium ${page.id === activePageId ? "tw:text-[var(--bk-ink-soft)]" : "tw:text-[var(--bk-ink-muted)]"}`}
                  data-testid={`page-tab-home-${page.id}`}
                  aria-hidden="true"
                >
                  {"\u2302"}
                </span>
              )}
              <span className={TAB_NAME} data-testid={`page-tab-name-${page.id}`}>
                {page.name}
              </span>
              {dirtyPages.has(page.id) && (
                <span className={DIRTY_DOT} aria-hidden="true" title="Unsaved changes" />
              )}
            </div>
          ))}
        </div>
        {/* Add button outside tablist — ARIA: only role="tab" may be tablist children */}
        {readOnly ? null : (
        <Button
          onClick={handleAddPage}
          className={ADD_BTN}
          data-testid="page-tab-add"
          title="Add page"
          aria-label="Add new page"
        >
          +
        </Button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// CLASSES
// ============================================================================

/** The strip carries the app background so the active tab (bg-card) reads as
 *  proud of it. Both were bg-card before, which left the active page marked
 *  only by a 500 weight and a 5%-alpha shadow — invisible in practice.
 *  Figma board B9.7 is the record. */
/* Board 435:2348: the active tab's white surface runs the full height of the
   strip, flush with the bar's own bottom edge — a browser-tab affordance,
   read as fused with the canvas below. ROW used to give every tab an even
   `py-1`, which centered the active tab's box with a 4px gap of app-background
   showing beneath it instead of touching the border. Dropping ROW's bottom
   padding and aligning to the row's end lets the active tab reach it; the
   resting tabs (which carry no visible surface either way) get that 4px back
   as their own margin so the row's overall height is unchanged. */
const BAR = "tw:relative tw:border-y tw:border-[var(--bk-gray-200)] tw:bg-[var(--bk-bg-app)]";
const ROW = "tw:flex tw:items-end tw:gap-2 tw:px-2 tw:pt-1";
const TABS = "tw:flex tw:min-w-0 tw:items-end tw:gap-0.5 tw:overflow-x-auto";
/* gap 6, not 4: board 435:2352/2365/2369 all draw the home glyph, the label
   and the dirty dot 6px apart. */
const TAB =
  "tw:flex tw:items-center tw:gap-1.5 tw:px-3 tw:py-1.5 tw:whitespace-nowrap tw:cursor-pointer " +
  "tw:rounded-t-md tw:rounded-b-none tw:text-[13px]";
const TAB_RESTING = "tw:mb-1 tw:border-0 tw:bg-transparent tw:text-[var(--bk-ink-soft)]";
const TAB_ACTIVE =
  "tw:border tw:border-b-0 tw:border-[var(--bk-gray-200)] tw:bg-white tw:font-medium tw:text-[var(--bk-ink)] " +
  "tw:[box-shadow:var(--bk-shadow-raised)]";
/** inline-block is required for overflow+ellipsis to trigger on a span. */
const TAB_NAME = "tw:inline-block tw:max-w-30 tw:overflow-hidden tw:text-ellipsis tw:align-middle";
const DIRTY_DOT = "tw:size-1.5 tw:flex-none tw:rounded-full tw:bg-[var(--bk-blue-500)]";
const ADD_BTN =
  /* mb-1 mirrors TAB_RESTING — ROW aligns to its own bottom edge now (see
     ROW/TAB_ACTIVE above), so this needs the same offset the resting tabs
     carry to stay at its old, vertically-centered-looking position. */
  "tw:flex tw:items-center tw:justify-center tw:size-6 tw:ml-1 tw:mb-1 tw:p-0 tw:rounded tw:text-sm tw:font-medium " +
  /* ink-soft, not ink-muted: this sits on the tab bar's gray-100 where muted
     measures 4.39:1, under the 4.5 floor. Same pairing as the panel subtitle. */
  "tw:border tw:border-dashed tw:border-[var(--bk-gray-400)] tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:bg-[var(--bk-gray-100)]";
export default PageTabBar;

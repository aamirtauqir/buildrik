/**
 * HistoryTab — Version history sidebar panel
 *
 * Layout:
 *   PanelHeader → view-switcher (Saves / Published) → search-bar → list-container
 * Inside Saves, a filter row switches between named milestones and raw recent
 * edits — the old top-level "Changes" tab (M1).
 * Time-Travel scrubber drawer renders at body level when active.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { PanelFrame, Button, TextField } from "@/editor/chrome-ui";
import { useHistoryState } from "../../../../shared/hooks/useHistoryState";
import { useAutoMilestone } from "../../../../shared/hooks/useAutoMilestone";
import { VersionHistoryPanel } from "../../../panels/VersionHistoryPanel";
import { PublishHistory } from "../../../shell/PublishHistory";
import { ActivityView } from "./components/ActivityView";
import { TimeTravelScrubber } from "./components/TimeTravelScrubber";
import { MilestoneSuggestionBanner } from "./components/MilestoneSuggestionBanner";
import type { HistoryView, SavesFilter, HistoryTabProps } from "./types";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";

const VIEW_LABEL: Record<HistoryView, string> = {
  saves: "Saves",
  published: "Published",
};

const HELPER_TEXT: Record<HistoryView, string> = {
  saves: "Named milestones",
  published: "What's live",
};

const FILTER_LABEL: Record<SavesFilter, string> = {
  milestones: "Milestones",
  changes: "All changes",
};

const SEARCH_PLACEHOLDER: Record<SavesFilter, string> = {
  milestones: "Search saves...",
  changes: "Search changes...",
};

const SearchIconSvg = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ClearXSvg = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/*
  Saves filter (M1) — the old top-level "Changes" tab, demoted to a filter over
  the same list. Chips, not tabs, so it cannot read as a third destination next
  to Saves / Published. `tw:` rather than a rule in history.css: the panel-CSS
  lane is what the styling ratchet drains, and a caller's utilities win over
  flowbite's Button theme (chrome-ui/__tests__/className-precedence.test.tsx).
*/
const FILTER_ROW = "tw:flex tw:gap-[var(--bk-space-4)] tw:pt-[var(--bk-space-8)] tw:px-[var(--bk-space-12)]";
const FILTER_CHIP =
  "tw:px-[var(--bk-space-8)] tw:py-[var(--bk-space-4)] tw:text-[12px] " +
  "tw:font-normal tw:[font-family:inherit] tw:text-[var(--bk-ink-soft)] " +
  "tw:bg-transparent tw:border tw:border-[var(--bk-border)] tw:rounded-full " +
  "tw:cursor-pointer tw:[transition:color_150ms_ease-out,background-color_150ms_ease-out,border-color_150ms_ease-out] " +
  "tw:hover:text-[var(--bk-ink)] tw:focus-visible:outline-none " +
  "tw:focus-visible:shadow-[var(--bk-shadow-focus)]";
const FILTER_CHIP_ACTIVE =
  "tw:font-medium tw:text-[var(--bk-accent-on)] tw:bg-[var(--bk-accent)] tw:border-[var(--bk-accent)]";
const HISTORY_EMPTY =
  "tw:px-[var(--bk-space-12)] tw:py-[var(--bk-space-16)] tw:text-[12px] " +
  "tw:text-[var(--bk-ink-muted)] tw:text-center";

export const HistoryTab: React.FC<HistoryTabProps> = ({
  composer,
  projectId,
  initialView,
  rollbackJob = null,
  isExpanded,
  onExpandToggle,
  onHelpClick,
  onClose,
}) => {
  /*
    `projectId` is not threaded in unified-editor mode — AquibraStudio never
    sets it — so the Published view's `projectId ? … : …` fell to its fallback
    for every real user and printed "Publish the site once to start a version
    history." at a site with four published versions behind it. Board 949:4474
    and its five state boards were unreachable in the shipping editor.

    PublishTab hit this and fixed it for itself, with a comment saying so;
    its sibling kept the same null prop. Resolve the site the way the
    canonical publish path does — from the URL.
  */
  const siteId = React.useMemo(() => projectId ?? getSiteIdFromUrl(), [projectId]);
  const storageKey = `buildrick-history-view${siteId ? `-${siteId}` : ""}`;
  const { historyStack, canUndo, clear } = useHistoryState(composer);

  /* Stored preference, read once. The key predates M1 and every returning user
     has either "saves" or "changes" in it — "changes" is no longer a view, so
     it migrates to Saves-with-the-changes-filter rather than being discarded.
     Dropping it would silently move those users to a list they did not pick. */
  const stored = React.useMemo<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(storageKey);
    } catch {
      return null; // storage unavailable (private mode, quota) — use defaults
    }
  }, [storageKey]);

  const [activeView, setActiveView] = React.useState<HistoryView>(() => {
    if (initialView) return initialView; // deep link wins for this mount
    return stored === "published" ? "published" : "saves";
  });

  const [savesFilter, setSavesFilter] = React.useState<SavesFilter>(() =>
    stored === "changes" ? "changes" : "milestones",
  );

  const [searchQuery, setSearchQuery] = React.useState("");
  const [showScrubber, setShowScrubber] = React.useState(false);

  const {
    suggestion: milestoneSuggestion,
    isLoading: milestoneLoading,
    dismiss: dismissMilestone,
    accept: acceptMilestone,
    edit: editMilestone,
    isAvailable: milestoneAvailable,
  } = useAutoMilestone(composer);

  /* Written back in the SAME vocabulary the key already used ("saves" |
     "changes" | "published"), so a downgrade to a build without M1 still reads
     a value it understands instead of choking on a new enum. */
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const persisted =
      activeView === "published" ? "published" : savesFilter === "changes" ? "changes" : "saves";
    try {
      window.localStorage.setItem(storageKey, persisted);
    } catch {
      // Ignore storage errors
    }
  }, [activeView, savesFilter, storageKey]);

  // Ctrl+Shift+T toggles Time-Travel scrubber
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "T" || e.key === "t")) {
        e.preventDefault();
        setShowScrubber((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleScrubberRestore = React.useCallback(
    (entryId: string) => {
      composer?.history?.restoreEntry(entryId);
      setShowScrubber(false);
    },
    [composer]
  );

  const handleScrubberExit = React.useCallback(() => {
    setShowScrubber(false);
  }, []);

  return (
    <PanelFrame className="bd-history-container">
      <PanelFrame.Header
        title="Version History"
        isExpanded={isExpanded}
        onExpandToggle={onExpandToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />
      {/* View switcher — prototype tabs with helper text */}
      <div className="view-switcher" role="tablist" aria-label="History view">
        {(["saves", "published"] as const).map((view) => (
          <Button
            key={view}
            type="button"
            role="tab"
            aria-selected={activeView === view}
            className={`view-tab${activeView === view ? " active" : ""}`}
            onClick={() => setActiveView(view)}
          >
            {VIEW_LABEL[view]}
            <span className="tab-helper">{HELPER_TEXT[view]}</span>
          </Button>
        ))}
      </div>
      {/* Saves-only chrome. Published renders its own list and takes no search
          query, so showing a dead search field over it would be a lie. */}
      {activeView === "saves" && (
        <>
          <div className={FILTER_ROW} role="group" aria-label="Saves filter">
            {(["milestones", "changes"] as const).map((f) => (
              <Button
                key={f}
                type="button"
                aria-pressed={savesFilter === f}
                className={`${FILTER_CHIP}${savesFilter === f ? ` ${FILTER_CHIP_ACTIVE}` : ""}`}
                onClick={() => setSavesFilter(f)}
              >
                {FILTER_LABEL[f]}
              </Button>
            ))}
          </div>
          <div className="search-bar">
            <span className="search-icon" aria-hidden="true">
              <SearchIconSvg />
            </span>
            <TextField
              className="search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={SEARCH_PLACEHOLDER[savesFilter]}
              aria-label={SEARCH_PLACEHOLDER[savesFilter]}
            />
            {searchQuery && (
              <Button
                type="button"
                className="search-clear visible"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <ClearXSvg />
              </Button>
            )}
          </div>
        </>
      )}
      {/* List container — Saves (milestones | all changes) or Published */}
      <div className="list-container" role="tabpanel">
        {activeView === "saves" && savesFilter === "changes" && (
          <ActivityView
            composer={composer}
            searchQuery={searchQuery}
            onOpenTimeTravel={() => setShowScrubber(true)}
            onClearHistory={clear}
            canClear={canUndo}
          />
        )}

        {activeView === "saves" && savesFilter === "milestones" && (
          <>
            {milestoneAvailable && milestoneSuggestion && (
              <MilestoneSuggestionBanner
                suggestion={milestoneSuggestion}
                isLoading={milestoneLoading}
                onAccept={acceptMilestone}
                onDismiss={dismissMilestone}
                onEdit={editMilestone}
              />
            )}
            <VersionHistoryPanel composer={composer} searchQuery={searchQuery} />
          </>
        )}

        {/* M2 — the published-version list's canonical home. Same component the
            Publish panel embeds; rollback stays ADMIN-gated inside it. */}
        {activeView === "published" &&
          (siteId ? (
            <PublishHistory siteId={siteId} rollbackJob={rollbackJob} />
          ) : (
            /* No SITE, which is a different fact from no versions —
               PublishHistory owns the latter and says so in its own words.
               This fires only when the editor was opened without one. */
            <div className={HISTORY_EMPTY}>Open this site from the dashboard to see its publish history.</div>
          ))}
      </div>
      {/* Time-Travel scrubber drawer (overlays canvas, not sidebar) */}
      {showScrubber && (
        <TimeTravelScrubber
          composer={composer}
          historyStack={historyStack}
          onRestore={handleScrubberRestore}
          onExit={handleScrubberExit}
        />
      )}
    </PanelFrame>
  );
};

export default HistoryTab;

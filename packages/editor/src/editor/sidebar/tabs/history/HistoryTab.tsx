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
import { ActivityLogView } from "./components/ActivityLogView";
import { TimeTravelScrubber } from "./components/TimeTravelScrubber";
import { MilestoneSuggestionBanner } from "./components/MilestoneSuggestionBanner";
import { TimeTravelIcon } from "./icons";
import type { HistoryView, SavesFilter, HistoryTabProps } from "./types";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { SavesApproval, SavesPruneNote } from "./components/SavesChrome";
import { useVersionHistory } from "@/shared/hooks/useVersionHistory";

const VIEW_LABEL: Record<HistoryView, string> = {
  saves: "Saves",
  published: "Published",
  activity: "Activity",
};

/* Activity has no helper — the filter chips below the tab are the affordance
   (B6 plan). Saves/Published keep the helper sentence because the panel
   context alone is not enough. */
const HELPER_TEXT: Record<HistoryView, string> = {
  saves: "Named milestones",
  published: "What's live",
  activity: "Site activity",
};

/* Boards 163:64 / 163:269 / 163:220 (nodes 1657:7158 / 1657:7160, redrawn
   2026-09-05) settle a conflict two earlier boards had left open. 163:2 and
   163:113 drew this filter as two BARE TEXT LABELS reading "Changes" / "Saves",
   which the code refused because "Saves" is already the name of the view TAB
   one row above — adopting it would have put two different "Saves" controls a
   row apart. The redrawn boards keep the code's chips and rename them: the
   filter says which SET of saves is listed, and neither word collides with the
   tab. So the words come from the board and the control stays a chip. */
const FILTER_LABEL: Record<SavesFilter, string> = {
  milestones: "Saved versions",
  changes: "This session",
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
/* Board 163:113's preview band — accent tint, actions inline with the title. */
const PREVIEW_BAND =
  "tw:flex tw:h-11 tw:items-center tw:justify-between tw:gap-3 tw:bg-[var(--bk-accent-tint)] tw:px-4";
const PREVIEW_TITLE = "tw:truncate tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-accent-text)]";
/* The safety sentence, unchanged product copy, on its own row: the bar above
   it is board 163:159's single 44-tall row and cannot hold a second line.
   163:165 draws the same sentence but is a `note` block — an annotation, not a
   spec — so the row here is a code decision, not conformance. */
const PREVIEW_NOTE =
  "tw:m-0 tw:flex tw:h-8 tw:items-center tw:px-4 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
/* Boards 229:1138 / 229:1140 — both actions are the dense 28 row (--size/row-dense),
   inset 12 and 6, with the light one bordered `--bk-border`. flowbite's xs is
   1px of block padding and a gray-300 edge, and only a same-property utility
   beats either through twMerge. */
const PREVIEW_ACTION = "tw:h-7 tw:px-3 tw:py-1.5 tw:border-[var(--bk-border)]";

const FILTER_ROW = "tw:flex tw:gap-[var(--bk-space-4)] tw:pt-[var(--bk-space-8)] tw:px-[var(--bk-space-12)]";
/* `shrink-0` and the explicit 12 radius are both measured, not tidying.
   Without shrink-0 the Time-Travel button on the right squeezed both chips —
   "This session" rendered 63px against the board's 82 — because a flex item's
   default is to shrink before its neighbour does. `rounded-full` computes to
   calc(infinity)px, which is visually the same pill on a 24-tall chip and is
   not a number any spec can be compared against; 1657:7159 says 12.
   `leading-normal`, not `leading-4`: 1657:7158/7160 carry no line-height. */
const FILTER_CHIP =
  "tw:px-[var(--bk-space-8)] tw:py-[var(--bk-space-4)] tw:text-[12px] " +
  "tw:h-6 tw:shrink-0 tw:leading-normal tw:font-normal tw:[font-family:inherit] tw:text-[var(--bk-ink-soft)] " +
  "tw:bg-transparent tw:border tw:border-[var(--bk-border)] tw:rounded-[12px] " +
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
  onRollbackStarted,
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

  /* Boards 1138:4573 (loading) and 453:4031 (load-error) draw NEITHER the
     approval band nor the prune note: the skeleton screen is only skeletons,
     and the error screen ends on "Retry, or reopen Versions in a moment."
     rather than a second footer under it. So the chrome waits for the list to
     be in a state it can sit around.

     A second call of `useVersionHistory` — it is a read-only subscriber to
     VersionTimelineManager, not a fetch, so the list and the chrome can both
     ask where the read stands without racing each other. */
  const { isLoading: savesLoading, loadError: savesLoadError } = useVersionHistory(composer);
  const savesSettled = !savesLoading && !savesLoadError;
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
    if (stored === "published") return "published";
    if (stored === "activity") return "activity";
    return "saves";
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
     "changes" | "published" | "activity"), so a downgrade to a build
     without M1 / B6 still reads a value it understands instead of choking on
     a new enum. */
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const persisted =
      activeView === "published"
        ? "published"
        : activeView === "activity"
          ? "activity"
          : savesFilter === "changes"
            ? "changes"
            : "saves";
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

  /* Board 163:113 — while time-travel is on, the PANEL says so too. Without
     it the Saves list looked entirely normal while the canvas showed a past
     state, and the sentence that makes scrubbing safe to explore — nothing is
     written until you restore — appeared nowhere at all. */
  const [preview, setPreview] = React.useState<{ id: string; label: string } | null>(null);

  return (
    <PanelFrame className="bd-history-container" data-testid="history-panel">
      <PanelFrame.Header
        title="Version History"
        isExpanded={isExpanded}
        onExpandToggle={onExpandToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />
      {/* View switcher — prototype tabs with helper text */}
      <div className="view-switcher" role="tablist" aria-label="History view" data-testid="history-view-switcher">
        {(["saves", "published", "activity"] as const).map((view) => (
          <Button
            key={view}
            type="button"
            role="tab"
            aria-selected={activeView === view}
            className={`view-tab${activeView === view ? " active" : ""}`}
            data-testid={`history-view-tab-${view}`}
            onClick={() => setActiveView(view)}
          >
            {VIEW_LABEL[view]}
            <span className="tab-helper" data-testid={`history-view-helper-${view}`}>{HELPER_TEXT[view]}</span>
          </Button>
        ))}
      </div>
      {/* Saves-only chrome. Published renders its own list and takes no search
          query, so showing a dead search field over it would be a lie. */}
      {activeView === "saves" && (
        <>
          <div className={FILTER_ROW} role="group" aria-label="Saves filter" data-testid="history-filter-row">
            {(["milestones", "changes"] as const).map((f) => (
              <Button
                key={f}
                type="button"
                aria-pressed={savesFilter === f}
                className={`${FILTER_CHIP}${savesFilter === f ? ` ${FILTER_CHIP_ACTIVE}` : ""}`}
                data-testid={`history-filter-${f}`}
                onClick={() => setSavesFilter(f)}
              >
                {FILTER_LABEL[f]}
              </Button>
            ))}
            {/* Board 163:113 is the Milestones list WITH time-travel active —
                but the only door into it lived inside ActivityView's header,
                reachable only from the "All changes" filter (plus the
                Ctrl+Shift+T chord nobody is told about). Milestones had no
                way in at all. */}
            {savesFilter === "milestones" && (
              <Button
                type="button"
                /* `tw:h-6` is load-bearing: flowbite's Button ships h-10 and
                   `.tt-btn`'s padding cannot beat it (height:auto loses to a
                   height utility), so this control was 40 tall in a row board
                   1657:7157 draws at 32 — it set the row's height single-
                   handedly. A same-property utility is the only thing twMerge
                   drops flowbite's for. */
                className="tt-btn tw:h-6 tw:min-h-0 tw:shrink tw:ml-auto"
                data-testid="history-time-travel"
                onClick={() => setShowScrubber(true)}
                aria-label="Open Time-Travel scrubber (Ctrl+Shift+T)"
                title="Time-Travel (Ctrl+Shift+T)"
              >
                <TimeTravelIcon />
                Time-Travel
              </Button>
            )}
          </div>
          <div className="search-bar" data-testid="history-search-bar">
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
              data-testid="history-search-input"
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
        {/* Boards 162:2 / 163:2 / 163:64 all draw the approval band above the
            list and the retention rule below it — the milestones filter, the
            changes filter, and the empty state alike. They sit here rather
            than inside either list for that reason: 163:64 has no list at all
            and still carries the note. */}
        {showScrubber && preview && (
          <>
            <div className={PREVIEW_BAND} role="status" data-testid="history-tt-bar">
              <span className={PREVIEW_TITLE} data-testid="history-tt-title">
                Previewing {preview.label}
              </span>
              <div className="tw:flex tw:items-center tw:gap-2">
                <Button
                  color="light"
                  size="xs"
                  className={PREVIEW_ACTION}
                  data-testid="history-tt-exit"
                  onClick={handleScrubberExit}
                >
                  Exit (Esc)
                </Button>
                <Button
                  size="xs"
                  className={PREVIEW_ACTION}
                  data-testid="history-tt-restore"
                  onClick={() => handleScrubberRestore(preview.id)}
                >
                  Restore this version
                </Button>
              </div>
            </div>
            {/* Board 163:166 names the exit key in both places it appears —
                the button and this sentence. Both were "Exit" alone, because
                Escape did not exit: the drawer bound Ctrl+Shift+T and nothing
                else, so the board's copy would have been a promise the code
                did not keep. TimeTravelScrubber binds Escape now, so it is
                printed because it holds. */}
            <p className={PREVIEW_NOTE} data-testid="history-tt-note">
              Nothing is written until Restore. Esc exits time-travel.
            </p>
          </>
        )}

        {activeView === "saves" && savesSettled && <SavesApproval composer={composer} />}


        {/* The lists scroll; the approval band above and the prune note below
            are panel chrome and stay put (SavesChrome's own contract). Without
            this region the whole column was `overflow: hidden` and simply cut
            off — measured 586 of content in 547 of panel, which sliced the last
            version row in half and put the retention rule outside the panel
            entirely, with no scrollbar to reach it. */}
        {/* tw:min-h-0 is the load-bearing half — a flex child defaults to a
            min-content floor, so without it this grows past the panel and
            overflows instead of scrolling. */}
        <div className="tw:flex-1 tw:min-h-0 tw:overflow-y-auto tw:flex tw:flex-col" data-testid="history-list-scroll">
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
            <PublishHistory
              siteId={siteId}
              rollbackJob={rollbackJob}
              onRollbackStarted={onRollbackStarted}
            />
          ) : (
            /* No SITE, which is a different fact from no versions —
               PublishHistory owns the latter and says so in its own words.
               This fires only when the editor was opened without one. */
            <div className={HISTORY_EMPTY}>Open this site from the dashboard to see its publish history.</div>
          ))}

        {activeView === "activity" && (
          /* Site-scoped activity log (B6). The list owns its own chrome
             (filter chips + role=status region) — Saves' approval band /
             prune note are Saves-only. */
          <ActivityLogView siteId={siteId ?? null} />
        )}
        </div>

        {activeView === "saves" && savesSettled && (
          <SavesPruneNote composer={composer} filter={savesFilter} />
        )}
      </div>
      {/* Time-Travel scrubber drawer (overlays canvas, not sidebar) */}
      {showScrubber && (
        <TimeTravelScrubber
          composer={composer}
          historyStack={historyStack}
          onRestore={handleScrubberRestore}
          onExit={handleScrubberExit}
          onPreviewChange={setPreview}
        />
      )}
    </PanelFrame>
  );
};

export default HistoryTab;

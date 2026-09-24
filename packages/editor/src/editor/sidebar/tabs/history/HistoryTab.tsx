/**
 * HistoryTab — Version history sidebar panel
 *
 * Layout:
 *   PanelHeader → view-switcher (Session / Saves / Published / Activity)
 *   → search-bar → list-container
 * Session is this editing session's undo stack; it was the "This session"
 * filter chip inside Saves until board 4418:73791 gave it its own tab (B8,
 * G1-068).
 * Time-Travel scrubber drawer renders at body level when active.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { PanelFrame, Button, ConfirmDialog, Menu, MenuItem, Popover, TextField } from "@/editor/chrome-ui";
import { MoreHorizontal } from "lucide-react";
import { useHistoryState } from "../../../../shared/hooks/useHistoryState";
import { useAutoMilestone } from "../../../../shared/hooks/useAutoMilestone";
import { VersionHistoryPanel } from "../../../panels/VersionHistoryPanel";
import { PublishHistory } from "../../../shell/PublishHistory";
import { ActivityView } from "./components/ActivityView";
import { ActivityLogView } from "./components/ActivityLogView";
import { TimeTravelScrubber } from "./components/TimeTravelScrubber";
import { MilestoneSuggestionBanner } from "./components/MilestoneSuggestionBanner";
import type { HistoryView, HistoryTabProps } from "./types";
import { BackToActivityRow } from "./components/BackToActivityRow";
import { EVENTS } from "@/shared/constants/events";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { SavesApproval, SavesPruneNote } from "./components/SavesChrome";
import { useVersionHistory } from "@/shared/hooks/useVersionHistory";

const VIEW_LABEL: Record<HistoryView, string> = {
  session: "Session",
  saves: "Saves",
  published: "Published",
  activity: "Activity",
};

const SEARCH_PLACEHOLDER: Record<"session" | "saves", string> = {
  session: "Search changes...",
  saves: "Search saves...",
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
     it migrates to the Session tab, which is that list. Dropping it would
     silently move those users to a list they did not pick. */
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
    if (stored === "saves") return "saves";
    return "session"; // board 4418:73791 opens on Session
  });

  const [searchQuery, setSearchQuery] = React.useState("");
  /* Set when an Activity row opened Published or Session here; the back row
     shows until the user picks a tab themselves. */
  const [fromActivity, setFromActivity] = React.useState(false);
  const [showScrubber, setShowScrubber] = React.useState(false);
  /* Board 4418:73791 draws no search field and no "Undo History · Clear ·
     Time-Travel" band. Both capabilities stay, behind the panel ⋯ (owner rule:
     parity never silently removes one; designer note logged). */
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [confirmClear, setConfirmClear] = React.useState(false);

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
    const persisted = activeView === "session" ? "changes" : activeView;
    try {
      window.localStorage.setItem(storageKey, persisted);
    } catch {
      // Ignore storage errors
    }
  }, [activeView, storageKey]);

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
        title="History"
        actions={
          <Popover
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            placement="bottom-end"
            label="History actions"
            trigger={
              <Button
                color="light"
                size="xs"
                className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]"
                aria-label="History actions"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                data-testid="history-menu"
              >
                <MoreHorizontal size={14} aria-hidden="true" />
              </Button>
            }
          >
            <Menu label="History actions">
              {activeView === "session" || activeView === "saves" ? (
                <MenuItem
                  onClick={() => {
                    setMenuOpen(false);
                    setSearchOpen(true);
                  }}
                >
                  Search {activeView === "session" ? "changes" : "saves"}
                </MenuItem>
              ) : null}
              <MenuItem
                kbd="⌃⇧T"
                onClick={() => {
                  setMenuOpen(false);
                  setShowScrubber(true);
                }}
              >
                Time-Travel
              </MenuItem>
              <MenuItem
                danger
                disabled={!canUndo}
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmClear(true);
                }}
              >
                Clear undo history…
              </MenuItem>
            </Menu>
          </Popover>
        }
        isExpanded={isExpanded}
        onExpandToggle={onExpandToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />
      {/* View switcher — prototype tabs with helper text */}
      <div className="view-switcher" role="tablist" aria-label="History view" data-testid="history-view-switcher">
        {(["session", "saves", "published", "activity"] as const).map((view) => (
          <Button
            key={view}
            type="button"
            role="tab"
            aria-selected={activeView === view}
            className={`view-tab${activeView === view ? " active" : ""}`}
            data-testid={`history-view-tab-${view}`}
            onClick={() => {
              setActiveView(view);
              setFromActivity(false);
            }}
          >
            {VIEW_LABEL[view]}
          </Button>
        ))}
      </div>
      {fromActivity && activeView !== "activity" ? (
        <BackToActivityRow
          onBack={() => {
            setActiveView("activity");
            setFromActivity(false);
          }}
        />
      ) : null}
      {/* Session/Saves chrome. Published renders its own list and takes no
          search query, so showing a dead search field over it would be a lie. */}
      {(activeView === "session" || activeView === "saves") && (searchOpen || searchQuery) && (
        <>
          <div className="search-bar" data-testid="history-search-bar">
            <span className="search-icon" aria-hidden="true">
              <SearchIconSvg />
            </span>
            <TextField
              className="search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={SEARCH_PLACEHOLDER[activeView]}
              aria-label={SEARCH_PLACEHOLDER[activeView]}
              data-testid="history-search-input"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Escape" && !searchQuery) setSearchOpen(false);
              }}
            />
            {searchQuery && (
              <Button
                type="button"
                className="search-clear visible"
                onClick={() => {
                  setSearchQuery("");
                  setSearchOpen(false);
                }}
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

        {(activeView === "session" || activeView === "saves") && savesSettled && (
          <SavesApproval composer={composer} />
        )}


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
        {activeView === "session" && (
          <ActivityView
            composer={composer}
            searchQuery={searchQuery}
          />
        )}

        {activeView === "saves" && (
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
              /* A door of the one Compare (B8). */
              onCompare={(from, to) =>
                composer?.emit(EVENTS.UI_COMPARE_OPEN, {
                  left: { kind: "published", jobId: from.id, version: from.version },
                  right: { kind: "published", jobId: to.id, version: to.version },
                  from: "History",
                })
              }
              onCompareWithCurrent={(row) =>
                composer?.emit(EVENTS.UI_COMPARE_OPEN, {
                  left: { kind: "published", jobId: row.id, version: row.version },
                  right: { kind: "current" },
                  from: "History",
                })
              }
              siteName={composer?.getProjectMetadata?.()?.name}
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
          <ActivityLogView
            siteId={siteId ?? null}
            onOpenRow={(kind) => {
              if (kind === "comment") {
                composer?.emit(EVENTS.UI_PANEL_OPEN, { panel: "review", screen: "from-activity" });
                return;
              }
              setActiveView(kind === "publish" ? "published" : "session");
              setFromActivity(true);
            }}
          />
        )}
        </div>

        {(activeView === "session" || activeView === "saves") && savesSettled && (
          <SavesPruneNote composer={composer} view={activeView} />
        )}
      </div>
      {/* Time-Travel scrubber drawer (overlays canvas, not sidebar) */}
      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          clear();
          setConfirmClear(false);
        }}
        title="Clear undo history?"
        message="Every step in this session's undo history is removed. Your page stays as it is now."
        confirmLabel="Clear undo history"
      />
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

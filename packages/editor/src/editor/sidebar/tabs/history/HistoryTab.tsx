import { Button } from "@/shared/ui/Button";
/**
 * HistoryTab — Version history sidebar panel
 *
 * Layout matches the History Tab prototype:
 *   PanelHeader → view-switcher (Changes / Saves) → search-bar → list-container
 * Time-Travel scrubber drawer renders at body level when active.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useHistoryState } from "../../../../shared/hooks/useHistoryState";
import { useAutoMilestone } from "../../../../shared/hooks/useAutoMilestone";
import { VersionHistoryPanel } from "../../../panels/VersionHistoryPanel";
import { PanelShell } from "@shared/ui/panel";
import { ActivityView } from "./components/ActivityView";
import { TimeTravelScrubber } from "./components/TimeTravelScrubber";
import { MilestoneSuggestionBanner } from "./components/MilestoneSuggestionBanner";
import type { HistoryView, HistoryTabProps } from "./types";

const HELPER_TEXT: Record<HistoryView, string> = {
  changes: "Your recent edits",
  saves: "Named milestones",
};

const SEARCH_PLACEHOLDER: Record<HistoryView, string> = {
  changes: "Search changes...",
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

export const HistoryTab: React.FC<HistoryTabProps> = ({
  composer,
  projectId,
  isPinned,
  onPinToggle,
  onHelpClick,
  onClose,
}) => {
  const storageKey = `buildrick-history-view${projectId ? `-${projectId}` : ""}`;
  const { historyStack, canUndo, clear } = useHistoryState(composer);

  const [activeView, setActiveView] = React.useState<HistoryView>(() => {
    if (typeof window === "undefined") return "changes";
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored === "saves" || stored === "changes") return stored;
    } catch {
      // Ignore storage errors
    }
    return "changes";
  });

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

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, activeView);
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

  return (
    <PanelShell className="buildrick-history-container">
      <PanelShell.Header
        title="Version History"
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />
      {/* View switcher — prototype tabs with helper text */}
      <div className="view-switcher" role="tablist" aria-label="History view">
        {(["changes", "saves"] as const).map((view) => (
          <Button
            key={view}
            type="button"
            role="tab"
            aria-selected={activeView === view}
            className={`view-tab${activeView === view ? " active" : ""}`}
            onClick={() => setActiveView(view)}
          >
            {view === "changes" ? "Changes" : "Saves"}
            <span className="tab-helper">{HELPER_TEXT[view]}</span>
          </Button>
        ))}
      </div>
      {/* Search bar — prototype markup */}
      <div className="search-bar">
        <span className="search-icon" aria-hidden="true">
          <SearchIconSvg />
        </span>
        <input
          className="search-input"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={SEARCH_PLACEHOLDER[activeView]}
          aria-label={SEARCH_PLACEHOLDER[activeView]}
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
      {/* List container — switches between Changes / Saves */}
      <div className="list-container" role="tabpanel">
        {activeView === "changes" && (
          <ActivityView
            composer={composer}
            searchQuery={searchQuery}
            onOpenTimeTravel={() => setShowScrubber(true)}
            onClearHistory={clear}
            canClear={canUndo}
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
    </PanelShell>
  );
};

export default HistoryTab;

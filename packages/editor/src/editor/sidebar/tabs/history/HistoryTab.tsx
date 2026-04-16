/**
 * HistoryTab - Version history and activity log
 * Uses View Switcher pattern for Saves/Changes views
 * Phase 3: Uses custom hooks, renamed tabs, helper text
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useHistoryState } from "../../../../shared/hooks/useHistoryState";
import { useVersionHistory } from "../../../../shared/hooks/useVersionHistory";
import { VersionHistoryPanel } from "../../../panels/VersionHistoryPanel";
import { PanelHeader } from "../../shared/PanelHeader";
import { SearchBar } from "../../shared/SearchBar";
import { ViewSwitcher, type ViewOption } from "../../shared/ViewSwitcher";
import { ActivityView } from "./components/ActivityView";
import { VersionsIcon, ActivityIcon, ClearIcon, TimeTravelIcon } from "./icons";
import type { HistoryView, HistoryTabProps } from "./types";

// ============================================
// View Options
// ============================================

const VIEW_OPTIONS: ViewOption<HistoryView>[] = [
  {
    id: "saves",
    label: "Saves",
    icon: <VersionsIcon />,
  },
  {
    id: "changes",
    label: "Changes",
    icon: <ActivityIcon />,
  },
];

// ============================================
// Helpers
// ============================================

const HELPER_TEXT: Record<HistoryView, string> = {
  saves: "Named milestones you've saved. Compare or restore anytime.",
  changes: "Your recent edits. Use Ctrl+Z to undo.",
};

// ============================================
// Component
// ============================================

export const HistoryTab: React.FC<HistoryTabProps> = ({
  composer,
  projectId,
  isPinned,
  onPinToggle,
  onHelpClick,
  onClose,
}) => {
  const storageKey = `aqb-history-view${projectId ? `-${projectId}` : ""}`;

  // Use custom hooks
  const { canUndo, clear } = useHistoryState(composer);

  // View state with persistence
  const [activeView, setActiveView] = React.useState<HistoryView>(() => {
    if (typeof window === "undefined") return "saves";
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored === "saves" || stored === "changes") return stored;
    } catch {
      // Ignore storage errors
    }
    return "saves";
  });

  // Search state
  const [searchQuery, setSearchQuery] = React.useState("");

  // Clear confirmation inline state
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);

  // Persist view changes
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, activeView);
    } catch {
      // Ignore storage errors
    }
  }, [activeView, storageKey]);

  // Clear history handler with confirmation
  const handleClearHistory = React.useCallback(() => {
    clear();
    setShowClearConfirm(false);
  }, [clear]);

  return (
    <div className="aqb-history-container">
      {/* Panel Header */}
      <PanelHeader
        title="Version History"
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />

      {/* Controls: Search + Clear + View Switcher */}
      <div className="aqb-ht-controls">
        {/* Clear History row */}
        <div className="aqb-ht-undo-row">
          {showClearConfirm ? (
            <div className="aqb-ht-clear-confirm" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "var(--aqb-text-muted)", whiteSpace: "nowrap" }}>
                This cannot be undone.
              </span>
              <button
                onClick={handleClearHistory}
                className="aqb-ht-clear-btn aqb-ht-clear-btn--danger"
                style={{ background: "var(--aqb-error, #ef4444)", color: "#fff", borderColor: "transparent" }}
                aria-label="Confirm Clear All"
              >
                <ClearIcon />
                <span style={{ fontSize: 11, marginLeft: 4 }}>Clear All</span>
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="aqb-ht-clear-btn"
                aria-label="Cancel clear"
              >
                <span style={{ fontSize: 11 }}>Cancel</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="aqb-ht-clear-btn"
              disabled={!canUndo}
              title="Clear all history"
              aria-label="Clear History"
              style={{ marginLeft: "auto" }}
            >
              <ClearIcon />
              <span style={{ fontSize: 11, marginLeft: 4 }}>Clear history</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={activeView === "saves" ? "Search saves..." : "Search changes..."}
        />

        {/* View Switcher */}
        <ViewSwitcher
          value={activeView}
          options={VIEW_OPTIONS}
          onChange={setActiveView}
          fullWidth
        />

        {/* Helper text */}
        <p className="aqb-ht-helper-text">{HELPER_TEXT[activeView]}</p>
      </div>

      {/* Content */}
      <div className="aqb-ht-content">
        {activeView === "saves" && (
          <VersionHistoryPanel composer={composer} searchQuery={searchQuery} />
        )}

        {activeView === "changes" && (
          <ActivityView composer={composer} searchQuery={searchQuery} />
        )}
      </div>
    </div>
  );
};

export default HistoryTab;
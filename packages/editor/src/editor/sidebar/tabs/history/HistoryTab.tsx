/**
 * HistoryTab - Version history and activity log
 * Uses View Switcher pattern for Versions/Activity views
 * Features expandable diff preview in Undo History view
 * @license BSD-3-Clause
 */

import * as React from "react";
import { EVENTS } from "../../../../shared/constants";
import { VersionHistoryPanel } from "../../../panels/VersionHistoryPanel";
import { PanelHeader } from "../../shared/PanelHeader";
import { SearchBar } from "../../shared/SearchBar";
import { ViewSwitcher, type ViewOption } from "../../shared/ViewSwitcher";
import { ActivityView } from "./components/ActivityView";
import { VersionsIcon, ActivityIcon, ClearIcon } from "./icons";
import type { HistoryView, HistoryTabProps } from "./types";

// ============================================
// View Options
// ============================================

const VIEW_OPTIONS: ViewOption<HistoryView>[] = [
  {
    id: "versions",
    label: "Versions",
    icon: <VersionsIcon />,
  },
  {
    id: "activity",
    label: "Activity",
    icon: <ActivityIcon />,
  },
];

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

  // View state with persistence
  const [activeView, setActiveView] = React.useState<HistoryView>(() => {
    if (typeof window === "undefined") return "versions";
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored === "versions" || stored === "activity") return stored;
    } catch {
      // Ignore storage errors
    }
    return "versions";
  });

  // Search state
  const [searchQuery, setSearchQuery] = React.useState("");

  // canUndo gates the Clear-History button (no point clearing an empty
  // history). canRedo dropped — only used by removed redo button (CAN-012).
  const [canUndo, setCanUndo] = React.useState(false);

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

  // Update undo/redo state based on composer history
  React.useEffect(() => {
    if (!composer?.history) return;

    const updateUndoRedoState = () => {
      setCanUndo(composer.history.canUndo());
    };

    // Initial state
    updateUndoRedoState();

    // Listen for history changes
    composer.on(EVENTS.HISTORY_RECORDED, updateUndoRedoState);
    composer.on(EVENTS.HISTORY_UNDO, updateUndoRedoState);
    composer.on(EVENTS.HISTORY_REDO, updateUndoRedoState);
    composer.on(EVENTS.HISTORY_CLEARED, updateUndoRedoState);

    return () => {
      composer.off(EVENTS.HISTORY_RECORDED, updateUndoRedoState);
      composer.off(EVENTS.HISTORY_UNDO, updateUndoRedoState);
      composer.off(EVENTS.HISTORY_REDO, updateUndoRedoState);
      composer.off(EVENTS.HISTORY_CLEARED, updateUndoRedoState);
    };
  }, [composer]);

  // Note: undo/redo handlers removed (CAN-012). The global top-bar owns
  // those actions; per-version Compare/Restore lives in the version list.

  // Clear history handler with confirmation
  const handleClearHistory = React.useCallback(() => {
    if (composer?.history) {
      composer.history.clear();
      // Record initial state after clear so undo works again
      composer.history.forceCheckpoint("Cleared history");
      setShowClearConfirm(false);
    }
  }, [composer]);

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

      {/* Controls: Search + Clear + View Switcher.
          Undo/Redo intentionally omitted — the global top-bar provides the
          single source of truth for those actions (CAN-012). Compare/Restore
          per-version actions live in the version list below. */}
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
          placeholder={activeView === "versions" ? "Search versions..." : "Search activity..."}
        />

        {/* View Switcher */}
        <ViewSwitcher
          value={activeView}
          options={VIEW_OPTIONS}
          onChange={setActiveView}
          fullWidth
        />
      </div>

      {/* Content */}
      <div className="aqb-ht-content">
        {activeView === "versions" && (
          <VersionHistoryPanel composer={composer} searchQuery={searchQuery} />
        )}

        {activeView === "activity" && (
          <ActivityView composer={composer} searchQuery={searchQuery} />
        )}
      </div>
    </div>
  );
};

export default HistoryTab;

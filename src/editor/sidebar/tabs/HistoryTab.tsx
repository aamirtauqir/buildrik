/**
 * HistoryTab - Version history and activity log
 * Uses View Switcher pattern for Versions/Activity views
 * Features expandable diff preview in Undo History view
 * @license BSD-3-Clause
 */

import * as React from "react";
import { EVENTS } from "../../../shared/constants";
import { VersionHistoryPanel } from "../../panels/VersionHistoryPanel";
import { PanelHeader } from "../shared/PanelHeader";
import { SearchBar } from "../shared/SearchBar";
import { ViewSwitcher, type ViewOption } from "../shared/ViewSwitcher";
import { ActivityView } from "./history/components/ActivityView";
import { VersionsIcon, ActivityIcon, UndoIcon, RedoIcon, ClearIcon } from "./history/icons";
import {
  containerStyles,
  controlsStyles,
  contentStyles,
  undoRedoRowStyles,
  undoRedoButtonStyles,
  clearButtonStyles,
  confirmDialogStyles,
  confirmTextStyles,
  confirmButtonsStyles,
  confirmCancelStyles,
  confirmDeleteStyles,
} from "./history/styles";
import type { HistoryView, HistoryTabProps } from "./history/types";

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
  isPinned,
  onPinToggle,
  onHelpClick,
  onClose,
}) => {
  // View state with persistence
  const [activeView, setActiveView] = React.useState<HistoryView>(() => {
    if (typeof window === "undefined") return "versions";
    try {
      const stored = window.localStorage.getItem("aqb-history-view");
      if (stored === "versions" || stored === "activity") return stored;
    } catch {
      // Ignore storage errors
    }
    return "versions";
  });

  // Search state
  const [searchQuery, setSearchQuery] = React.useState("");

  // Undo/Redo state
  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);

  // Clear confirmation dialog state
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);

  // Persist view changes
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("aqb-history-view", activeView);
    } catch {
      // Ignore storage errors
    }
  }, [activeView]);

  // Update undo/redo state based on composer history
  React.useEffect(() => {
    if (!composer?.history) return;

    const updateUndoRedoState = () => {
      setCanUndo(composer.history.canUndo());
      setCanRedo(composer.history.canRedo());
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

  // Undo/Redo handlers
  const handleUndo = React.useCallback(() => {
    if (composer?.history?.canUndo()) {
      composer.history.undo();
    }
  }, [composer]);

  const handleRedo = React.useCallback(() => {
    if (composer?.history?.canRedo()) {
      composer.history.redo();
    }
  }, [composer]);

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
    <div style={containerStyles}>
      {/* Panel Header */}
      <PanelHeader
        title="History"
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />

      {/* Controls: Search + Undo/Redo + View Switcher */}
      <div style={controlsStyles}>
        {/* Undo/Redo/Clear Buttons */}
        <div style={undoRedoRowStyles}>
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            style={{
              ...undoRedoButtonStyles,
              opacity: canUndo ? 1 : 0.5,
              cursor: canUndo ? "pointer" : "not-allowed",
            }}
            title="Undo (Cmd+Z)"
            aria-label="Undo"
          >
            <UndoIcon />
            <span>Undo</span>
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            style={{
              ...undoRedoButtonStyles,
              opacity: canRedo ? 1 : 0.5,
              cursor: canRedo ? "pointer" : "not-allowed",
            }}
            title="Redo (Cmd+Shift+Z)"
            aria-label="Redo"
          >
            <RedoIcon />
            <span>Redo</span>
          </button>
          <button
            onClick={() => setShowClearConfirm(true)}
            disabled={!canUndo}
            style={{
              ...clearButtonStyles,
              opacity: canUndo ? 1 : 0.5,
              cursor: canUndo ? "pointer" : "not-allowed",
            }}
            title="Clear History"
            aria-label="Clear History"
          >
            <ClearIcon />
          </button>
        </div>

        {/* Clear Confirmation Dialog */}
        {showClearConfirm && (
          <div style={confirmDialogStyles}>
            <p style={confirmTextStyles}>Clear all history? This cannot be undone.</p>
            <div style={confirmButtonsStyles}>
              <button onClick={() => setShowClearConfirm(false)} style={confirmCancelStyles}>
                Cancel
              </button>
              <button onClick={handleClearHistory} style={confirmDeleteStyles}>
                Clear
              </button>
            </div>
          </div>
        )}

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
      <div style={contentStyles}>
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

/**
 * Aquibra Undo/Redo Controls
 * Canvas toolbar controls for undo/redo operations
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { EVENTS } from "../../../shared/constants";
import { CanvasButton, CANVAS_COLORS, SIZES } from "../shared";

export interface UndoRedoControlsProps {
  composer: Composer | null;
  className?: string;
}

/**
 * Undo/Redo control buttons for Canvas toolbar
 * Automatically syncs state with HistoryManager events
 */
export const UndoRedoControls: React.FC<UndoRedoControlsProps> = ({ composer, className }) => {
  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);

  // Sync undo/redo state with HistoryManager
  React.useEffect(() => {
    if (!composer) {
      setCanUndo(false);
      setCanRedo(false);
      return;
    }

    const updateHistoryState = () => {
      setCanUndo(composer.history.canUndo());
      setCanRedo(composer.history.canRedo());
    };

    // Initial state
    updateHistoryState();

    // Subscribe to history events
    composer.on(EVENTS.HISTORY_UNDO, updateHistoryState);
    composer.on(EVENTS.HISTORY_REDO, updateHistoryState);
    composer.on(EVENTS.HISTORY_RECORDED, updateHistoryState);
    composer.on(EVENTS.HISTORY_CLEARED, updateHistoryState);
    composer.on(EVENTS.PROJECT_CHANGED, updateHistoryState);

    return () => {
      composer.off(EVENTS.HISTORY_UNDO, updateHistoryState);
      composer.off(EVENTS.HISTORY_REDO, updateHistoryState);
      composer.off(EVENTS.HISTORY_RECORDED, updateHistoryState);
      composer.off(EVENTS.HISTORY_CLEARED, updateHistoryState);
      composer.off(EVENTS.PROJECT_CHANGED, updateHistoryState);
    };
  }, [composer]);

  const handleUndo = React.useCallback(() => {
    if (composer && canUndo) {
      composer.history.undo();
    }
  }, [composer, canUndo]);

  const handleRedo = React.useCallback(() => {
    if (composer && canRedo) {
      composer.history.redo();
    }
  }, [composer, canRedo]);

  return (
    <div
      className={`aqb-undo-redo-controls ${className || ""}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: SIZES.padding.xs,
        padding: SIZES.padding.xs,
        background: "var(--aqb-bg-panel-secondary)",
        borderRadius: SIZES.borderRadius.lg,
      }}
    >
      {/* Undo button */}
      <CanvasButton
        onClick={handleUndo}
        icon={
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
        }
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        variant="ghost"
        size="sm"
        style={{
          width: 28,
          height: 28,
          color: canUndo ? CANVAS_COLORS.textPrimary : CANVAS_COLORS.textMuted,
        }}
      />

      {/* Redo button */}
      <CanvasButton
        onClick={handleRedo}
        icon={
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
          </svg>
        }
        disabled={!canRedo}
        title="Redo (Ctrl+Shift+Z)"
        variant="ghost"
        size="sm"
        style={{
          width: 28,
          height: 28,
          color: canRedo ? CANVAS_COLORS.textPrimary : CANVAS_COLORS.textMuted,
        }}
      />
    </div>
  );
};

export default UndoRedoControls;

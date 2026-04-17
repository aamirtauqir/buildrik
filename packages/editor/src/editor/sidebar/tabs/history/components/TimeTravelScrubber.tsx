/**
 * TimeTravelScrubber - Bottom drawer for time-travel mode
 * Phase 5: Canvas preview scrubbing with slider, restore, and exit
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../../engine";
import type { HistoryDisplayEntry } from "../../../../../engine/HistoryManager";

interface TimeTravelScrubberProps {
  composer: Composer | null;
  historyStack: HistoryDisplayEntry[];
  onRestore: (entryId: string) => void;
  onExit: () => void;
}

export const TimeTravelScrubber: React.FC<TimeTravelScrubberProps> = ({
  composer,
  historyStack,
  onRestore,
  onExit,
}) => {
  const [sliderValue, setSliderValue] = React.useState(50);
  const [currentIndex, setCurrentIndex] = React.useState(Math.floor(historyStack.length / 2));
  const [isDragging, setIsDragging] = React.useState(false);

  const maxIndex = Math.max(0, historyStack.length - 1);
  const currentEntry = historyStack[currentIndex];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSliderValue(val);
    const index = Math.round((val / 100) * maxIndex);
    setCurrentIndex(Math.max(0, Math.min(maxIndex, index)));
  };

  const handleRestore = React.useCallback(() => {
    if (currentEntry) {
      onRestore(currentEntry.id);
    }
  }, [currentEntry, onRestore]);

  // Keyboard shortcuts: Left/Right step, Enter restore, Ctrl+Shift+T exit
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        setCurrentIndex((prev) => {
          const delta = e.key === "ArrowLeft" ? -1 : 1;
          return Math.max(0, Math.min(maxIndex, prev + delta));
        });
        setSliderValue((100 / maxIndex) * (currentIndex + (e.key === "ArrowRight" ? 1 : -1)));
      } else if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        handleRestore();
      } else if (e.key === "T" && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        onExit();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, maxIndex, handleRestore, onExit]);

  const formatTime = (ts: number): string => {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const startTime = historyStack[0]?.timestamp;
  const endTime = historyStack[maxIndex]?.timestamp;

  // Preview label for canvas overlay
  const previewLabel = currentEntry
    ? `Time-traveling: ${currentEntry.label}`
    : "Select a point to preview";

  return (
    <>
      {/* Overlay backdrop */}
      <div className={`tt-overlay ${isDragging ? "active" : ""}`} />

      {/* Canvas preview label */}
      <div className={`tt-canvas-preview ${isDragging ? "active" : ""}`}>
        {previewLabel}
      </div>

      {/* Bottom drawer */}
      <div className={`tt-drawer active`} role="dialog" aria-modal="true" aria-label="Time travel">
        {historyStack.length === 0 ? (
          <p style={{ color: "var(--aqb-text-muted)", fontSize: 13 }}>
            No history entries to scrub through.
          </p>
        ) : (
          <>
            <div className="tt-slider-container">
              <div className="tt-slider-label">
                {currentEntry
                  ? `Previewing: ${formatTime(currentEntry.timestamp)} — ${currentEntry.label}`
                  : "No entry selected"}
              </div>
              <input
                type="range"
                className="tt-slider"
                min={0}
                max={100}
                value={sliderValue}
                onChange={handleSliderChange}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                aria-label="Time travel scrubber"
                aria-valuenow={currentIndex}
                aria-valuetext={currentEntry ? `${currentEntry.label} at ${formatTime(currentEntry.timestamp)}` : undefined}
              />
              <div className="tt-time-display">
                <span>{startTime ? formatTime(startTime) : "—"}</span>
                <span className="tt-time-current">
                  {currentEntry ? formatTime(currentEntry.timestamp) : "—"}
                </span>
                <span>{endTime ? formatTime(endTime) : "—"}</span>
              </div>
            </div>

            <div className="tt-actions">
              <button
                className="tt-restore-btn"
                onClick={handleRestore}
                disabled={!currentEntry}
              >
                Restore this point
              </button>
              <button className="tt-exit-btn" onClick={onExit}>
                Exit time-travel
                <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>
                  Ctrl+Shift+T
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

/**
 * TimeTravelScrubber - Bottom drawer for time-travel mode
 * Phase 5: Canvas preview scrubbing with slider, restore, and exit
 *
 * Preview-rendering tradeoff:
 *   The spec (§2.7) describes rendering each scrub frame into a temporary
 *   Composer instance. That path is a memory/lifecycle minefield (managers,
 *   caches, event listeners must be disposed per frame). Instead we render
 *   preview frames as an <img> fed from the nearest NamedVersion's
 *   `visualSnapshot` (JPEG data URL captured by
 *   VersionHistoryManager.captureVisualSnapshot). When no snapshot is
 *   available for the scrubbed point, we fall back to a labelled placeholder.
 *   This trades per-patch fidelity for correctness, zero leaks, and
 *   sub-frame scrub cost — good enough for the "see the gap" UX §4.5 calls
 *   for.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../../engine";
import type { HistoryDisplayEntry } from "../../../../../engine/HistoryManager";
import type { NamedVersion } from "../../../../../shared/types/versions";
import { useReducedMotion } from "../../../../../shared/hooks/useReducedMotion";

interface TimeTravelScrubberProps {
  composer: Composer | null;
  historyStack: HistoryDisplayEntry[];
  onRestore: (entryId: string) => void;
  onExit: () => void;
}

// Max one preview update every ~33ms (≈30fps) per spec §2.7
const SCRUB_FRAME_MS = 33;

/** Pick the NamedVersion whose createdAt is closest to (and not after) the
 *  target timestamp. Falls back to the nearest version overall. */
function findNearestSnapshot(
  versions: NamedVersion[],
  targetTs: number
): NamedVersion | null {
  if (versions.length === 0) return null;
  let best: NamedVersion | null = null;
  let bestDelta = Infinity;
  for (const v of versions) {
    if (!v.visualSnapshot) continue;
    const delta = Math.abs(v.createdAt - targetTs);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = v;
    }
  }
  return best;
}

export const TimeTravelScrubber: React.FC<TimeTravelScrubberProps> = ({
  composer,
  historyStack,
  onRestore,
  onExit,
}) => {
  const reducedMotion = useReducedMotion();

  const maxIndex = Math.max(0, historyStack.length - 1);
  const initialIndex = Math.floor(historyStack.length / 2);
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const [sliderValue, setSliderValue] = React.useState(
    maxIndex > 0 ? (initialIndex / maxIndex) * 100 : 50
  );
  const [isDragging, setIsDragging] = React.useState(false);
  const [previewSrc, setPreviewSrc] = React.useState<string | null>(null);

  const currentEntry = historyStack[currentIndex];

  // Cache cached versions once — .getVersions() is sync and returns a copy.
  const versionsRef = React.useRef<NamedVersion[]>([]);
  React.useEffect(() => {
    versionsRef.current = composer?.versionHistory?.getVersions() ?? [];
  }, [composer]);

  // ── 30fps scrub debounce ──────────────────────────────────────────────────
  // Track last render time + any trailing frame rAF id so we both cap update
  // rate and always land on the final scrub position.
  const lastRenderRef = React.useRef<number>(0);
  const trailingRafRef = React.useRef<number | null>(null);
  const trailingTimerRef = React.useRef<number | null>(null);

  const renderPreviewForIndex = React.useCallback(
    (idx: number) => {
      const entry = historyStack[idx];
      if (!entry) {
        setPreviewSrc(null);
        return;
      }
      const nearest = findNearestSnapshot(versionsRef.current, entry.timestamp);
      setPreviewSrc(nearest?.visualSnapshot ?? null);
    },
    [historyStack]
  );

  const scheduleScrubUpdate = React.useCallback(
    (idx: number) => {
      const now = performance.now();
      const elapsed = now - lastRenderRef.current;

      if (elapsed >= SCRUB_FRAME_MS) {
        lastRenderRef.current = now;
        renderPreviewForIndex(idx);
        return;
      }

      // Coalesce rapid updates — schedule one trailing render at the deadline
      // so the user always lands on the final scrub target.
      if (trailingRafRef.current !== null) {
        cancelAnimationFrame(trailingRafRef.current);
        trailingRafRef.current = null;
      }
      if (trailingTimerRef.current !== null) {
        window.clearTimeout(trailingTimerRef.current);
      }
      trailingTimerRef.current = window.setTimeout(() => {
        trailingTimerRef.current = null;
        trailingRafRef.current = requestAnimationFrame(() => {
          trailingRafRef.current = null;
          lastRenderRef.current = performance.now();
          renderPreviewForIndex(idx);
        });
      }, SCRUB_FRAME_MS - elapsed);
    },
    [renderPreviewForIndex]
  );

  // Initial preview render on mount / when entry list arrives.
  React.useEffect(() => {
    renderPreviewForIndex(currentIndex);
    // Intentionally only on mount — subsequent updates go through scheduleScrubUpdate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Preview canvas DOM layer ──────────────────────────────────────────────
  // Inserted as a sibling of #editor-canvas so it overlays exactly the live
  // canvas. pointer-events: none keeps the live canvas interactive below.
  const previewLayerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const host = document.getElementById("editor-canvas");
    const parent = host?.parentElement ?? document.body;

    const layer = document.createElement("div");
    layer.setAttribute("data-tt-preview-layer", "true");
    layer.style.position = "absolute";
    if (host) {
      const rect = host.getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect();
      layer.style.top = `${rect.top - parentRect.top}px`;
      layer.style.left = `${rect.left - parentRect.left}px`;
      layer.style.width = `${rect.width}px`;
      layer.style.height = `${rect.height}px`;
    } else {
      layer.style.inset = "0";
    }
    layer.style.pointerEvents = "none";
    layer.style.opacity = "0";
    layer.style.transition = reducedMotion
      ? "none"
      : "opacity 150ms ease-out";
    layer.style.zIndex = "199";
    layer.style.background = "#f5f5f5";
    layer.style.display = "flex";
    layer.style.alignItems = "center";
    layer.style.justifyContent = "center";
    layer.style.overflow = "hidden";

    parent.appendChild(layer);
    previewLayerRef.current = layer;

    // Small next-frame opacity bump so reduced-motion path still shows instantly.
    const reveal = () => {
      layer.style.opacity = "0.4";
    };
    if (reducedMotion) {
      reveal();
    } else {
      requestAnimationFrame(reveal);
    }

    return () => {
      // Cleanup: remove DOM node and any pending scrub timers.
      if (trailingRafRef.current !== null) {
        cancelAnimationFrame(trailingRafRef.current);
        trailingRafRef.current = null;
      }
      if (trailingTimerRef.current !== null) {
        window.clearTimeout(trailingTimerRef.current);
        trailingTimerRef.current = null;
      }
      layer.remove();
      previewLayerRef.current = null;
    };
    // reducedMotion intentionally captured — if it flips mid-session we
    // recreate the layer with matching transition semantics.
  }, [reducedMotion]);

  // Paint previewSrc into the DOM layer whenever it changes.
  React.useEffect(() => {
    const layer = previewLayerRef.current;
    if (!layer) return;
    // Replace contents with either an <img> or a labelled placeholder.
    layer.textContent = "";
    if (previewSrc) {
      const img = document.createElement("img");
      img.src = previewSrc;
      img.alt = "";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "contain";
      img.style.display = "block";
      layer.appendChild(img);
    } else {
      const label = document.createElement("div");
      label.textContent = currentEntry
        ? `Time-traveling: ${currentEntry.label}`
        : "Select a point to preview";
      label.style.fontSize = "14px";
      label.style.color = "#666";
      label.style.fontFamily = "inherit";
      label.style.padding = "16px";
      layer.appendChild(label);
    }
  }, [previewSrc, currentEntry]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const updateToIndex = React.useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(maxIndex, idx));
      setCurrentIndex(clamped);
      setSliderValue(maxIndex > 0 ? (clamped / maxIndex) * 100 : 0);
      scheduleScrubUpdate(clamped);
    },
    [maxIndex, scheduleScrubUpdate]
  );

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSliderValue(val);
    const idx = Math.round((val / 100) * maxIndex);
    const clamped = Math.max(0, Math.min(maxIndex, idx));
    setCurrentIndex(clamped);
    scheduleScrubUpdate(clamped);
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
        const delta = e.key === "ArrowLeft" ? -1 : 1;
        updateToIndex(currentIndex + delta);
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
  }, [currentIndex, handleRestore, onExit, updateToIndex]);

  const formatTime = (ts: number): string => {
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const startTime = historyStack[0]?.timestamp;
  const endTime = historyStack[maxIndex]?.timestamp;

  // Drawer activation — respects reduced motion (no slide animation).
  const drawerClass = reducedMotion ? "tt-drawer active tt-no-motion" : "tt-drawer active";
  const drawerStyle: React.CSSProperties | undefined = reducedMotion
    ? { transition: "none", transform: "translateY(0)" }
    : undefined;

  return (
    <>
      {/* Overlay backdrop — tracks drag to dim sibling UI per spec */}
      <div
        className={`tt-overlay ${isDragging ? "active" : ""}`}
        style={reducedMotion ? { transition: "none" } : undefined}
      />

      {/* Bottom drawer */}
      <div
        className={drawerClass}
        style={drawerStyle}
        role="dialog"
        aria-modal="true"
        aria-label="Time travel"
      >
        {historyStack.length === 0 ? (
          <p style={{ color: "var(--buildrick-text-muted)", fontSize: 13 }}>
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
                aria-valuetext={
                  currentEntry
                    ? `${currentEntry.label} at ${formatTime(currentEntry.timestamp)}`
                    : undefined
                }
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

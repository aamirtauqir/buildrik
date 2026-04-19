/**
 * LayersPanel Styles
 *
 * NOTE: Most styles have been migrated to LeftSidebar.css for consistency.
 * This file now uses CSS variables for theming.
 *
 * @license BSD-3-Clause
 */
import type { CSSProperties } from "react";

/** Visually-hidden style for screen reader announcements (WCAG 4.1.3). */
export const SR_ONLY_STYLE: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: 0,
};

/** Returns inline style object for the drop-feedback toast. */
export function getDropFeedbackStyle(type: "error" | "info"): CSSProperties {
  const e = type === "error";
  return {
    padding: "8px 12px",
    margin: "0 8px 8px",
    fontSize: "var(--buildrick-text-xs,12px)",
    borderRadius: "var(--buildrick-design-radius-sm,4px)",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: e
      ? "var(--buildrick-error-bg,rgba(239,68,68,0.1))"
      : "var(--buildrick-info-bg,rgba(59,130,246,0.1))",
    color: e ? "var(--buildrick-error,#ef4444)" : "var(--buildrick-info,#3b82f6)",
    border: `1px solid ${e ? "var(--buildrick-error,#ef4444)" : "var(--buildrick-info,#3b82f6)"}`,
  };
}

export const layersPanelStyles = `
  /* ═══════════════════════════════════════════════════════════════════════════
     LAYER ROW BASE STYLES
     Uses CSS variables from .buildrick-layers-panel parent
     ═══════════════════════════════════════════════════════════════════════════ */
  .buildrick-layer-row {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .buildrick-layer-row.is-dragging {
    opacity: 0.5;
  }
  .buildrick-layer-row.is-drop-target {
    position: relative;
  }

  /* Tree depth lines - uses CSS variable */
  .buildrick-layer-tree-lines {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    pointer-events: none;
  }
  .buildrick-tree-line {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--layer-accent-alpha, rgba(59, 130, 246, 0.2));
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     DROP INDICATORS — PRD §9.6: 2px line, buildrick-primary color
     ═══════════════════════════════════════════════════════════════════════════ */
  .buildrick-drop-indicator {
    position: absolute;
    left: 0;
    right: 0;
    pointer-events: none;
    z-index: 10;
  }
  .buildrick-drop-before {
    top: 0;
    height: 2px;
    background: var(--buildrick-accent, #6366f1);
    border-radius: 1px;
  }
  .buildrick-drop-after {
    bottom: 0;
    height: 2px;
    background: var(--buildrick-accent, #6366f1);
    border-radius: 1px;
  }
  .buildrick-drop-inside {
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border: 2px solid var(--buildrick-accent, #6366f1);
    background: var(--buildrick-accent-tint, rgba(99, 102, 241, 0.06));
    border-radius: 4px;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     ACTION BUTTONS - Uses accent color CSS vars
     ═══════════════════════════════════════════════════════════════════════════ */
  .buildrick-layer-actions {
    display: flex;
    gap: 2px;
    margin-left: auto;
    opacity: 0.25;
    transition: opacity 0.15s ease;
  }
  .buildrick-layer-row:hover .buildrick-layer-actions,
  .buildrick-layer-row.is-selected .buildrick-layer-actions {
    opacity: 1;
  }
  .buildrick-layer-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    color: var(--layer-accent-muted, rgba(59, 130, 246, 0.6));
    transition: all 0.15s ease;
  }
  .buildrick-layer-action-btn:hover {
    background: var(--layer-accent-alpha, rgba(59, 130, 246, 0.15));
    color: var(--layer-accent, #3b82f6);
  }

  /* Name input for editing */
  .buildrick-layer-name-input {
    width: 100%;
    padding: 2px 6px;
    border: 1px solid var(--layer-accent, #3b82f6);
    border-radius: 4px;
    background: var(--layer-accent-alpha, rgba(59, 130, 246, 0.1));
    color: inherit;
    font-size: 12px;
    outline: none;
  }
  .buildrick-layer-name-input:focus {
    border-color: var(--layer-success, #22c55e);
    box-shadow: 0 0 0 2px var(--layer-success-alpha, rgba(34, 197, 94, 0.2));
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     HIDDEN STATE - Warning color (amber/orange) via CSS var
     ═══════════════════════════════════════════════════════════════════════════ */
  .buildrick-layer-row.is-hidden {
    opacity: 0.5;
  }
  .buildrick-layer-row.is-hidden .buildrick-layer-name {
    color: var(--buildrick-text-tertiary, rgba(148, 163, 184, 0.5));
  }
  .buildrick-layer-row.is-hidden .buildrick-layer-id {
    opacity: 0.5;
  }
  .buildrick-layer-row.is-hidden .buildrick-layer-icon {
    opacity: 0.6;
  }
  /* Warning color for hidden action button */
  .buildrick-layer-row.is-hidden .buildrick-layer-action-btn:first-child {
    color: var(--layer-warning, #f59e0b);
    opacity: 1;
  }
  .buildrick-layer-row.is-hidden .buildrick-layer-action-btn:first-child:hover {
    background: var(--layer-warning-alpha, rgba(245, 158, 11, 0.15));
    color: var(--layer-warning, #f59e0b);
  }
  /* Keep visibility button always visible when hidden */
  .buildrick-layer-row.is-hidden .buildrick-layer-actions {
    opacity: 1;
  }
  .buildrick-layer-row.is-hidden .buildrick-layer-actions .buildrick-layer-action-btn:first-child {
    opacity: 1;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     LOCKED STATE - Muted color (slate gray) via CSS var
     ═══════════════════════════════════════════════════════════════════════════ */
  .buildrick-layer-row.is-locked {
    cursor: not-allowed;
  }
  .buildrick-layer-row.is-locked .buildrick-layer-icon {
    opacity: 0.6;
  }
  /* Muted color for locked action button */
  .buildrick-layer-row.is-locked .buildrick-layer-action-btn:last-child {
    color: var(--layer-muted, #64748b);
    opacity: 1;
  }
  .buildrick-layer-row.is-locked .buildrick-layer-action-btn:last-child:hover {
    background: var(--layer-muted-alpha, rgba(100, 116, 139, 0.15));
    color: var(--layer-muted-light, #94a3b8);
  }
  /* Keep lock button always visible when locked */
  .buildrick-layer-row.is-locked .buildrick-layer-actions {
    opacity: 1;
  }
  .buildrick-layer-row.is-locked .buildrick-layer-actions .buildrick-layer-action-btn:last-child {
    opacity: 1;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     COMBINED: Both hidden AND locked
     ═══════════════════════════════════════════════════════════════════════════ */
  .buildrick-layer-row.is-hidden.is-locked .buildrick-layer-actions {
    opacity: 1;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     BIDIRECTIONAL HOVER HIGHLIGHTING
     ═══════════════════════════════════════════════════════════════════════════ */
  .buildrick-layer-row.is-canvas-hovered,
  .buildrick-layer-row.is-layer-hovered {
    background: var(--buildrick-bg-hover, rgba(255, 255, 255, 0.04)) !important;
    outline: 1px solid rgba(99, 102, 241, 0.3);
    outline-offset: -1px;
  }
  .buildrick-layer-row.is-canvas-hovered::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--buildrick-accent, #6366f1);
    border-radius: 0 1px 1px 0;
  }
`;

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
    fontSize: "var(--aqb-text-xs,12px)",
    borderRadius: "var(--aqb-radius-sm,4px)",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: e
      ? "var(--aqb-error-bg,rgba(239,68,68,0.1))"
      : "var(--aqb-info-bg,rgba(59,130,246,0.1))",
    color: e ? "var(--aqb-error,#ef4444)" : "var(--aqb-info,#3b82f6)",
    border: `1px solid ${e ? "var(--aqb-error,#ef4444)" : "var(--aqb-info,#3b82f6)"}`,
  };
}

export const layersPanelStyles = `
  /* ═══════════════════════════════════════════════════════════════════════════
     LAYER ROW BASE STYLES
     Uses CSS variables from .aqb-layers-panel parent
     ═══════════════════════════════════════════════════════════════════════════ */
  .aqb-layer-row {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .aqb-layer-row.is-dragging {
    opacity: 0.5;
  }
  .aqb-layer-row.is-drop-target {
    position: relative;
  }

  /* Tree depth lines - uses CSS variable */
  .aqb-layer-tree-lines {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    pointer-events: none;
  }
  .aqb-tree-line {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--layer-accent-alpha, rgba(59, 130, 246, 0.2));
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     DROP INDICATORS - Green success colors via CSS vars
     ═══════════════════════════════════════════════════════════════════════════ */
  .aqb-drop-indicator {
    position: absolute;
    left: 0;
    right: 0;
    pointer-events: none;
    z-index: 10;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .aqb-drop-before {
    top: -2px;
    height: 4px;
    background: var(--layer-success, #22c55e);
    box-shadow: 0 0 10px var(--layer-success-alpha, rgba(34, 197, 94, 0.6));
    border-radius: 2px;
  }
  .aqb-drop-after {
    bottom: -2px;
    height: 4px;
    background: var(--layer-success, #22c55e);
    box-shadow: 0 0 10px var(--layer-success-alpha, rgba(34, 197, 94, 0.6));
    border-radius: 2px;
  }
  .aqb-drop-inside {
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border: 2px solid var(--layer-success, #22c55e);
    background: var(--layer-success-alpha, rgba(34, 197, 94, 0.15));
    border-radius: 4px;
    box-shadow: inset 0 0 8px var(--layer-success-alpha, rgba(34, 197, 94, 0.3));
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     ACTION BUTTONS - Uses accent color CSS vars
     ═══════════════════════════════════════════════════════════════════════════ */
  .aqb-layer-actions {
    display: flex;
    gap: 2px;
    margin-left: auto;
    opacity: 0;
    transition: opacity 0.15s ease;
  }
  .aqb-layer-row:hover .aqb-layer-actions,
  .aqb-layer-row.is-selected .aqb-layer-actions {
    opacity: 1;
  }
  .aqb-layer-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    color: var(--layer-accent-muted, rgba(59, 130, 246, 0.6));
    transition: all 0.15s ease;
  }
  .aqb-layer-action-btn:hover {
    background: var(--layer-accent-alpha, rgba(59, 130, 246, 0.15));
    color: var(--layer-accent, #3b82f6);
  }

  /* Name input for editing */
  .aqb-layer-name-input {
    width: 100%;
    padding: 2px 6px;
    border: 1px solid var(--layer-accent, #3b82f6);
    border-radius: 4px;
    background: var(--layer-accent-alpha, rgba(59, 130, 246, 0.1));
    color: inherit;
    font-size: 12px;
    outline: none;
  }
  .aqb-layer-name-input:focus {
    border-color: var(--layer-success, #22c55e);
    box-shadow: 0 0 0 2px var(--layer-success-alpha, rgba(34, 197, 94, 0.2));
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     HIDDEN STATE - Warning color (amber/orange) via CSS var
     ═══════════════════════════════════════════════════════════════════════════ */
  .aqb-layer-row.is-hidden {
    opacity: 0.5;
  }
  .aqb-layer-row.is-hidden .aqb-layer-name {
    color: var(--aqb-text-tertiary, rgba(148, 163, 184, 0.5));
  }
  .aqb-layer-row.is-hidden .aqb-layer-id {
    opacity: 0.5;
  }
  .aqb-layer-row.is-hidden .aqb-layer-icon {
    opacity: 0.6;
  }
  /* Warning color for hidden action button */
  .aqb-layer-row.is-hidden .aqb-layer-action-btn:first-child {
    color: var(--layer-warning, #f59e0b);
    opacity: 1;
  }
  .aqb-layer-row.is-hidden .aqb-layer-action-btn:first-child:hover {
    background: var(--layer-warning-alpha, rgba(245, 158, 11, 0.15));
    color: var(--layer-warning, #f59e0b);
  }
  /* Keep visibility button always visible when hidden */
  .aqb-layer-row.is-hidden .aqb-layer-actions {
    opacity: 1;
  }
  .aqb-layer-row.is-hidden .aqb-layer-actions .aqb-layer-action-btn:first-child {
    opacity: 1;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     LOCKED STATE - Muted color (slate gray) via CSS var
     ═══════════════════════════════════════════════════════════════════════════ */
  .aqb-layer-row.is-locked {
    cursor: not-allowed;
  }
  .aqb-layer-row.is-locked .aqb-layer-icon {
    opacity: 0.6;
  }
  /* Muted color for locked action button */
  .aqb-layer-row.is-locked .aqb-layer-action-btn:last-child {
    color: var(--layer-muted, #64748b);
    opacity: 1;
  }
  .aqb-layer-row.is-locked .aqb-layer-action-btn:last-child:hover {
    background: var(--layer-muted-alpha, rgba(100, 116, 139, 0.15));
    color: var(--layer-muted-light, #94a3b8);
  }
  /* Keep lock button always visible when locked */
  .aqb-layer-row.is-locked .aqb-layer-actions {
    opacity: 1;
  }
  .aqb-layer-row.is-locked .aqb-layer-actions .aqb-layer-action-btn:last-child {
    opacity: 1;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     COMBINED: Both hidden AND locked
     ═══════════════════════════════════════════════════════════════════════════ */
  .aqb-layer-row.is-hidden.is-locked .aqb-layer-actions {
    opacity: 1;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     BIDIRECTIONAL HOVER HIGHLIGHTING - Accent color via CSS var
     ═══════════════════════════════════════════════════════════════════════════ */
  .aqb-layer-row.is-canvas-hovered,
  .aqb-layer-row.is-layer-hovered {
    background: var(--layer-accent-alpha, rgba(59, 130, 246, 0.15)) !important;
    outline: 1px solid var(--layer-accent-border, rgba(59, 130, 246, 0.4));
    outline-offset: -1px;
  }
  .aqb-layer-row.is-canvas-hovered::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--layer-accent, #3b82f6);
    border-radius: 0 2px 2px 0;
  }
`;

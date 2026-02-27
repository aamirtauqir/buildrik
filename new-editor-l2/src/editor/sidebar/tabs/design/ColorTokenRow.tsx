/**
 * ColorTokenRow — single color token row with inline picker
 * Extracted from ColorTokenList to keep both files under 500 lines.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ColorPicker } from "./ColorPicker";
import { calcWcagLevel, wcagTooltip } from "./colorUtils";
import type { DesignToken, WcagLevel } from "./types";

// ─── WCAG Badge ───────────────────────────────────────────────────────────────

const WCAG_BADGE_STYLES: Record<WcagLevel, React.CSSProperties> = {
  aaa:        { background: "rgba(34,197,94,0.15)",   color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" },
  aa:         { background: "rgba(59,130,246,0.15)",   color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)" },
  "aa-large": { background: "rgba(245,158,11,0.12)",  color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" },
  fail:       { background: "rgba(239,68,68,0.12)",   color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" },
  na:         { background: "rgba(113,113,122,0.15)", color: "#71717a", border: "1px solid rgba(113,113,122,0.3)" },
};

const WCAG_LABEL: Record<WcagLevel, string> = {
  aaa: "AAA", aa: "AA", "aa-large": "AA⚡", fail: "fail", na: "n/a",
};

const WcagBadge: React.FC<{ level: WcagLevel }> = ({ level }) => (
  <span
    title={wcagTooltip(level)}
    style={{
      ...WCAG_BADGE_STYLES[level],
      fontSize: 9,
      fontWeight: 700,
      padding: "1px 5px",
      borderRadius: 4,
      letterSpacing: "0.3px",
      userSelect: "none",
      cursor: "default",
      whiteSpace: "nowrap",
    }}
  >
    {WCAG_LABEL[level]}
  </span>
);

// ─── Icons ────────────────────────────────────────────────────────────────────

const UndoIcon: React.FC = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 4h5a3 3 0 1 1 0 6H5" strokeLinecap="round" />
    <path d="M2 4l2-2M2 4l2 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RedoIcon: React.FC = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M10 4H5a3 3 0 1 0 0 6h2" strokeLinecap="round" />
    <path d="M10 4l-2-2M10 4l-2 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── ColorTokenRow ────────────────────────────────────────────────────────────

export interface ColorTokenRowProps {
  token: DesignToken;
  isChanged: boolean;
  isExpanded: boolean;
  onSwatchClick: () => void;
  onColorChange: (id: string, hex: string) => void;
  onPickerCancel: () => void;
  onPickerSave: (id: string, hex: string) => void;
  onUndo: (id: string) => void;
  onRedo: (id: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  previousValue?: string;
}

export const ColorTokenRow: React.FC<ColorTokenRowProps> = ({
  token,
  isChanged,
  isExpanded,
  onSwatchClick,
  onColorChange,
  onPickerCancel,
  onPickerSave,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  previousValue,
}) => {
  const [copied, setCopied] = React.useState(false);
  const wcagLevel = calcWcagLevel(token.value, "#0A0A0A");

  const handleCopyHex = () => {
    navigator.clipboard.writeText(token.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: 8,
        overflow: "hidden",
        border: isChanged ? "1px solid rgba(245,158,11,0.4)" : "1px solid var(--aqb-border)",
        borderLeft: isChanged ? "3px solid #f59e0b" : "1px solid var(--aqb-border)",
        background: isExpanded ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
        transition: "border-color 0.15s",
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px" }}>
        {/* Swatch */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 6,
            background: token.value,
            border: "1px solid rgba(255,255,255,0.1)",
            cursor: "pointer",
            flexShrink: 0,
            position: "relative",
          }}
          onClick={onSwatchClick}
          title={isExpanded ? "Close picker" : "Edit color"}
          role="button"
          aria-label={`Edit ${token.name} color`}
          aria-expanded={isExpanded}
        >
          {isChanged && previousValue && (
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "40%",
                height: "100%",
                background: previousValue,
                borderRadius: "0 5px 5px 0",
                borderLeft: "1px solid rgba(0,0,0,0.2)",
                pointerEvents: "none",
              }}
              title={`Previous: ${previousValue}`}
            />
          )}
        </div>

        {/* Token info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span
              style={{ fontSize: 12, fontWeight: 500, color: "var(--aqb-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              title={token.name}
            >
              {token.name}
            </span>
            {isChanged && (
              <span
                style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }}
                title="Unsaved change"
              />
            )}
          </div>
          <button
            onClick={handleCopyHex}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: copied ? "var(--aqb-color-success)" : "var(--aqb-text-muted)", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.3px" }}
            title="Click to copy hex"
          >
            {copied ? "Copied!" : token.value.toUpperCase()}
          </button>
        </div>

        {/* WCAG badge */}
        <WcagBadge level={wcagLevel} />

        {/* Undo */}
        {canUndo && (
          <button
            onClick={() => onUndo(token.id)}
            style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: "#f59e0b", borderRadius: 4, display: "flex", alignItems: "center" }}
            title="Undo color change"
            aria-label="Undo"
          >
            <UndoIcon />
          </button>
        )}

        {/* Redo */}
        {canRedo && (
          <button
            onClick={() => onRedo(token.id)}
            style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: "var(--aqb-text-muted)", borderRadius: 4, display: "flex", alignItems: "center" }}
            title="Redo color change"
            aria-label="Redo"
          >
            <RedoIcon />
          </button>
        )}
      </div>

      {/* Inline picker */}
      <div style={{ maxHeight: isExpanded ? 400 : 0, overflow: "hidden", transition: "max-height 0.22s ease" }}>
        {isExpanded && (
          <div style={{ padding: "0 10px 10px" }}>
            <ColorPicker
              initialHex={token.value}
              background="#0A0A0A"
              onChange={(hex) => onColorChange(token.id, hex)}
              onCancel={onPickerCancel}
              onSave={(hex) => onPickerSave(token.id, hex)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

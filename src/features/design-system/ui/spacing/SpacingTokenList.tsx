/**
 * SpacingTokenList v11 — Spacing tab pane
 * Shows preset chips, spacing rows with colored bars, and semantic labels.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { SpacingPreset } from "../../state/useSpacingTokens";
import type { DesignToken } from "../../types";

export interface SpacingTokenListProps {
  tokens: DesignToken[];
  activePreset: SpacingPreset | null;
  savedPreset: SpacingPreset | null;
  isDirty: boolean;
  onTokenChange: (id: string, value: string) => void;
  onPresetApply: (preset: SpacingPreset) => void;
  onResetToDefaults: () => void;
  onUndo: (id: string) => void;
  canUndo: (id: string) => boolean;
  onRedo: (id: string) => void;
  canRedo: (id: string) => boolean;
}

// ─── Semantic labels for spacing tokens ───────────────────────────────────────

const SPACE_META: Record<string, { semantic: string; size: "xs" | "sm" | "md" | "lg" | "xl" }> = {
  "space-1": { semantic: "XS", size: "xs" },
  "space-2": { semantic: "SM", size: "sm" },
  "space-3": { semantic: "SM", size: "sm" },
  "space-4": { semantic: "MD", size: "md" },
  "space-5": { semantic: "MD", size: "md" },
  "space-6": { semantic: "LG", size: "lg" },
  "space-8": { semantic: "LG", size: "lg" },
  "space-10": { semantic: "XL", size: "xl" },
  "space-12": { semantic: "XL", size: "xl" },
};

const BAR_COLORS: Record<"xs" | "sm" | "md" | "lg" | "xl", string> = {
  xs: "#22c55e",
  sm: "#3b82f6",
  md: "#8b5cf6",
  lg: "#f59e0b",
  xl: "#ef4444",
};

// ─── Spacing row ──────────────────────────────────────────────────────────────

interface SpacingRowProps {
  token: DesignToken;
  onChange: (id: string, value: string) => void;
  onUndo: (id: string) => void;
  canUndo: boolean;
  onRedo: (id: string) => void;
  canRedo: boolean;
}

const SpacingRow: React.FC<SpacingRowProps> = ({
  token,
  onChange,
  onUndo,
  canUndo,
  onRedo,
  canRedo,
}) => {
  const meta = SPACE_META[token.id];
  const size = parseFloat(token.value);
  const barColor = meta ? BAR_COLORS[meta.size] : "#3b82f6";

  // Bar width: capped at 120px representing 48px spacing
  const maxPx = 48;
  const barWidth = Math.min((size / maxPx) * 120, 120);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseFloat(e.target.value);
    if (!isNaN(num) && num >= 0) onChange(token.id, `${num}px`);
  };

  // Semantic label with current value, e.g. "XS — 4px"
  const displayLabel = meta ? `${meta.semantic} — ${token.value}` : token.name;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      {/* Semantic label */}
      <div
        style={{
          width: 28,
          flexShrink: 0,
          fontSize: 9,
          fontWeight: 700,
          color: barColor,
          letterSpacing: "0.3px",
          textAlign: "right",
        }}
      >
        {meta?.semantic ?? "—"}
      </div>

      {/* Token name + value */}
      <div
        style={{
          width: 64,
          flexShrink: 0,
          fontSize: 10,
          color: "var(--aqb-text-muted)",
          fontFamily: "monospace",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={`${meta?.semantic ?? token.id} — ${token.value}`}
      >
        {displayLabel}
      </div>

      {/* Colored bar */}
      <div
        style={{
          flex: 1,
          height: 6,
          background: "rgba(255,255,255,0.06)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: barWidth,
            height: "100%",
            background: barColor,
            borderRadius: 3,
            transition: "width 0.2s",
          }}
        />
      </div>

      {/* Number input */}
      <input
        type="number"
        value={size}
        min={0}
        max={200}
        step={1}
        onChange={handleChange}
        style={{
          width: 44,
          padding: "4px 6px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid var(--aqb-border)",
          borderRadius: 4,
          color: "var(--aqb-text-primary)",
          fontSize: 11,
          textAlign: "right",
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 10, color: "var(--aqb-text-muted)", flexShrink: 0 }}>px</span>

      {/* Zero-spacing warning */}
      {size === 0 && (
        <span
          title="Zero spacing will collapse layout gaps"
          style={{ color: "#f59e0b", fontSize: 12, flexShrink: 0 }}
        >
          ⚠
        </span>
      )}

      {/* Undo button */}
      {canUndo && (
        <button
          onClick={() => onUndo(token.id)}
          title="Undo"
          style={{
            background: "none",
            border: "none",
            padding: 4,
            cursor: "pointer",
            color: "#f59e0b",
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          ↩
        </button>
      )}

      {/* Redo button */}
      {canRedo && (
        <button
          onClick={() => onRedo(token.id)}
          title="Redo"
          style={{
            background: "none",
            border: "none",
            padding: 4,
            cursor: "pointer",
            color: "#3b82f6",
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          ↪
        </button>
      )}
    </div>
  );
};

// ─── Preset chip ──────────────────────────────────────────────────────────────

const PRESET_LABELS: Record<SpacingPreset, string> = {
  compact: "Compact",
  normal: "Normal",
  spacious: "Spacious",
};

const PresetChip: React.FC<{
  preset: SpacingPreset;
  isActive: boolean;
  onApply: () => void;
}> = ({ preset, isActive, onApply }) => (
  <button
    onClick={onApply}
    style={{
      padding: "5px 12px",
      borderRadius: 20,
      border: "1px solid",
      borderColor: isActive ? "var(--aqb-primary)" : "var(--aqb-border)",
      background: isActive ? "rgba(59,130,246,0.15)" : "transparent",
      color: isActive ? "var(--aqb-primary)" : "var(--aqb-text-muted)",
      fontSize: 11,
      fontWeight: isActive ? 600 : 400,
      cursor: "pointer",
    }}
  >
    {PRESET_LABELS[preset]}
  </button>
);

// ─── Spacing diagram (SVG) ────────────────────────────────────────────────────

const SpacingDiagram: React.FC<{ tokens: DesignToken[] }> = ({ tokens }) => {
  const getVal = (id: string) => parseFloat(tokens.find((t) => t.id === id)?.value ?? "16");

  return (
    <div
      style={{
        padding: 12,
        background: "rgba(255,255,255,0.02)",
        borderRadius: 8,
        border: "1px solid var(--aqb-border)",
        marginTop: 8,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "var(--aqb-text-muted)",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        Layout Units
      </div>
      <svg width="100%" height="60" viewBox="0 0 220 60" fill="none">
        <rect
          x="4"
          y="4"
          width="212"
          height="52"
          rx="4"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
        <rect
          x="4"
          y="4"
          width={Math.min(getVal("space-4") * 2, 40)}
          height="52"
          fill="rgba(139,92,246,0.15)"
          rx="4"
        />
        <rect
          x={220 - 4 - Math.min(getVal("space-4") * 2, 40)}
          y="4"
          width={Math.min(getVal("space-4") * 2, 40)}
          height="52"
          fill="rgba(139,92,246,0.15)"
          rx="4"
        />
        <line
          x1="110"
          y1="10"
          x2="110"
          y2="50"
          stroke="rgba(59,130,246,0.4)"
          strokeWidth="1"
          strokeDasharray="3,2"
        />
        <text x="112" y="30" fontSize="8" fill="rgba(255,255,255,0.3)" dominantBaseline="middle">
          gap: {getVal("space-4")}px
        </text>
      </svg>
    </div>
  );
};

// ─── SpacingTokenList ─────────────────────────────────────────────────────────

export const SpacingTokenList: React.FC<SpacingTokenListProps> = ({
  tokens,
  activePreset,
  savedPreset,
  isDirty,
  onTokenChange,
  onPresetApply,
  onResetToDefaults,
  onUndo,
  canUndo,
  onRedo,
  canRedo,
}) => (
  <div style={{ display: "flex", flexDirection: "column" }}>
    {/* Preset chips + Reset defaults */}
    <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
      {(["compact", "normal", "spacious"] as SpacingPreset[]).map((p) => (
        <PresetChip
          key={p}
          preset={p}
          isActive={activePreset === p}
          onApply={() => onPresetApply(p)}
        />
      ))}
      <button
        onClick={onResetToDefaults}
        title="Reset all spacing to factory defaults"
        style={{
          padding: "5px 10px",
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          color: "var(--aqb-text-muted)",
          fontSize: 10,
          cursor: "pointer",
          marginLeft: "auto",
        }}
      >
        Reset defaults
      </button>
    </div>

    {/* Preset change warning banner */}
    {activePreset !== savedPreset && isDirty && (
      <div
        style={{
          margin: "0 0 10px",
          padding: "8px 10px",
          background: "rgba(245,158,11,0.08)",
          border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span style={{ fontSize: 10, color: "rgba(245,158,11,0.9)", lineHeight: 1.5 }}>
          ⚠ {tokens.length} spacing tokens updated. Review before applying.
        </span>
      </div>
    )}

    {/* Spacing rows */}
    <div>
      {tokens.map((token) => (
        <SpacingRow
          key={token.id}
          token={token}
          onChange={onTokenChange}
          onUndo={onUndo}
          canUndo={canUndo(token.id)}
          onRedo={onRedo}
          canRedo={canRedo(token.id)}
        />
      ))}
    </div>

    {/* Layout diagram */}
    <SpacingDiagram tokens={tokens} />
  </div>
);

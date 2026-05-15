/**
 * SpacingTokenList v12 — prototype-faithful chip-pill grid view.
 *
 * Visual reference: docs/reference/left-panel/tab-design.html (Spacing
 * section). Chip pills wrap the value (e.g., 4 / 8 / 12 / 16 / 20 / 24)
 * — designer-grade dense surface vs v11 row-with-colored-bar list.
 *
 * Click a chip → inline edit drawer with number input + zero warning +
 * undo/redo affordances. Preset chips (Compact / Normal / Spacious) stay
 * at top. Reset-defaults stays. The colored-bar SVG + layout diagram are
 * dropped — over-decoration vs the prototype's minimal chip surface.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { SpacingPreset } from "../../state/useSpacingTokens";
import type { DesignToken } from "../../types";
import { TokenUsageChip } from "../sections/TokenUsageChip";

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
  /** T7 coverage: per-token usage counts (from composer.designSystem.tokenUsage). */
  usageByTokenId?: ReadonlyMap<string, number>;
}

const PRESET_LABELS: Record<SpacingPreset, string> = {
  compact: "Compact (2px)",
  normal: "Normal (4px)",
  spacious: "Spacious (6px)",
};

// ─── Preset chip ──────────────────────────────────────────────────────────────

const PresetChip: React.FC<{
  preset: SpacingPreset;
  isActive: boolean;
  onApply: () => void;
}> = ({ preset, isActive, onApply }) => (
  <button
    type="button"
    onClick={onApply}
    style={{
      padding: "4px 10px",
      borderRadius: 20,
      border: "1px solid",
      borderColor: isActive ? "var(--bd-accent)" : "var(--bd-border)",
      background: isActive ? "rgba(45, 109, 255, 0.15)" : "transparent",
      color: isActive ? "var(--bd-accent)" : "var(--bd-fg-muted)",
      fontSize: 11,
      fontWeight: isActive ? 600 : 500,
      cursor: "pointer",
    }}
  >
    {PRESET_LABELS[preset]}
  </button>
);

// ─── Value chip (the prototype-faithful primary surface) ──────────────────────

interface ValueChipProps {
  token: DesignToken;
  isActive: boolean;
  isDirty: boolean;
  onClick: () => void;
}

const ValueChip: React.FC<ValueChipProps> = ({ token, isActive, isDirty, onClick }) => {
  const num = parseFloat(token.value);
  const display = Number.isFinite(num) ? String(num) : token.value;
  return (
    <button
      type="button"
      role="listitem"
      aria-label={`Edit spacing ${token.name} (${token.value})`}
      aria-pressed={isActive}
      onClick={onClick}
      style={{
        position: "relative",
        padding: "5px 12px",
        borderRadius: 5,
        background: isActive ? "var(--bd-accent-tint, rgba(45,109,255,0.10))" : "var(--bd-bg-subtle)",
        color: isActive ? "var(--bd-accent)" : "var(--bd-fg-primary)",
        border: isActive ? "1px solid var(--bd-accent)" : "1px solid transparent",
        font: "500 11px var(--buildrick-font-family-mono, ui-monospace, monospace)",
        cursor: "pointer",
        outline: "none",
      }}
    >
      {display}
      {isDirty && (
        <span
          aria-label="unsaved changes"
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--bd-warning, #f59e0b)",
          }}
        />
      )}
    </button>
  );
};

// ─── Edit drawer (inline below the chip grid) ─────────────────────────────────

interface EditDrawerProps {
  token: DesignToken;
  onChange: (id: string, value: string) => void;
  onUndo: (id: string) => void;
  canUndo: boolean;
  onRedo: (id: string) => void;
  canRedo: boolean;
  onClose: () => void;
}

const EditDrawer: React.FC<EditDrawerProps> = ({
  token, onChange, onUndo, canUndo, onRedo, canRedo, onClose,
}) => {
  const num = parseFloat(token.value);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = parseFloat(e.target.value);
    if (!Number.isNaN(next) && next >= 0) onChange(token.id, `${next}px`);
  };
  return (
    <div
      style={{
        marginTop: 8,
        padding: 10,
        background: "var(--bd-bg-subtle)",
        border: "1px solid var(--bd-border)",
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span
        style={{
          font: "500 11px var(--buildrick-font-family-mono, ui-monospace, monospace)",
          color: "var(--bd-fg-primary)",
          flex: 1,
        }}
      >
        {token.name}
      </span>
      <input
        type="number"
        aria-label={`Value for ${token.name}`}
        value={Number.isFinite(num) ? num : 0}
        min={0}
        max={999}
        step={1}
        onChange={handleChange}
        autoFocus
        style={{
          width: 60,
          padding: "4px 6px",
          background: "var(--bd-surface-1, #fff)",
          border: "1px solid var(--bd-border)",
          borderRadius: 4,
          color: "var(--bd-fg-primary)",
          font: "500 11px var(--buildrick-font-family-mono, ui-monospace, monospace)",
          textAlign: "right",
        }}
      />
      <span style={{ fontSize: 11, color: "var(--bd-fg-muted)" }}>px</span>
      {num === 0 && (
        <span
          title="Zero spacing will collapse layout gaps"
          style={{ color: "var(--bd-warning)", fontSize: 12 }}
          aria-label="zero-spacing warning"
        >
          ⚠
        </span>
      )}
      {canUndo && (
        <button
          type="button"
          onClick={() => onUndo(token.id)}
          title="Undo"
          aria-label={`Undo change to ${token.name}`}
          style={iconBtnStyle("var(--bd-warning)")}
        >
          ↩
        </button>
      )}
      {canRedo && (
        <button
          type="button"
          onClick={() => onRedo(token.id)}
          title="Redo"
          aria-label={`Redo change to ${token.name}`}
          style={iconBtnStyle("var(--bd-accent)")}
        >
          ↪
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close edit drawer"
        style={{
          background: "none",
          border: "none",
          padding: 4,
          cursor: "pointer",
          color: "var(--bd-fg-muted)",
          fontSize: 13,
        }}
      >
        ×
      </button>
    </div>
  );
};

function iconBtnStyle(color: string): React.CSSProperties {
  return {
    background: "none",
    border: "none",
    padding: 4,
    cursor: "pointer",
    color,
    fontSize: 13,
  };
}

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
  usageByTokenId,
}) => {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const activeToken = activeId ? tokens.find((t) => t.id === activeId) ?? null : null;

  // Pending-diff is encoded by callers via the token's value vs initial state.
  // SpacingTokenList itself doesn't track per-token diffs — we surface dirtiness
  // at the component level (preset-change banner). Per-chip dirty marker requires
  // a savedTokens reference, which the parent passes via the dirty banner.

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Preset chips + Reset defaults */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, alignItems: "center" }}>
        {(["compact", "normal", "spacious"] as SpacingPreset[]).map((p) => (
          <PresetChip
            key={p}
            preset={p}
            isActive={activePreset === p}
            onApply={() => onPresetApply(p)}
          />
        ))}
        <button
          type="button"
          onClick={onResetToDefaults}
          title="Reset all spacing to factory defaults"
          style={{
            padding: "4px 10px",
            background: "transparent",
            border: "1px solid var(--bd-border)",
            borderRadius: 20,
            color: "var(--bd-fg-muted)",
            fontSize: 11,
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
          <span style={{ fontSize: 12, color: "rgba(245,158,11,0.9)", lineHeight: 1.5 }}>
            ⚠ {tokens.length} spacing tokens updated. Review before applying.
          </span>
        </div>
      )}

      {/* Mono mini metadata header — wrapped with chip grid + drawer in a
       * maxWidth column so the whole composition keeps prototype-sidebar
       * density even in the live editor's fullpage Design drawer. */}
      <div style={{ maxWidth: 320 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            font: "600 10px var(--buildrick-font-family-mono, ui-monospace, monospace)",
            color: "var(--bd-fg-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Scale
        </span>
        <div style={{ flex: 1, height: 1, background: "var(--bd-border)" }} />
        <span
          style={{
            font: "500 10px var(--buildrick-font-family-mono, ui-monospace, monospace)",
            color: "var(--bd-fg-secondary)",
          }}
        >
          4-pt grid
        </span>
      </div>

      {/* Chip pill grid (prototype-faithful primary surface) */}
      <div
        role="list"
        aria-label="Spacing tokens"
        style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
      >
        {tokens.map((t) => (
          <div
            key={t.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            <ValueChip
              token={t}
              isActive={activeId === t.id}
              isDirty={false}
              onClick={() => setActiveId((prev) => (prev === t.id ? null : t.id))}
            />
            <TokenUsageChip count={usageByTokenId?.get(t.id) ?? 0} />
          </div>
        ))}
      </div>

      {/* Inline edit drawer when a chip is active */}
      {activeToken && (
        <EditDrawer
          token={activeToken}
          onChange={onTokenChange}
          onUndo={onUndo}
          canUndo={canUndo(activeToken.id)}
          onRedo={onRedo}
          canRedo={canRedo(activeToken.id)}
          onClose={() => setActiveId(null)}
        />
      )}
      </div> {/* maxWidth wrapper close */}
    </div>
  );
};

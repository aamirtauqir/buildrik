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
import { Button, TextInput } from "flowbite-react";
import { BK_TEXT_INPUT_THEME } from "@/editor/ui/textInputTheme";

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
  /** T8: chip click → drill-in detail. Wired via shift-click + Cmd/Ctrl-click
   *  semantics would conflict with the inline edit drawer, so we surface
   *  drill-in on the TokenUsageChip below the value chip — it's a separate
   *  click target that already lives next to each spacing chip. */
  onRowClick?: (tokenId: string) => void;
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
  <Button
    type="button"
    color="light"
    size="xs"
    onClick={onApply}
    style={{
      padding: "4px 10px",
      borderRadius: 20,
      border: "1px solid",
      borderColor: isActive ? "var(--bk-accent)" : "var(--bk-border)",
      background: isActive ? "rgba(45, 109, 255, 0.15)" : "transparent",
      color: isActive ? "var(--bk-accent)" : "var(--bk-ink-muted)",
      fontSize: 11,
      fontWeight: isActive ? 600 : 500,
      cursor: "pointer",
    }} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
  >
    {PRESET_LABELS[preset]}
  </Button>
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
    <Button
      type="button"
      color="light"
      size="xs"
      role="listitem"
      aria-label={`Edit spacing ${token.name} (${token.value})`}
      aria-pressed={isActive}
      onClick={onClick}
      style={{
        position: "relative",
        padding: "5px 12px",
        borderRadius: 5,
        background: isActive ? "var(--bk-accent-tint, rgba(45,109,255,0.10))" : "var(--bk-bg-subtle)",
        color: isActive ? "var(--bk-accent)" : "var(--bk-ink)",
        border: isActive ? "1px solid var(--bk-accent)" : "1px solid transparent",
        font: "500 11px var(--bk-font-mono, ui-monospace, monospace)",
        cursor: "pointer",
        outline: "none",
      }} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
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
            borderRadius: "var(--bk-radius-full)",
            background: "var(--bk-warning)",
          }}
        />
      )}
    </Button>
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
        background: "var(--bk-bg-subtle)",
        border: "1px solid var(--bk-border)",
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span
        style={{
          font: "500 11px var(--bk-font-mono, ui-monospace, monospace)",
          color: "var(--bk-ink)",
          flex: 1,
        }}
      >
        {token.name}
      </span>
      <TextInput theme={BK_TEXT_INPUT_THEME}
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
          background: "var(--bk-bg-card)",
          border: "1px solid var(--bk-border)",
          borderRadius: 4,
          color: "var(--bk-ink)",
          font: "500 11px var(--bk-font-mono, ui-monospace, monospace)",
          textAlign: "right",
        }}
      />
      <span style={{ fontSize: 11, color: "var(--bk-ink-muted)" }}>px</span>
      {num === 0 && (
        <span
          title="Zero spacing will collapse layout gaps"
          style={{ color: "var(--bk-warning)", fontSize: 12 }}
          aria-label="zero-spacing warning"
        >
          ⚠
        </span>
      )}
      {canUndo && (
        <Button
          type="button"
          color="light"
          size="xs"
          onClick={() => onUndo(token.id)}
          title="Undo"
          aria-label={`Undo change to ${token.name}`}
          style={iconBtnStyle("var(--bk-warning)")} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
        >
          ↩
        </Button>
      )}
      {canRedo && (
        <Button
          type="button"
          color="light"
          size="xs"
          onClick={() => onRedo(token.id)}
          title="Redo"
          aria-label={`Redo change to ${token.name}`}
          style={iconBtnStyle("var(--bk-accent)")} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
        >
          ↪
        </Button>
      )}
      <Button
        type="button"
        color="light"
        size="xs"
        onClick={onClose}
        aria-label="Close edit drawer"
        style={{
          background: "none",
          border: "none",
          padding: 4,
          cursor: "pointer",
          color: "var(--bk-ink-muted)",
          fontSize: 13,
        }} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
      >
        ×
      </Button>
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
  onRowClick,
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
        <Button
          type="button"
          color="light"
          size="xs"
          onClick={onResetToDefaults}
          title="Reset all spacing to factory defaults"
          style={{
            padding: "4px 10px",
            background: "transparent",
            border: "1px solid var(--bk-border)",
            borderRadius: 20,
            color: "var(--bk-ink-muted)",
            fontSize: 11,
            cursor: "pointer",
            marginLeft: "auto",
          }}
        >
          Reset defaults
        </Button>
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
            font: "600 10px var(--bk-font-mono, ui-monospace, monospace)",
            color: "var(--bk-ink-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Scale
        </span>
        <div style={{ flex: 1, height: 1, background: "var(--bk-border)" }} />
        <span
          style={{
            font: "500 10px var(--bk-font-mono, ui-monospace, monospace)",
            color: "var(--bk-ink-soft)",
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
            data-token-row={t.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
            onContextMenu={
              onRowClick
                ? (e) => {
                    e.preventDefault();
                    onRowClick(t.id);
                  }
                : undefined
            }
          >
            <ValueChip
              token={t}
              isActive={activeId === t.id}
              isDirty={false}
              onClick={() => setActiveId((prev) => (prev === t.id ? null : t.id))}
            />
            {onRowClick ? (
              <Button
                type="button"
                color="light"
                size="xs"
                onClick={() => onRowClick(t.id)}
                aria-label={`Open details for ${t.name}`}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  display: "inline-flex",
                }} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
              >
                <TokenUsageChip count={usageByTokenId?.get(t.id) ?? 0} />
              </Button>
            ) : (
              <TokenUsageChip count={usageByTokenId?.get(t.id) ?? 0} />
            )}
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

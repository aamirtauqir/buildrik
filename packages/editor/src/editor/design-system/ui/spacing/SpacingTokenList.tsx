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
import { Button, TextInput } from "@/editor/chrome-ui";

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

const MONO = "tw:[font-family:var(--bk-font-mono)]";
/** Pill-shaped preset/reset control. */
const PILL = "tw:px-2.5 tw:py-1 tw:rounded-[20px] tw:border tw:text-[11px]";
/** Bare icon glyph button inside the edit drawer. */
const ICON_BTN = "tw:p-1 tw:border-transparent tw:bg-transparent tw:text-[13px]";

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
    className={`${PILL} ${
      isActive
        ? "tw:border-[var(--bk-accent)] tw:bg-[var(--bk-accent-tint)] tw:text-[var(--bk-accent-text)] tw:font-semibold"
        : "tw:border-gray-200 tw:bg-transparent tw:text-gray-500 tw:font-medium tw:hover:text-gray-900"
    }`}
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
      className={`tw:relative tw:px-3 tw:py-[5px] tw:rounded-[5px] tw:border tw:text-[11px] tw:font-medium ${MONO} ${
        isActive
          ? "tw:border-[var(--bk-accent)] tw:bg-[var(--bk-accent-tint)] tw:text-[var(--bk-accent-text)]"
          : "tw:border-transparent tw:bg-[var(--bk-bg-subtle)] tw:text-gray-900 tw:hover:bg-gray-100"
      }`}
    >
      {display}
      {isDirty && (
        <span
          aria-label="unsaved changes"
          className="tw:absolute tw:-top-0.5 tw:-right-0.5 tw:size-1.5 tw:rounded-full tw:bg-[var(--bk-warning)]"
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
    <div className="tw:flex tw:items-center tw:gap-2 tw:mt-2 tw:p-2.5 tw:rounded-lg tw:border tw:border-gray-200 tw:bg-[var(--bk-bg-subtle)]">
      <span className={`tw:flex-1 tw:text-[11px] tw:font-medium tw:text-gray-900 ${MONO}`}>
        {token.name}
      </span>
      <TextInput
        type="number"
        aria-label={`Value for ${token.name}`}
        value={Number.isFinite(num) ? num : 0}
        min={0}
        max={999}
        step={1}
        onChange={handleChange}
        autoFocus
        className="tw:w-15 tw:[&_input]:h-6 tw:[&_input]:py-1 tw:[&_input]:px-1.5 tw:[&_input]:text-right tw:[&_input]:text-[11px] tw:[&_input]:font-medium tw:[&_input]:[font-family:var(--bk-font-mono)]"
      />
      <span className="tw:text-[11px] tw:text-gray-500">px</span>
      {num === 0 && (
        <span
          title="Zero spacing will collapse layout gaps"
          className="tw:text-xs tw:text-[var(--bk-warning)]"
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
          className={`${ICON_BTN} tw:text-[var(--bk-warning)]`}
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
          className={`${ICON_BTN} tw:text-[var(--bk-accent-text)]`}
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
        className={`${ICON_BTN} tw:text-gray-500 tw:hover:text-gray-900`}
      >
        ×
      </Button>
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
    <div className="tw:flex tw:flex-col">
      {/* Preset chips + Reset defaults */}
      <div className="tw:flex tw:items-center tw:gap-1.5 tw:mb-3">
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
          className={`${PILL} tw:ml-auto tw:border-gray-200 tw:bg-transparent tw:text-gray-500 tw:hover:text-gray-900`}
        >
          Reset defaults
        </Button>
      </div>

      {/* Preset change warning banner */}
      {activePreset !== savedPreset && isDirty && (
        <div className="tw:flex tw:items-center tw:gap-1.5 tw:mb-2.5 tw:px-2.5 tw:py-2 tw:rounded-[7px] tw:border tw:border-[var(--bk-warning-text)] tw:bg-[var(--bk-warning-tint)]">
          <span className="tw:text-xs tw:leading-normal tw:text-[var(--bk-warning)]">
            ⚠ {tokens.length} spacing tokens updated. Review before applying.
          </span>
        </div>
      )}

      {/* Mono mini metadata header — wrapped with chip grid + drawer in a
       * maxWidth column so the whole composition keeps prototype-sidebar
       * density even in the live editor's fullpage Design drawer. */}
      <div className="tw:max-w-80">
      <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
        <span className={`tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-[0.08em] tw:text-gray-500 ${MONO}`}>
          Scale
        </span>
        <div className="tw:flex-1 tw:h-px tw:bg-gray-200" />
        <span className={`tw:text-[10px] tw:font-medium tw:text-[var(--bk-ink-soft)] ${MONO}`}>
          4-pt grid
        </span>
      </div>

      {/* Chip pill grid (prototype-faithful primary surface) */}
      <div
        role="list"
        aria-label="Spacing tokens"
        className="tw:flex tw:flex-wrap tw:gap-2"
      >
        {tokens.map((t) => (
          <div
            key={t.id}
            data-token-row={t.id}
            className="tw:flex tw:flex-col tw:items-center tw:gap-[3px]"
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
                className="tw:inline-flex tw:p-0 tw:border-transparent tw:bg-transparent"
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

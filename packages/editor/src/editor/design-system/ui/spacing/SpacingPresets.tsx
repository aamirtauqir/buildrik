/**
 * SpacingPresets — the Spacing page's preset row above its table: Compact /
 * Normal / Spacious restage every space-* token on the 4px grid, and Reset
 * defaults stages the factory scale. Both stage; Save applies.
 *
 * Board 7576:197036 prints presets per row (the PRESET column, "presets +
 * custom" in the caption) and draws no chip row; the chips stay because they
 * are the only way to APPLY a preset, and the C1 done-condition is that this
 * page lists them.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { SpacingPreset } from "../../state/useSpacingTokens";
import { Button } from "@/editor/chrome-ui";

export const SPACING_PRESET_LABELS: Record<SpacingPreset, string> = {
  compact: "Compact",
  normal: "Normal",
  spacious: "Spacious",
};

const BASE: Record<SpacingPreset, string> = { compact: "2px", normal: "4px", spacious: "6px" };

const CHIP =
  "tw:h-7 tw:rounded-[var(--bk-radius-md)] tw:border tw:px-3 tw:text-[length:var(--bk-text-13)] tw:font-normal tw:leading-4 tw:focus:ring-0";

export const SpacingPresets: React.FC<{
  activePreset: SpacingPreset | null;
  onPresetApply: (preset: SpacingPreset) => void;
  onResetToDefaults: () => void;
}> = ({ activePreset, onPresetApply, onResetToDefaults }) => (
  <div className="tw:mb-4 tw:flex tw:items-center tw:gap-2" role="group" aria-label="Spacing presets" data-testid="spacing-presets">
    {(["compact", "normal", "spacious"] as SpacingPreset[]).map((p) => (
      <Button
        key={p}
        type="button"
        variant="secondary"
        size="xs"
        aria-pressed={activePreset === p}
        data-testid={`spacing-preset-${p}`}
        onClick={() => onPresetApply(p)}
        className={`${CHIP} ${
          activePreset === p
            ? "tw:border-[var(--bk-accent)] tw:bg-[var(--bk-accent-tint)] tw:text-[var(--bk-accent-text)]"
            : "tw:border-[var(--bk-border)] tw:text-[var(--bk-ink)]"
        }`}
      >
        {SPACING_PRESET_LABELS[p]} · {BASE[p]}
      </Button>
    ))}
    <Button
      type="button"
      variant="secondary"
      size="xs"
      onClick={onResetToDefaults}
      data-testid="spacing-reset-defaults"
      className={`${CHIP} tw:ml-auto tw:border-[var(--bk-border)] tw:text-[var(--bk-ink-muted)]`}
    >
      Reset defaults
    </Button>
  </div>
);

/**
 * Color Mode Toggle — 2-pill seg `[Light][Dark]` per spec D1 (DS prototype
 * full rewrite arc).
 *
 *   - `role="tablist"` container with `aria-label="Color mode"`.
 *   - Each pill: `role="tab"` + `aria-selected`.
 *   - Active pill uses `var(--bk-accent)` bg + white fg; inactive is transparent.
 *   - System mode dropped from UI; composer state preserves auto-detect for
 *     first load. When composer resolves to "dark", Dark pill is active.
 *
 * Wires to:
 *   - composer.colorMode (B.0) — get/set/resolved
 *   - useColorMode hook — subscribes to "colorMode:changed"
 *
 * (ColorModeIconCycle, the icon-cycle sibling, was never mounted and was deleted 2026-09-02.)
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "../../../engine";
import { useColorMode } from "../state/useColorMode";
import { Button } from "@/editor/chrome-ui";

export interface ColorModeToggleProps {
  composer: Composer;
}

export const ColorModeToggle: React.FC<ColorModeToggleProps> = ({ composer }) => {
  const mode = useColorMode(composer);

  const resolved =
    typeof composer.colorMode.resolved === "function"
      ? composer.colorMode.resolved()
      : mode === "system"
        ? "light"
        : mode;
  const active: "light" | "dark" = resolved === "dark" ? "dark" : "light";

  return (
    <div
      role="tablist"
      aria-label="Color mode"
      data-testid="brand-colour-mode-seg"
      /* 7316:80949: a 24-tall white track with a hairline, drawn over the
         top of the live preview's frame; the active segment is the grey one. */
      className="tw:box-border tw:inline-flex tw:h-6 tw:items-center tw:gap-0.5 tw:rounded-[var(--bk-radius-md)] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:p-px"
    >
      <Pill value="light" label="Light" active={active === "light"} composer={composer} />
      <Pill value="dark" label="Dark" active={active === "dark"} composer={composer} />
    </div>
  );
};

interface PillProps {
  value: "light" | "dark";
  label: string;
  active: boolean;
  composer: Composer;
}

const Pill: React.FC<PillProps> = ({ value, label, active, composer }) => (
  <Button
    type="button"
    color="light"
    size="xs"
    role="tab"
    aria-selected={active}
    data-testid={`brand-colour-mode-seg-${value}`}
    onClick={() => composer.colorMode.set(value)}
    /* 7316:80949: 43 × 20, 12px; the active segment is `--bk-gray-100` with
       ink, the other plain. The inactive label is `--bk-ink-soft`, not the
       board's ink-muted — the same AA substitution DesignTabFooter documents. */
    className={
      "tw:h-5 tw:min-h-0 tw:w-[43px] tw:rounded-[var(--bk-radius-sm)] tw:border-0 tw:p-0 tw:text-[length:var(--bk-text-12)] tw:font-normal tw:leading-4 tw:focus:ring-0 " +
      (active
        ? "tw:bg-[var(--bk-gray-100)] tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-gray-100)]"
        : "tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:enabled:hover:bg-transparent tw:enabled:hover:text-[var(--bk-ink)]")
    }
  >
    {label}
  </Button>
);

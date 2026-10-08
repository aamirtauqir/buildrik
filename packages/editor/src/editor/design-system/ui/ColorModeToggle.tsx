/**
 * Color Mode Toggle — the live preview card's 2-pill seg `[Light][Dark]`.
 *
 *   - `role="tablist"` container with `aria-label="Color mode"`.
 *   - Each pill: `role="tab"` + `aria-selected`.
 *
 * PREVIEW-ONLY (L4-021, BRP1-M8 dark-preview 8224:240644 · preview-disabled
 * 8224:241285 · auto-dark-preview 8230:232622): the switch shows the canvas
 * in the other theme through the Brand preview layer (`designSystem.preview`)
 * — never saved, never in the undo history. It used to call
 * `composer.colorMode.set`, which persisted a global, all-sites preference.
 * The site's Dark mode (Off / Auto) is the separate, saved setting; while it
 * is Off the Dark segment is disabled with "Dark mode is off for this site"
 * (an Off site publishes light only). The workspace owns the state.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button } from "@/editor/chrome-ui";

export interface ColorModeToggleProps {
  /** The theme the preview shows. */
  theme: "light" | "dark";
  onChange: (theme: "light" | "dark") => void;
  /** The site's Dark mode is Off: Dark is disabled. */
  siteOff: boolean;
  /** Another Brand flow is previewing: the switch waits for it. */
  locked?: boolean;
}

const OFF_HINT = "Dark mode is off for this site";

export const ColorModeToggle: React.FC<ColorModeToggleProps> = ({ theme, onChange, siteOff, locked = false }) => (
  <div
    role="tablist"
    aria-label="Color mode"
    data-testid="brand-colour-mode-seg"
    /* 7316:80949: a 24-tall white track with a hairline, in the live
       preview card's header row; the active segment is the grey one. */
    className="tw:box-border tw:inline-flex tw:h-6 tw:items-center tw:gap-0.5 tw:rounded-[var(--bk-radius-md)] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:p-px"
  >
    <Pill value="light" label="Light" active={theme === "light"} onChange={onChange} disabled={locked} />
    <Pill
      value="dark"
      label="Dark"
      active={theme === "dark"}
      onChange={onChange}
      disabled={locked || siteOff}
      hint={siteOff ? OFF_HINT : undefined}
    />
  </div>
);

interface PillProps {
  value: "light" | "dark";
  label: string;
  active: boolean;
  onChange: (theme: "light" | "dark") => void;
  disabled: boolean;
  hint?: string;
}

const Pill: React.FC<PillProps> = ({ value, label, active, onChange, disabled, hint }) => (
  <Button
    type="button"
    color="light"
    size="xs"
    role="tab"
    aria-selected={active}
    data-testid={`brand-colour-mode-seg-${value}`}
    disabled={disabled}
    title={hint}
    onClick={() => onChange(value)}
    /* 7316:80949: 43 × 20, 12px; the active segment is `--bk-gray-100` with
       ink, the other plain. The inactive label is `--bk-ink-soft`, not the
       board's ink-muted — the same AA substitution DesignTabFooter documents. */
    className={
      "tw:h-5 tw:min-h-0 tw:w-[43px] tw:rounded-[var(--bk-radius-sm)] tw:border-0 tw:p-0 tw:text-[length:var(--bk-text-12)] tw:font-normal tw:leading-4 tw:focus:ring-0 " +
      (active
        ? "tw:bg-[var(--bk-gray-100)] tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-gray-100)]"
        : "tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:enabled:hover:bg-transparent tw:enabled:hover:text-[var(--bk-ink)] tw:disabled:text-[var(--bk-ink-disabled)] tw:disabled:opacity-100")
    }
  >
    {label}
  </Button>
);

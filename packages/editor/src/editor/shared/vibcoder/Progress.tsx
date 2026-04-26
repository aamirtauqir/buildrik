/**
 * Vibcoder Progress wrapper.
 * Renders the `bd-progress` atom from src/themes/components/atoms/progress.css.
 *
 * Variant + size + state union from `vibcoder-variants.mjs atoms/progress`:
 *   variants: success, warning, error  (default = virtual accent — omit class)
 *   sizes:    sm (4px), lg (8px)       (default = md 6px — omit class)
 *   states:   indeterminate
 *
 * Determinate value is threaded through the CSS custom property
 * `--bdr-progress-value` (a 0..1 fraction). The vendored CSS keeps the
 * `bdr-` namespaced custom-property name (codemod 1 only renames class +
 * keyframe identifiers — `--bdr-*` custom props are intentionally untouched).
 *
 * Composite shape (single atom, optional row container):
 *   When `label` OR `showPercent` is set, the wrapper renders the
 *   `bd-progress-row` composite (label / percent on top, bar below).
 *   Otherwise it renders the bare `bd-progress` bar.
 *   Same idiom Slider.tsx uses (head row only when label provided).
 *
 * A11y:
 *   - Determinate: role="progressbar" + aria-valuenow + aria-valuemin/max
 *   - Indeterminate: role="progressbar" only (no aria-valuenow per ARIA spec)
 *   - Caller can override aria-label / aria-labelledby via ...rest.
 *
 * Value clamping: out-of-range `value` is clamped to [0, 1] before being
 * threaded into the custom property + aria-valuenow. Same defensive
 * choice as Slider — protects the visual track from overflow if upstream
 * state lags during streaming updates.
 *
 * forwardRef targets the outer wrapper div (whichever shape ships —
 * row composite when label set, bare bar otherwise). Caller usually
 * wants the labeled element for tooltip / focus-shift.
 *
 * @license BSD-3-Clause
 */
import { type CSSProperties, type HTMLAttributes, forwardRef } from "react";

export type ProgressVariant = "success" | "warning" | "error";
export type ProgressSize = "sm" | "lg";

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
  /** Determinate value in [0, 1]. Ignored when `indeterminate`. */
  value?: number;
  variant?: ProgressVariant;
  size?: ProgressSize;
  indeterminate?: boolean;
  /** Optional label text rendered above the bar (forces row composite). */
  label?: string;
  /** When true, renders the percent string above the bar (forces row composite). */
  showPercent?: boolean;
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value = 0,
      variant,
      size,
      indeterminate = false,
      label,
      showPercent = false,
      className,
      style,
      ...rest
    },
    ref,
  ) => {
    const clamped = Math.max(0, Math.min(1, value));
    const pct = Math.round(clamped * 100);

    const barClasses = [
      "bd-progress",
      // default tone (accent) has no modifier class
      variant && `bd-progress--${variant}`,
      // default size (md, 6px) has no modifier class
      size && `bd-progress--${size}`,
      indeterminate && "bd-progress--indeterminate",
    ]
      .filter(Boolean)
      .join(" ");

    // Indeterminate ignores --bdr-progress-value (CSS overrides transform with
    // the slide animation). Skip the custom prop entirely to keep style attr clean.
    const barStyle: CSSProperties = indeterminate
      ? {}
      : ({ "--bdr-progress-value": String(clamped) } as CSSProperties);

    const ariaProps = indeterminate
      ? { role: "progressbar" as const }
      : {
          role: "progressbar" as const,
          "aria-valuenow": pct,
          "aria-valuemin": 0,
          "aria-valuemax": 100,
        };

    const showRow = label !== undefined || showPercent;

    if (!showRow) {
      // Bare bar — outer ref targets the bar itself.
      const mergedClasses = [barClasses, className].filter(Boolean).join(" ");
      return (
        <div
          ref={ref}
          className={mergedClasses}
          style={{ ...barStyle, ...style }}
          {...ariaProps}
          {...rest}
        >
          <div className="bd-progress__bar" />
        </div>
      );
    }

    // Row composite — outer ref targets the row wrapper.
    const rowClasses = ["bd-progress-row", className].filter(Boolean).join(" ");
    return (
      <div ref={ref} className={rowClasses} style={style} {...rest}>
        <div className="bd-progress-row__label">
          <span>{label}</span>
          {showPercent && (
            <span className="bd-progress-row__pct">
              {indeterminate ? "" : `${pct}%`}
            </span>
          )}
        </div>
        <div className={barClasses} style={barStyle} {...ariaProps}>
          <div className="bd-progress__bar" />
        </div>
      </div>
    );
  },
);
Progress.displayName = "Progress";

/**
 * Vibcoder ToggleRow wrapper — settings row composite.
 * Renders the bd-toggle-row composite from
 * src/themes/components/molecules/toggle-row.css.
 *
 * Slot composition (Contract A from Phase 2 design):
 *   label     required structural slot → flat string
 *   helper    optional supportive slot → flat string (renders __desc)
 *   children  variable content slot — caller passes <Switch /> or
 *             <Checkbox /> or any control. The CSS reserves space-between
 *             layout so the control naturally right-aligns.
 *   disabled  state flag → adds .is-disabled (CSS dims label + helper)
 *
 * No cross-atom imports. The CSS owns its own .bd-toggle-row__name and
 * .bd-toggle-row__desc selectors (NOT .bd-label / .bd-helper-text).
 * Importing Label here would emit the wrong classnames; the toggle-row
 * label slot is a distinct typography surface from the form-field label.
 *
 * Variant union from `vibcoder-variants.mjs molecules/toggle-row`:
 *   variants: first  (--first variant — kills top border, mirrors
 *                     :first-child styling for non-first rows that need
 *                     the borderless look)
 *             inset  (--inset adds horizontal padding for use outside
 *                     a card with its own padding)
 *
 * forwardRef on the root <div> — measurement consumers (sticky settings
 * columns) need it.
 *
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, type ReactNode, forwardRef } from "react";

export interface ToggleRowProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Required label text (the control's primary descriptor). */
  label: string;
  /** Optional supportive description text shown below the label. */
  helper?: string;
  /**
   * Visual-only disabled state — dims the row and adds `is-disabled` class
   * (CSS sets `cursor: not-allowed` on the row).
   *
   * Note: pass `disabled` to your control child separately for true input
   * disabling. This prop only styles the row, it does NOT propagate.
   */
  disabled?: boolean;
  /** Adds the --first variant (kills top border + top padding). */
  first?: boolean;
  /** Adds the --inset variant (horizontal padding for off-card use). */
  inset?: boolean;
  /** Control slot — caller passes <Switch /> or <Checkbox />. */
  children: ReactNode;
}

export const ToggleRow = forwardRef<HTMLDivElement, ToggleRowProps>(
  (
    { label, helper, disabled, first, inset, className, children, ...rest },
    ref,
  ) => {
    const classes = [
      "bd-toggle-row",
      first && "bd-toggle-row--first",
      inset && "bd-toggle-row--inset",
      disabled && "is-disabled",
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        <div className="bd-toggle-row__meta">
          <span className="bd-toggle-row__name">{label}</span>
          {helper && <span className="bd-toggle-row__desc">{helper}</span>}
        </div>
        {children}
      </div>
    );
  },
);
ToggleRow.displayName = "ToggleRow";

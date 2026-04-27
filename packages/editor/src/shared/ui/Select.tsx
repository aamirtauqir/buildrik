// PHASE 5 DELETE — Phase 4 adapter shim. Replaces inline <select> JSX.
/**
 * Adapter shim — exposes vibcoder Select under the legacy `@/shared/ui`
 * namespace. There was no hand-rolled Select primitive — consumers used
 * raw `<select>` JSX. The codemod swaps those to `<Select>` and points
 * imports at this file.
 *
 * Prop translations (Phase 4 Q4 mapping):
 *   size (xs | sm | md): passthrough — vibcoder Select supports all three.
 *   error (boolean): passthrough → bd-select--error class + aria-invalid.
 *   value / defaultValue / onChange / disabled / name / multiple / etc.:
 *     native SelectHTMLAttributes pass through via {...rest}.
 *   children: caller passes `<option>` elements directly (no items array).
 *
 * Untranslatable: none. Throws-at-render strategy (Phase 4 Q4) applies if
 * a future legacy-only prop arrives without a vibcoder mapping.
 *
 * @license BSD-3-Clause
 */
import { forwardRef, type SelectHTMLAttributes, type ReactNode } from "react";
import { Select as VibcoderSelect, type SelectSize } from "@/editor/shared/vibcoder";

export type { SelectSize };

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  size?: SelectSize;
  error?: boolean;
  children?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ size = "md", error = false, children, ...rest }, ref) => {
    return (
      <VibcoderSelect ref={ref} size={size} error={error} {...rest}>
        {children}
      </VibcoderSelect>
    );
  },
);
Select.displayName = "Select";

export default Select;

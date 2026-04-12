/**
 * GapControls - Thin wrapper around LinkedGapInput with a section label.
 *
 * Previously had its own link toggle logic and split row/col layout. Replaced
 * with the shared LinkedGapInput primitive so flex + grid share one source of
 * truth for the linked/unlinked gap UX.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { LinkedGapInput } from "../../shared/controls";
import { INSPECTOR_TOKENS } from "../../shared/controls/controlStyles";

// ============================================================================
// TYPES
// ============================================================================

export interface GapControlsProps {
  styles: Record<string, string>;
  onChange: (prop: string, val: string) => void;
  onBatchChange?: (changes: Record<string, string>) => void;
  disabled: (prop: string) => boolean | undefined;
  /** Unused after migration — kept for call-site compatibility. */
  inputStyle?: React.CSSProperties;
  /** Unused after migration — kept for call-site compatibility. */
  rowStyle?: React.CSSProperties;
  /** Unused after migration — kept for call-site compatibility. */
  labelStyle?: React.CSSProperties;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const GapControls: React.FC<GapControlsProps> = ({
  styles,
  onChange,
  onBatchChange,
  disabled,
}) => (
  <div
    style={{
      marginTop: 8,
      padding: 10,
      background: INSPECTOR_TOKENS.surfaceSubtle,
      borderRadius: 6,
      border: `1px solid ${INSPECTOR_TOKENS.borderSubtle}`,
    }}
  >
    <LinkedGapInput
      styles={styles}
      onChange={onChange}
      onBatchChange={onBatchChange}
      disabled={disabled("gap")}
    />
  </div>
);

export default GapControls;

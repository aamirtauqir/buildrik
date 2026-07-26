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
import { MixedValueBadge } from "../../shared/MixedValueBadge";

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
  mixedKeys?: ReadonlySet<string>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const GapControls: React.FC<GapControlsProps> = ({
  styles,
  onChange,
  onBatchChange,
  disabled,
  mixedKeys,
}) => (
  <div
    style={{
      marginTop: 8,
      padding: 10,
      background: "var(--bk-bg-subtle)",
      borderRadius: 6,
      border: `1px solid ${"var(--bk-border)"}`,
    }}
  >
    {mixedKeys?.has("gap") && (
      <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
        <MixedValueBadge compact />
        <span style={{ fontSize: 11, color: "var(--bk-ink-muted)" }}>Gap</span>
      </div>
    )}
    <LinkedGapInput
      styles={styles}
      onChange={onChange}
      onBatchChange={onBatchChange}
      disabled={disabled("gap")}
    />
  </div>
);

export default GapControls;

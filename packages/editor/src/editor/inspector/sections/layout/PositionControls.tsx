/**
 * Position Controls - Position mode selection and offset inputs
 * @license BSD-3-Clause
 */

import * as React from "react";
import { TextInput } from "@/editor/chrome-ui";
import { InputRow, SelectRow } from "../../shared/controls";
import { CONTROL_INPUT_WRAP } from "../../shared/controls/controlClasses";
import { MixedValueBadge } from "../../shared/MixedValueBadge";
import { CLUSTER_CAPTION, OFFSET_ANCHOR, OFFSET_PANEL } from "./classes";
// ============================================================================
// TYPES
// ============================================================================

export interface PositionControlsProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  propertyStates?: Record<
    string,
    { hidden?: boolean; disabled?: boolean; reason?: string; isOverridden?: boolean }
  >;
  mixedKeys?: ReadonlySet<string>;
}

// ============================================================================
// POSITION OPTIONS
// ============================================================================

/* Board 7058:78647: "Position [Static ▾]" — one select, not five tiles. */
const POSITION_OPTIONS = [
  { value: "static", label: "Static" },
  { value: "relative", label: "Relative" },
  { value: "absolute", label: "Absolute" },
  { value: "fixed", label: "Fixed" },
  { value: "sticky", label: "Sticky" },
];

const POSITION_HELP =
  "Static: normal flow. Relative: offset from normal position. Absolute: positioned relative to nearest positioned parent. Fixed: stays in viewport. Sticky: sticks when scrolling past.";

// ============================================================================
// CLASSES
// ============================================================================

/** The shared control input, narrowed and centred for the offset cross. */
const OFFSET_INPUT = `${CONTROL_INPUT_WRAP} tw:flex-none tw:w-[50px] tw:[&_input]:px-1 tw:[&_input]:text-center`;

// ============================================================================
// COMPONENT
// ============================================================================

export const PositionControls: React.FC<PositionControlsProps> = ({
  styles,
  onChange,
  propertyStates = {},
  mixedKeys,
}) => {
  const hasPosition = styles.position && styles.position !== "static";
  const disabled = (prop: string) => propertyStates[prop]?.disabled;
  const reason = (prop: string) => propertyStates[prop]?.reason;

  return (
    <>
      <div className="tw:relative">
        {mixedKeys?.has("position") && <MixedValueBadge compact />}
        <SelectRow
          label="Position"
          value={styles.position || "static"}
          onChange={(v) => onChange("position", v)}
          options={POSITION_OPTIONS}
          helperText={POSITION_HELP}
        />
      </div>
      {/* Position offset controls */}
      {hasPosition && (
        <PositionOffsetControls
          styles={styles}
          onChange={onChange}
          disabled={disabled}
          reason={reason}
          propertyStates={propertyStates}
          mixedKeys={mixedKeys}
        />
      )}
    </>
  );
};

// ============================================================================
// POSITION OFFSET CONTROLS (sub-component)
// ============================================================================

interface PositionOffsetControlsProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  disabled: (prop: string) => boolean | undefined;
  reason: (prop: string) => string | undefined;
  propertyStates?: Record<
    string,
    { hidden?: boolean; disabled?: boolean; reason?: string; isOverridden?: boolean }
  >;
  mixedKeys?: ReadonlySet<string>;
}

const PositionOffsetControls: React.FC<PositionOffsetControlsProps> = ({
  styles,
  onChange,
  disabled,
  reason,
  propertyStates = {},
  mixedKeys,
}) => {
  return (
    <div className={OFFSET_PANEL}>
      <div className={CLUSTER_CAPTION}>
        {(mixedKeys?.has("top") || mixedKeys?.has("right") || mixedKeys?.has("bottom") || mixedKeys?.has("left")) && (
          <MixedValueBadge compact />
        )}
        Position Offset
      </div>
      {/* Visual position box */}
      <div className="tw:grid tw:grid-cols-[1fr_auto_1fr] tw:grid-rows-[auto_auto_auto] tw:gap-1 tw:items-center tw:justify-items-center tw:mb-2">
        {/* Top */}
        <div />
        <TextInput
          type="text"
          value={styles.top || ""}
          onChange={(e) => onChange("top", e.target.value)}
          placeholder="top"
          className={OFFSET_INPUT}
          disabled={disabled("top")}
          title={reason("top")}
        />
        <div />

        {/* Left - Box - Right */}
        <TextInput
          type="text"
          value={styles.left || ""}
          onChange={(e) => onChange("left", e.target.value)}
          placeholder="left"
          className={OFFSET_INPUT}
          disabled={disabled("left")}
          title={reason("left")}
        />
        <div className={OFFSET_ANCHOR} />
        <TextInput
          type="text"
          value={styles.right || ""}
          onChange={(e) => onChange("right", e.target.value)}
          placeholder="right"
          className={OFFSET_INPUT}
          disabled={disabled("right")}
          title={reason("right")}
        />

        {/* Bottom */}
        <div />
        <TextInput
          type="text"
          value={styles.bottom || ""}
          onChange={(e) => onChange("bottom", e.target.value)}
          placeholder="bottom"
          className={OFFSET_INPUT}
          disabled={disabled("bottom")}
          title={reason("bottom")}
        />
        <div />
      </div>
      {/* Z-Index */}
      <div className="tw:mt-2">
        {mixedKeys?.has("z-index") && (
          <div className="tw:flex tw:items-center tw:mb-0.5">
            <MixedValueBadge compact />
            <span className="tw:text-[11px] tw:text-[var(--bk-ink-muted)]">Z-Index</span>
          </div>
        )}
        <InputRow
          label="Z-Index"
          value={styles["z-index"] || ""}
          onChange={(v) => onChange("z-index", v)}
          type="number"
          placeholder="auto"
          helperText="Controls the vertical stack order"
          isOverridden={propertyStates["z-index"]?.isOverridden}
        />
      </div>
    </div>
  );
};

export default PositionControls;

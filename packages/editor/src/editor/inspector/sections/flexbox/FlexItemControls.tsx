/**
 * FlexItemControls - Flex item (child) properties: grow, shrink, basis, order
 * @license BSD-3-Clause
 */

import * as React from "react";
import { MixedValueBadge } from "../../shared/MixedValueBadge";
import {
  CONTROL_BTN_GROUP,
  CONTROL_INPUT_WRAP,
  CONTROL_LABEL,
  CONTROL_ROW,
  compactBtnClass,
} from "../../shared/controls/controlClasses";
import { Button, TextInput } from "@/editor/chrome-ui";

/** grow / shrink / basis share one narrow cell each. */
const TRIPLE_CELL = "tw:flex tw:items-center tw:gap-1";
const TRIPLE_LABEL = "tw:w-[30px] tw:text-xs tw:text-gray-500";
const TRIPLE_INPUT = `${CONTROL_INPUT_WRAP} tw:[&_input]:px-[5px]`;
// ============================================================================
// TYPES
// ============================================================================

export interface FlexItemControlsProps {
  styles: Record<string, string>;
  onChange: (prop: string, val: string) => void;
  disabled: (prop: string) => boolean | undefined;
  reason: (prop: string) => string | undefined;
  mixedKeys?: ReadonlySet<string>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const FlexItemControls: React.FC<FlexItemControlsProps> = ({
  styles,
  onChange,
  disabled,
  reason,
  mixedKeys,
}) => (
  <div className="tw:mt-2.5 tw:pt-2.5 tw:border-t tw:border-gray-200">
    <div className="tw:mb-2 tw:text-xs tw:font-semibold tw:text-gray-500 tw:uppercase">
      Flex Item (Self)
    </div>

    {/* Grow, Shrink, Basis */}
    <div className="tw:grid tw:grid-cols-3 tw:gap-1 tw:mb-1.5">
      <div className={TRIPLE_CELL}>
        {mixedKeys?.has("flex-grow") && <MixedValueBadge compact />}
        <span className={TRIPLE_LABEL}>Grow</span>
        <TextInput
          type="number"
          value={styles["flex-grow"] || ""}
          onChange={(e) => onChange("flex-grow", e.target.value)}
          placeholder="0"
          min="0"
          className={TRIPLE_INPUT}
          title={reason("flex-grow")}
          disabled={disabled("flex-grow")}
        />
      </div>
      <div className={TRIPLE_CELL}>
        {mixedKeys?.has("flex-shrink") && <MixedValueBadge compact />}
        <span className={TRIPLE_LABEL}>Shrink</span>
        <TextInput
          type="number"
          value={styles["flex-shrink"] || ""}
          onChange={(e) => onChange("flex-shrink", e.target.value)}
          placeholder="1"
          min="0"
          className={TRIPLE_INPUT}
          title={reason("flex-shrink")}
          disabled={disabled("flex-shrink")}
        />
      </div>
      <div className={TRIPLE_CELL}>
        {mixedKeys?.has("flex-basis") && <MixedValueBadge compact />}
        <span className={TRIPLE_LABEL}>Basis</span>
        <TextInput
          type="text"
          value={styles["flex-basis"] || ""}
          onChange={(e) => onChange("flex-basis", e.target.value)}
          placeholder="auto"
          className={TRIPLE_INPUT}
          title={reason("flex-basis")}
          disabled={disabled("flex-basis")}
        />
      </div>
    </div>

    {/* Align Self */}
    <div className={CONTROL_ROW}>
      <label className={CONTROL_LABEL}>A-Self</label>
      <div className={CONTROL_BTN_GROUP}>
        {["auto", "start", "center", "end", "stretch", "base"].map((val) => {
          const actualVal =
            val === "start"
              ? "flex-start"
              : val === "end"
                ? "flex-end"
                : val === "base"
                  ? "baseline"
                  : val;
          return (
            <Button
              key={val}
              size="xs"
              className={compactBtnClass(styles["align-self"] === actualVal)}
              onClick={() => onChange("align-self", actualVal)}
              disabled={disabled("align-self")}
              title={reason("align-self")}
            >
              {val.slice(0, 3)}
            </Button>
          );
        })}
      </div>
    </div>

    {/* Order */}
    <div className={CONTROL_ROW}>
      <label className={CONTROL_LABEL}>Order</label>
      <TextInput
        type="number"
        value={styles.order || ""}
        onChange={(e) => onChange("order", e.target.value)}
        placeholder="0"
        className={CONTROL_INPUT_WRAP}
        disabled={disabled("order")}
        title={reason("order")}
      />
    </div>
  </div>
);

export default FlexItemControls;

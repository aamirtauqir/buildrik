/**
 * AlignmentSection - Alignment grid and justify/align controls
 * @license BSD-3-Clause
 */

import * as React from "react";
import { MixedValueBadge } from "../../shared/MixedValueBadge";
import { compactBtnClass } from "../../shared/controls/controlClasses";
import { FlexAlignmentGrid } from "./controls";
import { Button } from "@/editor/chrome-ui";

/** Caption above each alignment cluster. */
const CAPTION = "tw:flex tw:items-center tw:mb-1 tw:text-xs tw:text-gray-500";
// ============================================================================
// TYPES
// ============================================================================

export interface AlignmentSectionProps {
  styles: Record<string, string>;
  onChange: (prop: string, val: string) => void;
  mixedKeys?: ReadonlySet<string>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const AlignmentSection: React.FC<AlignmentSectionProps> = ({
  styles,
  onChange,
  mixedKeys,
}) => (
  <div className="tw:flex tw:items-start tw:gap-3 tw:mb-3">
    {/* 9-Dot Grid */}
    <div>
      <div className={`${CAPTION} tw:mb-1.5`}>Alignment</div>
      <FlexAlignmentGrid
        justifyContent={styles["justify-content"] || "flex-start"}
        alignItems={styles["align-items"] || "flex-start"}
        onJustifyChange={(val) => onChange("justify-content", val)}
        onAlignChange={(val) => onChange("align-items", val)}
        isColumn={styles["flex-direction"]?.includes("column")}
      />
    </div>

    {/* Justify/Align Labels */}
    <div className="tw:flex-1">
      <div className="tw:mb-2">
        <div className={CAPTION}>
          {mixedKeys?.has("justify-content") && <MixedValueBadge compact />}
          Justify Content
        </div>
        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
          {["start", "center", "end", "between", "around", "evenly"].map((val) => {
            const actualVal =
              val === "start"
                ? "flex-start"
                : val === "end"
                  ? "flex-end"
                  : val === "between"
                    ? "space-between"
                    : val === "around"
                      ? "space-around"
                      : val === "evenly"
                        ? "space-evenly"
                        : val;
            return (
              <Button
                key={val}
                size="xs"
                className={compactBtnClass(styles["justify-content"] === actualVal)}
                onClick={() => onChange("justify-content", actualVal)}
              >
                {val.slice(0, 3)}
              </Button>
            );
          })}
        </div>
      </div>
      <div>
        <div className={CAPTION}>
          {mixedKeys?.has("align-items") && <MixedValueBadge compact />}
          Align Items
        </div>
        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
          {["start", "center", "end", "stretch", "baseline"].map((val) => {
            const actualVal = val === "start" ? "flex-start" : val === "end" ? "flex-end" : val;
            return (
              <Button
                key={val}
                size="xs"
                className={compactBtnClass(styles["align-items"] === actualVal)}
                onClick={() => onChange("align-items", actualVal)}
              >
                {val.slice(0, 3)}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);

export default AlignmentSection;

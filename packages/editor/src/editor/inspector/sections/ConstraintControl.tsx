/**
 * Constraint Control — Fixed / Fill / Hug, the value every profile board shows
 * against Width and Height ("Fill", "Hug").
 *
 * It used to sit inside the Layout section, which meant Layout and Size both
 * owned width/height and the inspector had to ask the profile which one to
 * silence — that switch left a TEXT element's Size section rendering nothing
 * but a "More settings" link. Size owns the dimension now, everywhere.
 *
 * `fixedInput` lets the owner supply its own numeric field (Size passes the
 * unit input with its design-token chain) instead of the plain text box.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { CONTROL_INPUT_WRAP } from "../shared/controls/controlClasses";
import { CLUSTER_CAPTION, constraintBtnClass } from "./layout/classes";
import { Button, TextInput } from "@/editor/chrome-ui";
// ============================================================================
// TYPES
// ============================================================================

type ConstraintType = "fixed" | "fill" | "hug";

export interface ConstraintControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Numeric field shown in Fixed mode. Defaults to a plain text box. */
  fixedInput?: React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ConstraintControl: React.FC<ConstraintControlProps> = ({
  label,
  value,
  onChange,
  fixedInput,
}) => {
  // Determine current constraint type based on CSS value
  const getConstraintType = (): ConstraintType => {
    if (value === "100%" || value === "-webkit-fill-available") return "fill";
    if (value === "auto" || value === "fit-content" || value === "max-content") return "hug";
    return "fixed";
  };

  const currentType = getConstraintType();
  const isWidth = label.toLowerCase() === "width";

  const handleConstraintChange = (type: ConstraintType) => {
    switch (type) {
      case "fixed":
        // Set to a reasonable default or keep current numeric value
        onChange(value && value !== "auto" && value !== "100%" ? value : "200px");
        break;
      case "fill":
        onChange("100%");
        break;
      case "hug":
        onChange("fit-content");
        break;
    }
  };

  return (
    <div className="tw:mb-2.5">
      <div className={CLUSTER_CAPTION}>{label}</div>
      <div className="tw:flex tw:gap-1">
        {/* Fixed */}
        <Button
          size="xs"
          className={constraintBtnClass(currentType === "fixed")}
          onClick={() => handleConstraintChange("fixed")}
          title="Fixed size - element has a specific pixel or unit value"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="3" width="10" height="10" rx="1" />
            <line x1="1" y1="8" x2="3" y2="8" />
            <line x1="13" y1="8" x2="15" y2="8" />
          </svg>
          <span>Fixed</span>
        </Button>

        {/* Fill */}
        <Button
          size="xs"
          className={constraintBtnClass(currentType === "fill")}
          onClick={() => handleConstraintChange("fill")}
          title="Fill - element expands to fill available space (100%)"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="2" y="4" width="12" height="8" rx="1" />
            <line x1="4" y1="8" x2="1" y2="8" strokeLinecap="round" />
            <line x1="12" y1="8" x2="15" y2="8" strokeLinecap="round" />
            <path d="M3 8L5 6.5V9.5L3 8Z" fill="currentColor" />
            <path d="M13 8L11 6.5V9.5L13 8Z" fill="currentColor" />
          </svg>
          <span>Fill</span>
        </Button>

        {/* Hug */}
        <Button
          size="xs"
          className={constraintBtnClass(currentType === "hug")}
          onClick={() => handleConstraintChange("hug")}
          title="Hug content - element shrinks to fit its content (fit-content)"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="5" y="4" width="6" height="8" rx="1" />
            <path d="M3 8L1 6.5V9.5L3 8Z" fill="currentColor" />
            <path d="M13 8L15 6.5V9.5L13 8Z" fill="currentColor" />
            <line x1="3" y1="8" x2="5" y2="8" strokeLinecap="round" />
            <line x1="11" y1="8" x2="13" y2="8" strokeLinecap="round" />
          </svg>
          <span>Hug</span>
        </Button>
      </div>
      {/* Fixed value input - only show when in fixed mode */}
      {currentType === "fixed" && (
        <div className="tw:flex tw:items-center tw:gap-1 tw:mt-1.5">
          {fixedInput ?? (
            <>
              <span className="tw:w-8 tw:text-xs tw:text-[var(--bk-ink-muted)]">{isWidth ? "W" : "H"}</span>
              <TextInput
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={isWidth ? "200px" : "auto"}
                className={CONTROL_INPUT_WRAP}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ConstraintControl;

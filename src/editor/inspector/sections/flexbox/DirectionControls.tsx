/**
 * DirectionControls - Flex direction selection with visual icons
 * @license BSD-3-Clause
 */

import * as React from "react";
import { INSPECTOR_TOKENS } from "../../shared/controls/controlStyles";
import { DirectionIcon } from "./icons";
import { visualBtn } from "./styles";

// ============================================================================
// TYPES
// ============================================================================

export interface DirectionControlsProps {
  currentDirection?: string;
  onChange: (prop: string, val: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const DirectionControls: React.FC<DirectionControlsProps> = ({
  currentDirection,
  onChange,
}) => (
  <>
    <div
      style={{
        fontSize: 12,
        color: INSPECTOR_TOKENS.textTertiary,
        marginBottom: 6,
      }}
    >
      Flex Direction
    </div>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 4,
        marginBottom: 12,
      }}
    >
      {["row", "column", "row-reverse", "column-reverse"].map((val) => (
        <button
          key={val}
          style={visualBtn(currentDirection === val)}
          onClick={() => onChange("flex-direction", val)}
          title={val}
        >
          <DirectionIcon direction={val} />
          <span>
            {val === "row-reverse"
              ? "Row-R"
              : val === "column-reverse"
                ? "Col-R"
                : val.charAt(0).toUpperCase() + val.slice(1)}
          </span>
        </button>
      ))}
    </div>
  </>
);

export default DirectionControls;

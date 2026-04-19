/**
 * DirectionControls - Flex direction selection with visual icons
 * @license BSD-3-Clause
 */

import * as React from "react";
import { MixedValueBadge } from "../../shared/MixedValueBadge";
import { DirectionIcon } from "./icons";

const visualBtn = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: "10px 6px",
  background: active ? "rgba(45, 109, 255, 0.20)" : "var(--buildrick-bg-subtle)",
  border: active
    ? `1px solid ${"rgba(45, 109, 255, 0.30)"}`
    : `1px solid ${"var(--buildrick-border)"}`,
  borderRadius: 6,
  color: active ? "var(--buildrick-accent)" : "var(--buildrick-text-muted)",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.15s",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  gap: 4,
});

// ============================================================================
// TYPES
// ============================================================================

export interface DirectionControlsProps {
  currentDirection?: string;
  onChange: (prop: string, val: string) => void;
  mixedKeys?: ReadonlySet<string>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const DirectionControls: React.FC<DirectionControlsProps> = ({
  currentDirection,
  onChange,
  mixedKeys,
}) => (
  <>
    <div
      style={{
        fontSize: 12,
        color: "var(--buildrick-text-tertiary)",
        marginBottom: 6,
        display: "flex",
        alignItems: "center",
      }}
    >
      {mixedKeys?.has("flex-direction") && <MixedValueBadge compact />}
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

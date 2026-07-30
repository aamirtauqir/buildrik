/**
 * DirectionControls - Flex direction selection with visual icons
 * @license BSD-3-Clause
 */

import * as React from "react";
import { MixedValueBadge } from "../../shared/MixedValueBadge";
import { DirectionIcon } from "./icons";
import { Button } from "flowbite-react";

const visualBtn = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: "10px 6px",
  background: active ? "var(--bk-accent-tint)" : "var(--bk-bg-subtle)",
  border: active
    ? "1px solid var(--bk-alpha-accent-30)"
    : `1px solid ${"var(--bk-border)"}`,
  borderRadius: 6,
  color: active ? "var(--bk-accent)" : "var(--bk-ink-muted)",
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
        color: "var(--bk-ink-muted)",
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
        <Button
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
        </Button>
      ))}
    </div>
  </>
);

export default DirectionControls;

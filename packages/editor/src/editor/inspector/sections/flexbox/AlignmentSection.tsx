import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * AlignmentSection - Alignment grid and justify/align controls
 * @license BSD-3-Clause
 */

import * as React from "react";
import { MixedValueBadge } from "../../shared/MixedValueBadge";
import { FlexAlignmentGrid } from "./controls";

// ============================================================================
// TYPES
// ============================================================================

export interface AlignmentSectionProps {
  styles: Record<string, string>;
  onChange: (prop: string, val: string) => void;
  compactBtn: (active: boolean) => React.CSSProperties;
  mixedKeys?: ReadonlySet<string>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const AlignmentSection: React.FC<AlignmentSectionProps> = ({
  styles,
  onChange,
  compactBtn,
  mixedKeys,
}) => (
  <div
    style={{
      display: "flex",
      gap: 12,
      marginBottom: 12,
      alignItems: "flex-start",
    }}
  >
    {/* 9-Dot Grid */}
    <div>
      <div
        style={{
          fontSize: 12,
          color: "var(--buildrick-text-tertiary)",
          marginBottom: 6,
        }}
      >
        Alignment
      </div>
      <FlexAlignmentGrid
        justifyContent={styles["justify-content"] || "flex-start"}
        alignItems={styles["align-items"] || "flex-start"}
        onJustifyChange={(val) => onChange("justify-content", val)}
        onAlignChange={(val) => onChange("align-items", val)}
        isColumn={styles["flex-direction"]?.includes("column")}
      />
    </div>

    {/* Justify/Align Labels */}
    <div style={{ flex: 1 }}>
      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            fontSize: 12,
            color: "var(--buildrick-text-muted)",
            marginBottom: 4,
            display: "flex",
            alignItems: "center",
          }}
        >
          {mixedKeys?.has("justify-content") && <MixedValueBadge compact />}
          Justify Content
        </div>
        <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
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
                style={compactBtn(styles["justify-content"] === actualVal)}
                onClick={() => onChange("justify-content", actualVal)}
              >
                {val.slice(0, 3)}
              </Button>
            );
          })}
        </div>
      </div>
      <div>
        <div
          style={{
            fontSize: 12,
            color: "var(--buildrick-text-muted)",
            marginBottom: 4,
            display: "flex",
            alignItems: "center",
          }}
        >
          {mixedKeys?.has("align-items") && <MixedValueBadge compact />}
          Align Items
        </div>
        <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {["start", "center", "end", "stretch", "baseline"].map((val) => {
            const actualVal = val === "start" ? "flex-start" : val === "end" ? "flex-end" : val;
            return (
              <Button
                key={val}
                style={compactBtn(styles["align-items"] === actualVal)}
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

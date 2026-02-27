/**
 * Flexbox Section - Enhanced visual controls with icons and grid picker
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Section, sharedStyles } from "../../shared/Controls";
import { AlignmentSection } from "./AlignmentSection";
import { DirectionControls } from "./DirectionControls";
import { EnableFlexPrompt } from "./EnableFlexPrompt";
import { FlexItemControls } from "./FlexItemControls";
import { GapControls } from "./GapControls";

// ============================================================================
// TYPES
// ============================================================================

export interface FlexboxSectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  propertyStates?: Record<string, { hidden?: boolean; disabled?: boolean; reason?: string }>;
}

// Use shared styles
const { compactBtn, row: rowStyle, label: labelStyle, input: inputStyle } = sharedStyles;

// ============================================================================
// COMPONENT
// ============================================================================

export const FlexboxSection: React.FC<FlexboxSectionProps> = ({
  styles,
  onChange,
  propertyStates = {},
}) => {
  const isFlexContainer = styles.display === "flex" || styles.display === "inline-flex";

  const disabled = (prop: string) => propertyStates[prop]?.disabled;
  const reason = (prop: string) => propertyStates[prop]?.reason;

  return (
    <Section title="Flexbox" icon="AlignHorizontalSpaceBetween">
      {/* Enable Flex */}
      {!isFlexContainer && <EnableFlexPrompt onChange={onChange} />}

      {isFlexContainer && (
        <>
          {/* Direction Toggle */}
          <DirectionControls currentDirection={styles["flex-direction"]} onChange={onChange} />

          {/* Alignment Grid + Justify/Align */}
          <AlignmentSection styles={styles} onChange={onChange} compactBtn={compactBtn} />

          {/* Wrap Toggle */}
          <div style={rowStyle}>
            <label style={labelStyle}>Wrap</label>
            <div style={{ display: "flex", gap: 2, flex: 1 }}>
              {["nowrap", "wrap", "wrap-reverse"].map((val) => (
                <button
                  key={val}
                  style={compactBtn(styles["flex-wrap"] === val)}
                  onClick={() => onChange("flex-wrap", val)}
                >
                  {val === "wrap-reverse" ? "rev" : val}
                </button>
              ))}
            </div>
          </div>

          {/* Gap Controls */}
          <GapControls
            styles={styles}
            onChange={onChange}
            disabled={disabled}
            inputStyle={inputStyle}
            rowStyle={rowStyle}
            labelStyle={labelStyle}
          />

          {/* Align Content */}
          <div style={rowStyle}>
            <label style={labelStyle}>A-Cont</label>
            <div style={{ display: "flex", gap: 2, flex: 1 }}>
              {["start", "center", "end", "stretch", "between", "around"].map((val) => {
                const actualVal =
                  val === "start"
                    ? "flex-start"
                    : val === "end"
                      ? "flex-end"
                      : val === "between"
                        ? "space-between"
                        : val === "around"
                          ? "space-around"
                          : val;
                return (
                  <button
                    key={val}
                    style={compactBtn(styles["align-content"] === actualVal)}
                    onClick={() => onChange("align-content", actualVal)}
                  >
                    {val.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Flex Item Properties */}
      <FlexItemControls
        styles={styles}
        onChange={onChange}
        disabled={disabled}
        reason={reason}
        inputStyle={inputStyle}
        rowStyle={rowStyle}
        labelStyle={labelStyle}
        compactBtn={compactBtn}
      />
    </Section>
  );
};

// Re-export sub-components for direct access if needed
export { EnableFlexPrompt } from "./EnableFlexPrompt";
export { DirectionControls } from "./DirectionControls";
export { AlignmentSection } from "./AlignmentSection";
export { GapControls } from "./GapControls";
export { FlexItemControls } from "./FlexItemControls";

export default FlexboxSection;

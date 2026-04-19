/**
 * Flexbox Section - Enhanced visual controls with icons and grid picker
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Section, baseStyles, type SectionTier } from "../../shared/controls";
import { MixedValueBadge } from "../../shared/MixedValueBadge";
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
  /** Batch handler for atomic updates (used by LinkedGapInput toggle). */
  onBatchChange?: (changes: Record<string, string>) => void;
  propertyStates?: Record<string, { hidden?: boolean; disabled?: boolean; reason?: string }>;
  /** True when this element's parent is a flex container — required to render flex-item controls. */
  isFlexItem?: boolean;
  /** Controlled open state — driven by collapse/expand all */
  isOpen?: boolean;
  /** Called when section header is toggled */
  onToggle?: (open: boolean) => void;
  /** Visual weight tier — threaded from the registry-driven renderer. */
  tier?: SectionTier;
  mixedKeys?: ReadonlySet<string>;
  isMultiSelect?: boolean;
}

// Use shared styles
const { compactBtn, row: rowStyle, label: labelStyle, input: inputStyle } = baseStyles;

// ============================================================================
// COMPONENT
// ============================================================================

export const FlexboxSection: React.FC<FlexboxSectionProps> = ({
  styles,
  onChange,
  onBatchChange,
  propertyStates = {},
  isFlexItem = false,
  isOpen,
  onToggle,
  tier = "secondary",
  mixedKeys,
}) => {
  const isFlexContainer = styles.display === "flex" || styles.display === "inline-flex";

  const disabled = (prop: string) => propertyStates[prop]?.disabled;
  const reason = (prop: string) => propertyStates[prop]?.reason;

  // Collapsed preview: for containers show "row · center", for children show
  // "self: center" or grow value. Helps users tell configured vs default state.
  const buildFlexPreview = (): string | null => {
    if (isFlexContainer) {
      const direction = styles["flex-direction"] === "column" ? "col" : "row";
      const justify = (styles["justify-content"] || "").replace("flex-", "") || "";
      if (justify) return `${direction} · ${justify}`;
      return direction;
    }
    if (isFlexItem) {
      const grow = styles["flex-grow"];
      const self = (styles["align-self"] || "").replace("flex-", "");
      if (grow && grow !== "0") return `grow ${grow}`;
      if (self && self !== "auto") return `self: ${self}`;
    }
    return null;
  };
  const flexPreviewText = buildFlexPreview();
  const flexPreview = flexPreviewText ? (
    <span
      style={{
        fontSize: 11,
        color: "var(--buildrick-text-tertiary)",
        fontFamily: "var(--buildrick-font-family-mono)",
        whiteSpace: "nowrap",
      }}
    >
      {flexPreviewText}
    </span>
  ) : undefined;

  return (
    <Section
      title="Flexbox"
      icon="AlignHorizontalSpaceBetween"
      id="inspector-section-flexbox"
      isOpen={isOpen}
      onToggle={onToggle}
      preview={flexPreview}
      tier={tier}
    >
      {/* Enable Flex */}
      {!isFlexContainer && <EnableFlexPrompt onChange={onChange} />}

      {isFlexContainer && (
        <>
          {/* Direction Toggle */}
          <DirectionControls currentDirection={styles["flex-direction"]} onChange={onChange} mixedKeys={mixedKeys} />

          {/* Alignment Grid + Justify/Align */}
          <AlignmentSection styles={styles} onChange={onChange} compactBtn={compactBtn} mixedKeys={mixedKeys} />

          {/* Wrap Toggle */}
          <div style={rowStyle}>
            {mixedKeys?.has("flex-wrap") && <MixedValueBadge compact />}
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
            onBatchChange={onBatchChange}
            disabled={disabled}
            mixedKeys={mixedKeys}
          />

          {/* Align Content */}
          <div style={rowStyle}>
            {mixedKeys?.has("align-content") && <MixedValueBadge compact />}
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

      {/* Flex Item Properties — only meaningful when this element's parent is a flex container */}
      {isFlexItem && (
        <FlexItemControls
          styles={styles}
          onChange={onChange}
          disabled={disabled}
          reason={reason}
          inputStyle={inputStyle}
          rowStyle={rowStyle}
          labelStyle={labelStyle}
          compactBtn={compactBtn}
          mixedKeys={mixedKeys}
        />
      )}
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

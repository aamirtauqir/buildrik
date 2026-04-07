/**
 * Spacing Section - Margin & Padding with visual box model
 */

import * as React from "react";
import { Section, FourSideInput, InputWithUnit, MoreSettingsToggle } from "../shared/controls";

interface SpacingSectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  onBatchChange: (changes: Record<string, string>) => void;
  propertyStates?: Record<string, { hidden?: boolean; disabled?: boolean; reason?: string }>;
  /** Whether advanced settings (row-gap, column-gap) are expanded */
  advancedExpanded?: boolean;
  /** Called when the More settings toggle is clicked */
  onAdvancedToggle?: () => void;
}

export const SpacingSection: React.FC<SpacingSectionProps> = ({
  styles,
  onChange,
  onBatchChange,
  propertyStates = {},
  advancedExpanded = false,
  onAdvancedToggle,
}) => {
  const [marginLinked, setMarginLinked] = React.useState(false);
  const [paddingLinked, setPaddingLinked] = React.useState(false);

  // Parse shorthand to individual values
  const parseShorthand = (
    value: string
  ): { top: string; right: string; bottom: string; left: string } => {
    if (!value) return { top: "", right: "", bottom: "", left: "" };
    const parts = value.split(" ").filter(Boolean);
    if (parts.length === 1) {
      return {
        top: parts[0],
        right: parts[0],
        bottom: parts[0],
        left: parts[0],
      };
    } else if (parts.length === 2) {
      return {
        top: parts[0],
        right: parts[1],
        bottom: parts[0],
        left: parts[1],
      };
    } else if (parts.length === 3) {
      return {
        top: parts[0],
        right: parts[1],
        bottom: parts[2],
        left: parts[1],
      };
    } else if (parts.length === 4) {
      return {
        top: parts[0],
        right: parts[1],
        bottom: parts[2],
        left: parts[3],
      };
    }
    return { top: "", right: "", bottom: "", left: "" };
  };

  // Get margin values
  const marginValues = {
    top: styles["margin-top"] || parseShorthand(styles.margin || "").top,
    right: styles["margin-right"] || parseShorthand(styles.margin || "").right,
    bottom: styles["margin-bottom"] || parseShorthand(styles.margin || "").bottom,
    left: styles["margin-left"] || parseShorthand(styles.margin || "").left,
  };

  // Get padding values
  const paddingValues = {
    top: styles["padding-top"] || parseShorthand(styles.padding || "").top,
    right: styles["padding-right"] || parseShorthand(styles.padding || "").right,
    bottom: styles["padding-bottom"] || parseShorthand(styles.padding || "").bottom,
    left: styles["padding-left"] || parseShorthand(styles.padding || "").left,
  };

  // Handle margin change
  const handleMarginChange = (side: "top" | "right" | "bottom" | "left", value: string) => {
    if (marginLinked) {
      // Apply to all sides
      onBatchChange({
        "margin-top": value,
        "margin-right": value,
        "margin-bottom": value,
        "margin-left": value,
      });
    } else {
      onChange(`margin-${side}`, value);
    }
  };

  // Handle padding change
  const handlePaddingChange = (side: "top" | "right" | "bottom" | "left", value: string) => {
    if (paddingLinked) {
      // Apply to all sides
      onBatchChange({
        "padding-top": value,
        "padding-right": value,
        "padding-bottom": value,
        "padding-left": value,
      });
    } else {
      onChange(`padding-${side}`, value);
    }
  };

  const disabledMargin = (side: string) => propertyStates[`margin-${side}`];
  const disabledPadding = (side: string) => propertyStates[`padding-${side}`];

  return (
    <Section title="Spacing" icon="MoveHorizontal" defaultOpen id="inspector-section-spacing">
      {/* Margin Controls */}
      <FourSideInput
        label="Margin"
        values={marginValues}
        onChange={handleMarginChange}
        linked={marginLinked}
        onLinkToggle={() => setMarginLinked(!marginLinked)}
        disabledSides={{
          top: disabledMargin("top")?.disabled,
          right: disabledMargin("right")?.disabled,
          bottom: disabledMargin("bottom")?.disabled,
          left: disabledMargin("left")?.disabled,
        }}
        disabledReason={disabledMargin("top")?.reason || disabledMargin("bottom")?.reason}
      />

      {/* Padding Controls */}
      <FourSideInput
        label="Padding"
        values={paddingValues}
        onChange={handlePaddingChange}
        linked={paddingLinked}
        onLinkToggle={() => setPaddingLinked(!paddingLinked)}
        disabledSides={{
          top: disabledPadding("top")?.disabled,
          right: disabledPadding("right")?.disabled,
          bottom: disabledPadding("bottom")?.disabled,
          left: disabledPadding("left")?.disabled,
        }}
        disabledReason={disabledPadding("top")?.reason || disabledPadding("bottom")?.reason}
      />

      {/* ─── Advanced: row-gap, column-gap (behind More settings) ─── */}
      {advancedExpanded && (
        <>
          <InputWithUnit
            label="Row Gap"
            value={styles["row-gap"] || ""}
            onChange={(v) => onChange("row-gap", v)}
          />
          <InputWithUnit
            label="Col Gap"
            value={styles["column-gap"] || ""}
            onChange={(v) => onChange("column-gap", v)}
          />
        </>
      )}

      {/* Progressive disclosure toggle */}
      {onAdvancedToggle && (
        <MoreSettingsToggle
          isOpen={advancedExpanded}
          onToggle={() => onAdvancedToggle()}
          advancedCount={2}
        />
      )}
    </Section>
  );
};

export default SpacingSection;

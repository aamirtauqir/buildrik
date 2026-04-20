/**
 * Spacing Section - Margin & Padding with visual box model
 */

import * as React from "react";
import { Section, FourSideInput, InputWithUnit, MoreSettingsToggle, type SectionTier, MixedValueIndicator } from "../shared/controls";
import { MixedValueBadge } from "../shared/MixedValueBadge";
import { parseCssShorthand } from "../shared/utils/parseCssShorthand";

export interface SpacingSectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  onBatchChange: (changes: Record<string, string>) => void;
  propertyStates?: Record<string, { hidden?: boolean; disabled?: boolean; reason?: string }>;
  /** Controlled open state for auto-expand functionality */
  isOpen?: boolean;
  /** Called when the section header is toggled */
  onToggle?: (open: boolean) => void;
  /** Visual weight tier — threaded from the registry-driven renderer. */
  tier?: SectionTier;
  /** Whether advanced settings (row-gap, column-gap) are expanded */
  advancedExpanded?: boolean;
  /** Called when the More settings toggle is clicked */
  onAdvancedToggle?: () => void;
  mixedKeys?: ReadonlySet<string>;
  isMultiSelect?: boolean;
}

export const SpacingSection: React.FC<SpacingSectionProps> = ({
  styles,
  onChange,
  onBatchChange,
  propertyStates = {},
  isOpen,
  onToggle,
  tier = "secondary",
  advancedExpanded = false,
  onAdvancedToggle,
  mixedKeys,
}) => {
  const [marginLinked, setMarginLinked] = React.useState(false);
  const [paddingLinked, setPaddingLinked] = React.useState(false);

  // Get margin values
  const marginValues = {
    top: styles["margin-top"] || parseCssShorthand(styles.margin || "").top,
    right: styles["margin-right"] || parseCssShorthand(styles.margin || "").right,
    bottom: styles["margin-bottom"] || parseCssShorthand(styles.margin || "").bottom,
    left: styles["margin-left"] || parseCssShorthand(styles.margin || "").left,
  };

  // Get padding values
  const paddingValues = {
    top: styles["padding-top"] || parseCssShorthand(styles.padding || "").top,
    right: styles["padding-right"] || parseCssShorthand(styles.padding || "").right,
    bottom: styles["padding-bottom"] || parseCssShorthand(styles.padding || "").bottom,
    left: styles["padding-left"] || parseCssShorthand(styles.padding || "").left,
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

  const marginMixed = mixedKeys
    ? (mixedKeys.has("margin") || mixedKeys.has("margin-top") || mixedKeys.has("margin-right") || mixedKeys.has("margin-bottom") || mixedKeys.has("margin-left"))
    : false;
  const paddingMixed = mixedKeys
    ? (mixedKeys.has("padding") || mixedKeys.has("padding-top") || mixedKeys.has("padding-right") || mixedKeys.has("padding-bottom") || mixedKeys.has("padding-left"))
    : false;

  // Collapsed preview: "m:16 p:8" summary. Collapses the four sides into the
  // single shorthand if all sides match; otherwise shows "mixed".
  const collapseSides = (t: string, r: string, b: string, l: string): string | null => {
    if (!t && !r && !b && !l) return null;
    if (t === r && r === b && b === l && t) return t;
    return "·";
  };
  const marginSummary = collapseSides(
    marginValues.top,
    marginValues.right,
    marginValues.bottom,
    marginValues.left
  );
  const paddingSummary = collapseSides(
    paddingValues.top,
    paddingValues.right,
    paddingValues.bottom,
    paddingValues.left
  );
  const spacingPreview =
    marginSummary || paddingSummary ? (
      <span
        style={{
          fontSize: 11,
          color: "var(--buildrick-text-tertiary)",
          fontFamily: "var(--buildrick-font-family-mono)",
          whiteSpace: "nowrap",
        }}
      >
        {marginSummary ? `m:${marginSummary}` : ""}
        {marginSummary && paddingSummary ? " " : ""}
        {paddingSummary ? `p:${paddingSummary}` : ""}
      </span>
    ) : undefined;

  return (
    <Section
      title="Spacing"
      icon="MoveHorizontal"
      defaultOpen
      isOpen={isOpen}
      onToggle={onToggle}
      preview={spacingPreview}
      tier={tier}
      id="inspector-section-spacing"
    >
      {/* Margin Controls */}
      <div style={{ position: "relative" }}>
        {marginMixed && (
          <span style={{ position: "absolute", right: 0, top: 0, zIndex: 1 }}>
            <MixedValueBadge compact />
          </span>
        )}
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
      </div>

      {/* Padding Controls */}
      <div style={{ position: "relative" }}>
        {paddingMixed && (
          <span style={{ position: "absolute", right: 0, top: 0, zIndex: 1 }}>
            <MixedValueBadge compact />
          </span>
        )}
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
      </div>

      {/* ─── Advanced: row-gap, column-gap (behind More settings) ─── */}
      {advancedExpanded && (
        <>
          <div style={{ position: "relative" }}>
            <MixedValueIndicator prop="gap" mixedKeys={mixedKeys} />
            <InputWithUnit
              label="Row Gap"
              value={styles["row-gap"] || ""}
              onChange={(v) => onChange("row-gap", v)}
            />
          </div>
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
/**
 * Spacing Section — board 32:2's Padding / Gap / Margin rows, with the
 * four-side box model behind More settings
 */

import * as React from "react";
import { Link, Link2Off } from "lucide-react";
import { Section, SpacingBox, InputWithUnit, MoreSettingsToggle, type SectionTier, MixedValueIndicator } from "../shared/controls";
import { MixedValueBadge } from "../shared/MixedValueBadge";
import { parseCssShorthand } from "../shared/utils/parseCssShorthand";
import { Button } from "@/editor/chrome-ui";

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
  const bothLinked = marginLinked && paddingLinked;
  const anyLinked = marginLinked || paddingLinked;
  const spacingPreview =
    anyLinked || marginSummary || paddingSummary ? (
      <span className={`bdi-ind${marginMixed || paddingMixed ? " mixed" : ""}`}>
        {bothLinked ? "link" : anyLinked ? (marginLinked ? "m·link" : "p·link") : `${marginSummary ? `m ${marginSummary}` : ""}${paddingSummary ? ` p ${paddingSummary}` : ""}`.trim()}
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
      {/* Board 32:2 / 807:8342 — Padding as one row of two numbers (vertical,
          horizontal), Gap under it, Margin as the shorthand it usually is
          ("0 auto"). The four-side box that used to lead this section is a
          good editor and a 150px one; it holds the per-side case, which is
          the rarer one, and moved behind More settings with it. */}
      <div className="bdi-row-ctrl" role="group" aria-label="Padding">
        <label className="bdi-lb">Padding</label>
        <div className="bdi-pair">
          <div className="tw:relative">
            <MixedValueIndicator prop="padding" mixedKeys={mixedKeys} />
            <InputWithUnit
              label=""
              ariaLabel="Padding top and bottom"
              value={paddingValues.top || ""}
              onChange={(v) => onBatchChange({ "padding-top": v, "padding-bottom": v })}
              placeholder="0"
            />
          </div>
          <span className="bdi-pair-sep" aria-hidden="true" />
          <InputWithUnit
            label=""
            ariaLabel="Padding left and right"
            value={paddingValues.left || ""}
            onChange={(v) => onBatchChange({ "padding-left": v, "padding-right": v })}
            placeholder="0"
          />
        </div>
      </div>

      <InputWithUnit
        label="Gap"
        value={styles.gap || ""}
        onChange={(v) => onChange("gap", v)}
        placeholder="0"
      />

      <div className="bdi-row-ctrl" role="group" aria-label="Margin">
        <label className="bdi-lb">Margin</label>
        <div className="bdi-pair">
          <div className="tw:relative">
            <MixedValueIndicator prop="margin" mixedKeys={mixedKeys} />
            <InputWithUnit
              label=""
              ariaLabel="Margin top and bottom"
              value={marginValues.top || ""}
              onChange={(v) => onBatchChange({ "margin-top": v, "margin-bottom": v })}
              placeholder="0"
            />
          </div>
          <span className="bdi-pair-sep" aria-hidden="true" />
          <InputWithUnit
            label=""
            ariaLabel="Margin left and right"
            value={marginValues.left || ""}
            onChange={(v) => onBatchChange({ "margin-left": v, "margin-right": v })}
            units={["px", "%", "rem", "auto"]}
            placeholder="0"
          />
        </div>
      </div>

      {/* ─── Advanced: per-side box, row-gap, column-gap ─── */}
      {advancedExpanded && (
        <>
          {/* Link-all-sides toggles. When linked, editing one side applies to
              all four (margin or padding). */}
          <div style={{ display: "flex", gap: 4, margin: "6px 0" }}>
            <Button
              color="light"
              size="xs"
              onClick={() => setMarginLinked((v) => !v)}
              aria-pressed={marginLinked}
              title={marginLinked ? "Unlink margin sides" : "Link margin sides"}
              className={marginLinked ? undefined : "tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"}
            >
              {marginLinked ? <Link size={12} /> : <Link2Off size={12} />}
              <span style={{ marginLeft: 4 }}>Margin</span>
            </Button>
            <Button
              color="light"
              size="xs"
              onClick={() => setPaddingLinked((v) => !v)}
              aria-pressed={paddingLinked}
              title={paddingLinked ? "Unlink padding sides" : "Link padding sides"}
              className={paddingLinked ? undefined : "tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"}
            >
              {paddingLinked ? <Link size={12} /> : <Link2Off size={12} />}
              <span style={{ marginLeft: 4 }}>Padding</span>
            </Button>
          </div>

          <div style={{ position: "relative" }}>
            {(marginMixed || paddingMixed) && (
              <span style={{ position: "absolute", right: 0, top: 0, zIndex: 1 }}>
                <MixedValueBadge compact />
              </span>
            )}
            <SpacingBox
              margin={marginValues}
              padding={paddingValues}
              onMarginChange={handleMarginChange}
              onPaddingChange={handlePaddingChange}
              disabledMargin={{
                top: disabledMargin("top")?.disabled,
                right: disabledMargin("right")?.disabled,
                bottom: disabledMargin("bottom")?.disabled,
                left: disabledMargin("left")?.disabled,
              }}
              disabledPadding={{
                top: disabledPadding("top")?.disabled,
                right: disabledPadding("right")?.disabled,
                bottom: disabledPadding("bottom")?.disabled,
                left: disabledPadding("left")?.disabled,
              }}
            />
          </div>

          <div style={{ position: "relative" }}>
            <MixedValueIndicator prop="gap" mixedKeys={mixedKeys} />
            <InputWithUnit
              label="Row gap"
              value={styles["row-gap"] || ""}
              onChange={(v) => onChange("row-gap", v)}
            />
          </div>
          <InputWithUnit
            label="Column gap"
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
          advancedCount={4}
        />
      )}
    </Section>
  );
};

export default SpacingSection;
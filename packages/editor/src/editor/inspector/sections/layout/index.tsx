/**
 * Layout Section - User-friendly with visual previews
 * Implements essentials/advanced pattern with MoreSettingsToggle
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Section, MoreSettingsToggle, type SectionTier } from "../../shared/controls";
import { SECTION_PREVIEW, SECTION_SUBTITLE } from "../../shared/controls/controlClasses";
import { DisplayControls } from "./DisplayControls";
import { OverflowControls, VisibilityFloatControls } from "./OverflowVisibilityControls";
import { PositionControls } from "./PositionControls";
import { BK_SELECT_BARE_VALUE_THEME, Select } from "@/editor/chrome-ui";
import { constraintTypeOf, valueForConstraint, type ConstraintType } from "../ConstraintControl";

/* Board 4428:141170's "Size  Fill · Hug" row: width and height sizing modes.
   An unset width reads Fill and an unset height Hug — what a block does. The
   exact numbers (and min/max) stay in the Size section. */
const SIZE_FIELD = "tw:flex-1 tw:min-w-0 tw:rounded-md tw:border tw:border-[var(--bk-border-input)] tw:bg-[var(--bk-bg-card)]";

function SizeModeSelect({ axis, value, onChange }: { axis: "width" | "height"; value: string; onChange: (property: string, value: string) => void }) {
  const mode: ConstraintType = value ? constraintTypeOf(value) : axis === "width" ? "fill" : "hug";
  return (
    <div className={SIZE_FIELD}>
      <Select
        aria-label={axis === "width" ? "Width sizing" : "Height sizing"}
        theme={BK_SELECT_BARE_VALUE_THEME}
        value={mode}
        onChange={(e) => onChange(axis, valueForConstraint(e.target.value as ConstraintType, value))}
      >
        <option value="fill">Fill</option>
        <option value="hug">Hug</option>
        <option value="fixed">{mode === "fixed" && value ? value : "Fixed"}</option>
      </Select>
    </div>
  );
}

// ============================================================================
// TYPES
// ============================================================================

export interface LayoutSectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  propertyStates?: Record<string, { hidden?: boolean; disabled?: boolean; reason?: string }>;
  /** Controlled open state for auto-expand functionality */
  isOpen?: boolean;
  /** Called when the section header is toggled (so parent can sync collapse state) */
  onToggle?: (open: boolean) => void;
  /** Visual weight tier — threaded from the registry-driven renderer. Defaults
   *  to "primary" so standalone usages still match Phase 2 styling. */
  tier?: SectionTier;
  /** Whether advanced settings (overflow/visibility) are expanded */
  advancedExpanded?: boolean;
  /** Called when the More settings toggle is clicked */
  onAdvancedToggle?: () => void;
  mixedKeys?: ReadonlySet<string>;
  isMultiSelect?: boolean;
}


// ============================================================================
// COMPONENT
// ============================================================================

export const LayoutSection: React.FC<LayoutSectionProps> = ({
  styles,
  onChange,
  propertyStates = {},
  isOpen,
  onToggle,
  tier = "primary",
  advancedExpanded = false,
  onAdvancedToggle,
  mixedKeys,
}) => {
  const [showOverflow, setShowOverflow] = React.useState(false);
  // Collapsed preview: show the display type so users can see "flex" vs "grid"
  // vs "block" at a glance without expanding. Position is also load-bearing —
  // if it's anything other than static, tag it too.
  const display = styles.display || "";
  const position = styles.position || "";
  const layoutPreviewParts: string[] = [];
  if (display) layoutPreviewParts.push(display);
  if (position && position !== "static") layoutPreviewParts.push(position);
  const layoutPreview =
    layoutPreviewParts.length > 0 ? (
      <span className={SECTION_PREVIEW}>
        {layoutPreviewParts.join(" · ")}
      </span>
    ) : undefined;

  return (
    <Section
      title="Layout"
      icon="LayoutGrid"
      defaultOpen
      isOpen={isOpen}
      onToggle={onToggle}
      preview={layoutPreview}
      tier={tier}
      id="inspector-section-layout"
    >
      {/* ═══════════════════════════════════════════════════════════════════
          ESSENTIALS - Always visible
          ═══════════════════════════════════════════════════════════════════ */}

      {/* Display (essential) */}
      <DisplayControls display={styles.display || ""} onChange={onChange} mixedKeys={mixedKeys} />
      <div className="bdi-row-ctrl" role="group" aria-label="Size">
        <label className="bdi-lb">Size</label>
        <div className="tw:flex tw:flex-1 tw:items-center tw:gap-2">
          <SizeModeSelect axis="width" value={styles.width || ""} onChange={onChange} />
          <SizeModeSelect axis="height" value={styles.height || ""} onChange={onChange} />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ADVANCED - Behind "More settings" toggle
          ═══════════════════════════════════════════════════════════════════ */}

      {advancedExpanded && (
        <>
          {/* Position — five tiles for a property most elements never leave
              `static`, so it sits with the rest of the advanced block rather
              than above Spacing. Board 32:2 draws no Position row. */}
          <PositionControls styles={styles} onChange={onChange} propertyStates={propertyStates} mixedKeys={mixedKeys} />

          {/* Board 7058:78647 opens this block as the one Position row; overflow
              and visibility & float wait one more click. */}
          <MoreSettingsToggle
            isOpen={showOverflow}
            onToggle={() => setShowOverflow((v) => !v)}
            collapsedLabel="Overflow & visibility"
          />
          {showOverflow && (
            <>
              <div className={SECTION_SUBTITLE}>Overflow</div>
              <OverflowControls styles={styles} onChange={onChange} mixedKeys={mixedKeys} />
              <div className={SECTION_SUBTITLE}>Visibility & Float</div>
              <VisibilityFloatControls styles={styles} onChange={onChange} mixedKeys={mixedKeys} />
            </>
          )}
        </>
      )}

      {/* Progressive disclosure toggle */}
      {onAdvancedToggle && (
        <MoreSettingsToggle
          isOpen={advancedExpanded}
          onToggle={() => onAdvancedToggle()}
          collapsedLabel="Position, overflow & visibility"
        />
      )}
    </Section>
  );
};

export default LayoutSection;

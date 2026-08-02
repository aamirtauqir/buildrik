/**
 * Layout Section - User-friendly with visual previews
 * Implements essentials/advanced pattern with MoreSettingsToggle
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Section, MoreSettingsToggle, type SectionTier } from "../../shared/controls";
import { SECTION_PREVIEW, SECTION_SUBTITLE } from "../../shared/controls/controlClasses";
import { ConstraintControl } from "./ConstraintControl";
import { DisplayControls } from "./DisplayControls";
import { OverflowControls, VisibilityFloatControls } from "./OverflowVisibilityControls";
import { PositionControls } from "./PositionControls";

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
      id="inspector-section-display"
    >
      {/* ═══════════════════════════════════════════════════════════════════
          ESSENTIALS - Always visible
          ═══════════════════════════════════════════════════════════════════ */}

      {/* Display (essential) */}
      <DisplayControls display={styles.display || ""} onChange={onChange} mixedKeys={mixedKeys} />

      {/* Size Constraints (essential) */}
      <div className={SECTION_SUBTITLE}>Size Constraints</div>
      <ConstraintControl
        label="Width"
        value={styles.width || "auto"}
        onChange={(val) => onChange("width", val)}
      />
      <ConstraintControl
        label="Height"
        value={styles.height || "auto"}
        onChange={(val) => onChange("height", val)}
      />

      {/* Position - essential (position type + anchor) */}
      <div className={SECTION_SUBTITLE}>Position</div>
      <PositionControls styles={styles} onChange={onChange} propertyStates={propertyStates} mixedKeys={mixedKeys} />

      {/* ═══════════════════════════════════════════════════════════════════
          ADVANCED - Behind "More settings" toggle
          ═══════════════════════════════════════════════════════════════════ */}

      {advancedExpanded && (
        <>
          {/* Overflow (advanced) */}
          <div className={SECTION_SUBTITLE}>Overflow</div>
          <OverflowControls styles={styles} onChange={onChange} mixedKeys={mixedKeys} />

          {/* Visibility & Float (advanced) */}
          <div className={SECTION_SUBTITLE}>Visibility & Float</div>
          <VisibilityFloatControls styles={styles} onChange={onChange} mixedKeys={mixedKeys} />
        </>
      )}

      {/* Progressive disclosure toggle */}
      {onAdvancedToggle && (
        <MoreSettingsToggle
          isOpen={advancedExpanded}
          onToggle={() => onAdvancedToggle()}
          collapsedLabel="Overflow & Visibility"
        />
      )}
    </Section>
  );
};

export default LayoutSection;

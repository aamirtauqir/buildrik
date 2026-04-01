/**
 * Layout Section - User-friendly with visual previews
 * Implements essentials/advanced pattern with MoreSettingsToggle
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Section, baseStyles, MoreSettingsToggle } from "../../shared/controls";
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
  onBatchChange: (changes: Record<string, string>) => void;
  propertyStates?: Record<string, { hidden?: boolean; disabled?: boolean; reason?: string }>;
  /** Controlled open state for auto-expand functionality */
  isOpen?: boolean;
  /** Whether advanced settings (overflow/visibility) are expanded */
  advancedExpanded?: boolean;
  /** Called when the More settings toggle is clicked */
  onAdvancedToggle?: () => void;
}

// Use shared styles
const { sectionTitle } = baseStyles;

// ============================================================================
// COMPONENT
// ============================================================================

export const LayoutSection: React.FC<LayoutSectionProps> = ({
  styles,
  onChange,
  // onBatchChange - reserved for future batch operations
  propertyStates = {},
  isOpen,
  advancedExpanded = false,
  onAdvancedToggle,
}) => {

  return (
    <Section
      title="Layout"
      icon="LayoutGrid"
      defaultOpen
      isOpen={isOpen}
      id="inspector-section-display"
    >
      {/* ═══════════════════════════════════════════════════════════════════
          ESSENTIALS - Always visible
          ═══════════════════════════════════════════════════════════════════ */}

      {/* Display (essential) */}
      <DisplayControls display={styles.display || ""} onChange={onChange} />

      {/* Size Constraints (essential) */}
      <div style={sectionTitle}>Size Constraints</div>
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
      <div style={sectionTitle}>Position</div>
      <PositionControls styles={styles} onChange={onChange} propertyStates={propertyStates} />

      {/* ═══════════════════════════════════════════════════════════════════
          ADVANCED - Behind "More settings" toggle
          ═══════════════════════════════════════════════════════════════════ */}

      {advancedExpanded && (
        <>
          {/* Overflow (advanced) */}
          <div style={sectionTitle}>Overflow</div>
          <OverflowControls styles={styles} onChange={onChange} />

          {/* Visibility & Float (advanced) */}
          <div style={sectionTitle}>Visibility & Float</div>
          <VisibilityFloatControls styles={styles} onChange={onChange} />
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

/**
 * Layout Section - User-friendly with visual previews
 * Implements essentials/advanced pattern with MoreSettingsToggle
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Section, sharedStyles, MoreSettingsToggle } from "../../shared/Controls";
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
  /** Auto-expand advanced settings when search matches */
  showAdvanced?: boolean;
}

// Use shared styles
const { sectionTitle } = sharedStyles;

// ============================================================================
// COMPONENT
// ============================================================================

export const LayoutSection: React.FC<LayoutSectionProps> = ({
  styles,
  onChange,
  // onBatchChange - reserved for future batch operations
  propertyStates = {},
  isOpen,
  showAdvanced: showAdvancedProp,
}) => {
  // Internal state for "More settings" toggle
  const [advancedOpen, setAdvancedOpen] = React.useState(showAdvancedProp ?? false);

  // Sync with external prop (e.g., from search auto-expand)
  React.useEffect(() => {
    if (showAdvancedProp !== undefined) {
      setAdvancedOpen(showAdvancedProp);
    }
  }, [showAdvancedProp]);

  return (
    <Section title="Layout" icon="LayoutGrid" defaultOpen isOpen={isOpen}>
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

      {advancedOpen && (
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
      <MoreSettingsToggle isOpen={advancedOpen} onToggle={setAdvancedOpen} advancedCount={2} />
    </Section>
  );
};

export default LayoutSection;

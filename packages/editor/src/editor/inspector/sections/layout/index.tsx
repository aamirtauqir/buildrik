/**
 * Layout Section — a container's layout (board 17): Display Block · Flex ·
 * Grid · None; the flex controls when Display is Flex, Columns + Gap when it
 * is Grid; Position.
 *
 * Replaces the old Flexbox and Grid sections (D-10/11): a container's flex or
 * grid settings live here, the same controls the Flex / Grid type blocks use
 * (`FlexControls`, `GridControls`). Width / Height left for Size (DD-9).
 * More settings: the inline display modes, overflow, visibility & float.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { MoreSettingsToggle, Section } from "@/editor/inspector/shared/controls";
import { SECTION_SUBTITLE } from "@/editor/inspector/shared/controls/controlClasses";
import { DisplayControls } from "./DisplayControls";
import { FlexControls } from "./FlexControls";
import { GridControls } from "./GridControls";
import { OverflowControls, VisibilityFloatControls } from "./OverflowVisibilityControls";
import { PositionControls } from "./PositionControls";

export interface LayoutSectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  onBatchChange?: (changes: Record<string, string>) => void;
  propertyStates?: Record<string, { hidden?: boolean; disabled?: boolean; reason?: string }>;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  /** Layout's More settings (inline modes, overflow, visibility & float). */
  advancedExpanded?: boolean;
  onAdvancedToggle?: () => void;
  mixedKeys?: ReadonlySet<string>;
  isMultiSelect?: boolean;
}

const FLEX = new Set(["flex", "inline-flex"]);
const GRID = new Set(["grid", "inline-grid"]);

export const LayoutSection: React.FC<LayoutSectionProps> = ({
  styles,
  onChange,
  onBatchChange,
  propertyStates = {},
  isOpen,
  onToggle,
  advancedExpanded = false,
  onAdvancedToggle,
}) => {
  const display = styles.display || "";
  return (
    <Section title="Layout" isOpen={isOpen} onToggle={onToggle} id="inspector-section-layout">
      <DisplayControls display={display} onChange={onChange} advanced={advancedExpanded} />
      {FLEX.has(display) && <FlexControls styles={styles} onChange={onChange} onBatchChange={onBatchChange} advanced={advancedExpanded} />}
      {GRID.has(display) && <GridControls styles={styles} onChange={onChange} advanced={advancedExpanded} />}
      <PositionControls styles={styles} onChange={onChange} propertyStates={propertyStates} />
      {advancedExpanded && (
        <>
          <div className={SECTION_SUBTITLE}>Overflow</div>
          <OverflowControls styles={styles} onChange={onChange} />
          <div className={SECTION_SUBTITLE}>Visibility & Float</div>
          <VisibilityFloatControls styles={styles} onChange={onChange} />
        </>
      )}
      {onAdvancedToggle && <MoreSettingsToggle isOpen={advancedExpanded} onToggle={() => onAdvancedToggle()} />}
    </Section>
  );
};

export default LayoutSection;

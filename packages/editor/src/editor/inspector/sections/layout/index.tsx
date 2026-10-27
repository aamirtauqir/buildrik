/**
 * Layout — 2L9 247:21216 / 36:2 "Children layout": Display, then the flex
 * rows (Direction · Wrap · Justify · Align items · Align lines · gaps) or
 * the grid controls, then "Placement" (Position · Z-index · offsets).
 * More settings holds what a flex container shows only once it is used
 * (Wrap, Row / Column gap) and the grid's extras.
 *
 * Overflow, visibility and float are their own closed section, "Advanced
 * layout · n set" (`LayoutAdvancedSection`). Width / Height left for Size
 * (DD-9).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { MoreSettingsToggle, Section } from "@/editor/inspector/shared/controls";
import { GROUP_TITLE, SECTION_SUBTITLE } from "@/editor/inspector/shared/controls/controlClasses";
import { DisplayControls } from "./DisplayControls";
import { FlexControls } from "./FlexControls";
import { GridControls } from "./GridControls";
import { OverflowControls, VisibilityFloatControls } from "./OverflowVisibilityControls";
import type { BaseStyleSectionProps } from "../registry/_shared";
import { PositionControls } from "./PositionControls";

export interface LayoutSectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  onBatchChange?: (changes: Record<string, string>) => void;
  propertyStates?: Record<string, { hidden?: boolean; disabled?: boolean; reason?: string }>;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  /** Layout's More settings (Wrap, Row / Column gap, the grid's extras). */
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
  const flex = FLEX.has(display);
  const grid = GRID.has(display);
  /* A wrapping flex container with its own row / column gap already shows
     everything More settings would add (247:21216 draws no toggle). */
  const flexHidesSome = (styles["flex-wrap"] || "nowrap") === "nowrap" || !(styles["row-gap"] || styles["column-gap"]);
  return (
    <Section title="Children layout" isOpen={isOpen} onToggle={onToggle} id="inspector-section-layout">
      <DisplayControls display={display} onChange={onChange} />
      {flex && <FlexControls variant="rows" styles={styles} onChange={onChange} onBatchChange={onBatchChange} advanced={advancedExpanded} />}
      {grid && <GridControls styles={styles} onChange={onChange} advanced={advancedExpanded} />}
      {((flex && flexHidesSome) || grid) && onAdvancedToggle && <MoreSettingsToggle isOpen={advancedExpanded} onToggle={() => onAdvancedToggle()} />}
      <div className={GROUP_TITLE}>Placement</div>
      <PositionControls styles={styles} onChange={onChange} propertyStates={propertyStates} />
    </Section>
  );
};

/** 2L9 247:21216 "Advanced layout · 3 set": overflow, visibility & float. */
export const LayoutAdvancedSection: React.FC<BaseStyleSectionProps> = ({ styles, onChange, isOpen, onToggle }) => (
  <Section title="Advanced layout" isOpen={isOpen} onToggle={onToggle} id="inspector-section-layout-advanced">
    <div className={SECTION_SUBTITLE}>Overflow</div>
    <OverflowControls styles={styles} onChange={onChange} />
    <div className={SECTION_SUBTITLE}>Visibility & Float</div>
    <VisibilityFloatControls styles={styles} onChange={onChange} />
  </Section>
);

export default LayoutSection;

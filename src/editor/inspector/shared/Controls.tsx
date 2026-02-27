/**
 * Shared UI Controls for Pro Inspector
 *
 * NOTE: This file now re-exports from the modular controls/ directory.
 * For new code, prefer importing directly from './controls'.
 *
 * @license BSD-3-Clause
 */

// Styles and tokens
export { sharedStyles, baseStyles, INSPECTOR_TOKENS } from "./controls/controlStyles";

// Unified ControlRow system
export { ControlRow, CompactRow, StackedRow, SubTitle } from "./controls/ControlRow";
export type { ControlRowProps, SubTitleProps } from "./controls/ControlRow";

// Section wrapper
export { Section } from "./controls/Section";
export type { SectionProps } from "./controls/Section";

// Input controls
export { InputRow, InputWithUnit, SelectRow } from "./controls/InputControls";
export type { InputRowProps, InputWithUnitProps, SelectRowProps } from "./controls/InputControls";

// Button controls
export { ButtonGroup, CompactButtonGroup } from "./controls/ButtonControls";
export type { ButtonGroupProps, CompactButtonGroupProps } from "./controls/ButtonControls";

// Color input
export { ColorInput } from "./controls/ColorInput";
export type { ColorInputProps } from "./controls/ColorInput";

// Slider controls
export { SliderInput, RangeSlider } from "./controls/SliderControls";
export type { SliderInputProps, RangeSliderProps } from "./controls/SliderControls";

// Spacing controls
export { FourSideInput, CornerRadiusInput } from "./controls/SpacingControls";
export type { FourSideInputProps, CornerRadiusInputProps } from "./controls/SpacingControls";

// Alignment grid
export { AlignmentGrid } from "./controls/AlignmentGrid";
export type { AlignmentGridProps } from "./controls/AlignmentGrid";

// Text controls
export { TextInputRow, InlineInput, SectionLabel, SubSectionTitle } from "./controls/TextControls";
export type {
  TextInputRowProps,
  InlineInputProps,
  SectionLabelProps,
  SubSectionTitleProps,
} from "./controls/TextControls";

// Preset grids
export { TemplateButtonGrid, PresetButtonGrid } from "./controls/PresetGrids";
export type { TemplateButtonGridProps, PresetButtonGridProps } from "./controls/PresetGrids";

// Progressive disclosure toggle
export { MoreSettingsToggle } from "./controls/MoreSettingsToggle";
export type { MoreSettingsToggleProps } from "./controls/MoreSettingsToggle";

// NOTE: ControlRegistry and PropertyRenderer were removed (cleanup 2026-02-12).
// They were L0 dead code designed for a registry-driven approach that was abandoned
// in favor of section-based components. See README.md for architecture decision.

// Legacy default export object (for imports like `import Controls from '...'`)
import { AlignmentGrid } from "./controls/AlignmentGrid";
import { ButtonGroup, CompactButtonGroup } from "./controls/ButtonControls";
import { ColorInput } from "./controls/ColorInput";
import { ControlRow, CompactRow, StackedRow, SubTitle } from "./controls/ControlRow";
import { InputRow, InputWithUnit, SelectRow } from "./controls/InputControls";
import { MoreSettingsToggle } from "./controls/MoreSettingsToggle";
import { TemplateButtonGrid, PresetButtonGrid } from "./controls/PresetGrids";
import { Section } from "./controls/Section";
import { SliderInput, RangeSlider } from "./controls/SliderControls";
import { FourSideInput, CornerRadiusInput } from "./controls/SpacingControls";
import { TextInputRow, InlineInput, SectionLabel, SubSectionTitle } from "./controls/TextControls";

export default {
  Section,
  ControlRow,
  CompactRow,
  StackedRow,
  SubTitle,
  InputRow,
  InputWithUnit,
  SelectRow,
  ButtonGroup,
  ColorInput,
  SliderInput,
  FourSideInput,
  CornerRadiusInput,
  RangeSlider,
  TextInputRow,
  SectionLabel,
  CompactButtonGroup,
  AlignmentGrid,
  InlineInput,
  SubSectionTitle,
  TemplateButtonGrid,
  PresetButtonGrid,
  MoreSettingsToggle,
};

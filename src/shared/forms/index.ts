/**
 * shared/forms — Shared form field components (input, select, slider, color, etc.)
 * Integration: L2 — production-ready, used across inspector and sidebar
 *
 * @license BSD-3-Clause
 */

export { InputField, type InputFieldProps } from "./InputField";
export { NumberField, type NumberFieldProps } from "./NumberField";
export { SelectField, type SelectFieldProps, type SelectOption } from "./SelectField";
export { ColorField, type ColorFieldProps } from "./ColorField";
export { SwitchField, type SwitchFieldProps } from "./SwitchField";
export { TextareaField, type TextareaFieldProps } from "./TextareaField";
export { SliderField, type SliderFieldProps } from "./SliderField";
export { CodeField, type CodeFieldProps } from "./CodeField";
export { FileField, type FileFieldProps } from "./FileField";
export { ImageUploader, type ImageUploaderProps } from "./ImageUploader";
export { GradientPicker, type GradientPickerProps, type GradientStop } from "./GradientPicker";
export {
  AutocompleteField,
  type AutocompleteFieldProps,
  type AutocompleteOption,
} from "./AutocompleteField";
export {
  ButtonGroupField,
  alignmentOptions,
  fontStyleOptions,
  displayOptions,
  type ButtonGroupFieldProps,
  type ButtonGroupOption,
} from "./ButtonGroupField";
export { StackField, type StackFieldProps } from "./StackField";
export { SelectFontField, type SelectFontFieldProps, type FontOption } from "./SelectFontField";
export { FormStateOverlay, type FormStateOverlayProps } from "./FormStateOverlay";
export { FormSettingsSection, type FormSettingsSectionProps } from "./FormSettingsSection";

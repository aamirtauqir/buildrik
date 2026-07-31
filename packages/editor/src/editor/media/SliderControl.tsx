/**
 * Slider Control Component
 * Reusable slider input for image adjustments
 * @license BSD-3-Clause
 */

import * as React from "react";
import { sliderStyles as styles } from "./ImageEditorStyles";
import { TextInput } from "flowbite-react";
import { BK_TEXT_INPUT_THEME } from "@/editor/chrome-ui/textInputTheme";

export interface SliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}

export const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  onChange,
  min,
  max,
}) => (
  <div style={styles.container}>
    <span style={styles.label}>{label}</span>
    <TextInput theme={BK_TEXT_INPUT_THEME}
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={styles.input}
    />
    <span style={styles.value}>{value}</span>
  </div>
);

export default SliderControl;

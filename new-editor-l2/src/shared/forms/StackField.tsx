/**
 * Aquibra Stack Field
 * Grouped inputs (e.g., margin/padding all sides)
 * @license BSD-3-Clause
 */

import * as React from "react";
import { NumberField } from "./NumberField";

export interface StackFieldProps {
  label?: string;
  values: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  onChange: (values: { top?: number; right?: number; bottom?: number; left?: number }) => void;
  linked?: boolean;
  onLinkChange?: (linked: boolean) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

export const StackField: React.FC<StackFieldProps> = ({
  label,
  values,
  onChange,
  linked = false,
  onLinkChange,
  unit = "px",
  min = 0,
  max = 999,
  step = 1,
  disabled = false,
  className,
}) => {
  const [isLinked, setIsLinked] = React.useState(linked);

  const handleChange = (side: keyof typeof values, value: number) => {
    if (isLinked) {
      onChange({ top: value, right: value, bottom: value, left: value });
    } else {
      onChange({ ...values, [side]: value });
    }
  };

  const toggleLink = () => {
    const newLinked = !isLinked;
    setIsLinked(newLinked);
    onLinkChange?.(newLinked);

    if (newLinked && values.top !== undefined) {
      onChange({
        top: values.top,
        right: values.top,
        bottom: values.top,
        left: values.top,
      });
    }
  };

  return (
    <div className={`aqb-stack-field ${className || ""}`}>
      {label && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <label
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--aqb-text-secondary)",
            }}
          >
            {label}
          </label>
          <button
            onClick={toggleLink}
            style={{
              padding: "4px 8px",
              background: isLinked ? "var(--aqb-primary)" : "var(--aqb-bg-panel-secondary)",
              border: "none",
              borderRadius: 4,
              color: isLinked ? "#fff" : "var(--aqb-text-muted)",
              fontSize: 12,
              cursor: "pointer",
            }}
            title={isLinked ? "Unlink values" : "Link all values"}
          >
            {isLinked ? "🔗" : "⛓️‍💥"}
          </button>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: 8,
          position: "relative",
        }}
      >
        {/* Top */}
        <div
          style={{
            gridColumn: "1 / 3",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div style={{ width: 80 }}>
            <NumberField
              value={values.top ?? 0}
              onChange={(v) => handleChange("top", v)}
              unit={unit}
              min={min}
              max={max}
              step={step}
              disabled={disabled}
            />
          </div>
        </div>

        {/* Left */}
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <div style={{ width: 80 }}>
            <NumberField
              value={values.left ?? 0}
              onChange={(v) => handleChange("left", v)}
              unit={unit}
              min={min}
              max={max}
              step={step}
              disabled={disabled || isLinked}
            />
          </div>
        </div>

        {/* Right */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: 80 }}>
            <NumberField
              value={values.right ?? 0}
              onChange={(v) => handleChange("right", v)}
              unit={unit}
              min={min}
              max={max}
              step={step}
              disabled={disabled || isLinked}
            />
          </div>
        </div>

        {/* Bottom */}
        <div
          style={{
            gridColumn: "1 / 3",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div style={{ width: 80 }}>
            <NumberField
              value={values.bottom ?? 0}
              onChange={(v) => handleChange("bottom", v)}
              unit={unit}
              min={min}
              max={max}
              step={step}
              disabled={disabled || isLinked}
            />
          </div>
        </div>

        {/* Center indicator */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 40,
            height: 40,
            background: "var(--aqb-bg-panel-secondary)",
            border: "2px dashed var(--aqb-border)",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            color: "var(--aqb-text-muted)",
          }}
        >
          ⬜
        </div>
      </div>
    </div>
  );
};

export default StackField;

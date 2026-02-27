/**
 * SliderInput Component
 * Numeric input with drag-to-adjust and slider
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface SliderInputProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  label?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const SliderInput: React.FC<SliderInputProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = "",
  label,
  disabled = false,
  onChange,
  className = "",
  style,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(String(value));
  const dragRef = React.useRef<{ startX: number; startValue: number } | null>(null);

  React.useEffect(() => {
    if (!isEditing) {
      setInputValue(String(value));
    }
  }, [value, isEditing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || isEditing) return;
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startValue: value };
    document.body.style.cursor = "ew-resize";
  };

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const delta = e.clientX - dragRef.current.startX;
      const sensitivity = (max - min) / 200;
      const newValue = Math.round((dragRef.current.startValue + delta * sensitivity) / step) * step;
      onChange(Math.max(min, Math.min(max, newValue)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
      document.body.style.cursor = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, min, max, step, onChange]);

  const handleDoubleClick = () => {
    if (disabled) return;
    setIsEditing(true);
    setInputValue(String(value));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed)) {
      onChange(Math.max(min, Math.min(max, parsed)));
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleInputBlur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setInputValue(String(value));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onChange(Math.min(max, value + step));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onChange(Math.max(min, value - step));
    }
  };

  const percentage = ((value - min) / (max - min)) * 100;

  const containerStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    ...style,
  };

  const labelStyles: React.CSSProperties = {
    fontSize: 11,
    color: "var(--aqb-text-tertiary)",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const inputWrapperStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "var(--aqb-input-bg)",
    borderRadius: "var(--aqb-radius-sm)",
    padding: "4px 8px",
    border: "1px solid var(--aqb-input-border)",
    cursor: disabled ? "not-allowed" : isDragging ? "ew-resize" : "default",
    opacity: disabled ? 0.5 : 1,
    transition: "all var(--aqb-transition-fast)",
  };

  const valueDisplayStyles: React.CSSProperties = {
    minWidth: 40,
    textAlign: "right",
    fontSize: 12,
    fontWeight: 500,
    color: "var(--aqb-text-primary)",
    cursor: disabled ? "not-allowed" : "ew-resize",
    userSelect: "none",
  };

  const inputStyles: React.CSSProperties = {
    width: 50,
    background: "transparent",
    border: "none",
    color: "var(--aqb-text-primary)",
    fontSize: 12,
    fontWeight: 500,
    textAlign: "right",
    outline: "none",
  };

  const sliderTrackStyles: React.CSSProperties = {
    flex: 1,
    height: 4,
    background: "var(--aqb-surface-4)",
    borderRadius: 2,
    position: "relative",
    overflow: "hidden",
  };

  const sliderFillStyles: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    width: `${percentage}%`,
    background: "var(--aqb-primary)",
    borderRadius: 2,
    transition: isDragging ? "none" : "width var(--aqb-transition-fast)",
  };

  const unitStyles: React.CSSProperties = {
    fontSize: 11,
    color: "var(--aqb-text-muted)",
    marginLeft: 2,
  };

  return (
    <div className={`aqb-slider-input ${className}`} style={containerStyles}>
      {label && <span style={labelStyles}>{label}</span>}
      <div style={inputWrapperStyles} onMouseDown={handleMouseDown}>
        <div style={sliderTrackStyles}>
          <div style={sliderFillStyles} />
        </div>
        {isEditing ? (
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            style={inputStyles}
            autoFocus
          />
        ) : (
          <span style={valueDisplayStyles} onDoubleClick={handleDoubleClick}>
            {value}
            {unit && <span style={unitStyles}>{unit}</span>}
          </span>
        )}
      </div>
    </div>
  );
};

export default SliderInput;

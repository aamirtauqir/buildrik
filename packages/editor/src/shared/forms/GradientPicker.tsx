/**
 * Aquibra Gradient Picker Component
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface GradientStop {
  color: string;
  position: number; // 0-100
}

export interface GradientPickerProps {
  label?: string;
  value?: string;
  onChange?: (gradient: string) => void;
  disabled?: boolean;
}

export const GradientPicker: React.FC<GradientPickerProps> = ({
  label,
  value = "linear-gradient(90deg, #00d4aa 0%, #7c3aed 100%)",
  onChange,
  disabled = false,
}) => {
  const [type, setType] = React.useState<"linear" | "radial">("linear");
  const [angle, setAngle] = React.useState(90);
  const [stops, setStops] = React.useState<GradientStop[]>([
    { color: "#00d4aa", position: 0 },
    { color: "#7c3aed", position: 100 },
  ]);

  // Parse initial value
  React.useEffect(() => {
    const linearMatch = value.match(/linear-gradient\((\d+)deg,\s*(.+)\)/);
    const radialMatch = value.match(/radial-gradient\((.+)\)/);

    if (linearMatch) {
      setType("linear");
      setAngle(parseInt(linearMatch[1]));
      parseStops(linearMatch[2]);
    } else if (radialMatch) {
      setType("radial");
      parseStops(radialMatch[1]);
    }
  }, []);

  const parseStops = (stopsStr: string) => {
    const stopRegex = /(#[a-fA-F0-9]{6}|rgba?\([^)]+\))\s+(\d+)%/g;
    const parsed: GradientStop[] = [];
    let match;
    while ((match = stopRegex.exec(stopsStr)) !== null) {
      parsed.push({ color: match[1], position: parseInt(match[2]) });
    }
    if (parsed.length >= 2) {
      setStops(parsed);
    }
  };

  const buildGradient = () => {
    const stopsStr = stops
      .sort((a, b) => a.position - b.position)
      .map((s) => `${s.color} ${s.position}%`)
      .join(", ");

    return type === "linear"
      ? `linear-gradient(${angle}deg, ${stopsStr})`
      : `radial-gradient(circle, ${stopsStr})`;
  };

  const updateGradient = () => {
    onChange?.(buildGradient());
  };

  const updateStop = (index: number, updates: Partial<GradientStop>) => {
    const newStops = [...stops];
    newStops[index] = { ...newStops[index], ...updates };
    setStops(newStops);
    setTimeout(updateGradient, 0);
  };

  const addStop = () => {
    const newPosition = 50;
    setStops([...stops, { color: "#ffffff", position: newPosition }]);
    setTimeout(updateGradient, 0);
  };

  const removeStop = (index: number) => {
    if (stops.length <= 2) return;
    setStops(stops.filter((_, i) => i !== index));
    setTimeout(updateGradient, 0);
  };

  return (
    <div className="aqb-gradient-picker" style={{ opacity: disabled ? 0.5 : 1 }}>
      {label && (
        <label
          style={{
            display: "block",
            marginBottom: 6,
            fontSize: 12,
            color: "var(--aqb-text-secondary)",
          }}
        >
          {label}
        </label>
      )}

      {/* Preview */}
      <div
        style={{
          height: 48,
          borderRadius: 8,
          background: buildGradient(),
          marginBottom: 12,
          border: "1px solid var(--aqb-border)",
        }}
      />

      {/* Type & Angle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as "linear" | "radial");
            setTimeout(updateGradient, 0);
          }}
          disabled={disabled}
          style={{
            flex: 1,
            padding: "6px 10px",
            background: "var(--aqb-bg-dark)",
            border: "1px solid var(--aqb-border)",
            borderRadius: 6,
            color: "var(--aqb-text-primary)",
            fontSize: 12,
          }}
        >
          <option value="linear">Linear</option>
          <option value="radial">Radial</option>
        </select>

        {type === "linear" && (
          <input
            type="number"
            value={angle}
            onChange={(e) => {
              setAngle(parseInt(e.target.value) || 0);
              setTimeout(updateGradient, 0);
            }}
            disabled={disabled}
            min={0}
            max={360}
            style={{
              width: 70,
              padding: "6px 10px",
              background: "var(--aqb-bg-dark)",
              border: "1px solid var(--aqb-border)",
              borderRadius: 6,
              color: "var(--aqb-text-primary)",
              fontSize: 12,
              textAlign: "center",
            }}
          />
        )}
      </div>

      {/* Stops */}
      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 12, color: "var(--aqb-text-muted)" }}>Color Stops</span>
          <button
            onClick={addStop}
            disabled={disabled}
            style={{
              padding: "4px 8px",
              background: "var(--aqb-bg-panel-secondary)",
              border: "none",
              borderRadius: 4,
              color: "var(--aqb-text-secondary)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            + Add
          </button>
        </div>

        {stops.map((stop, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <input
              type="color"
              value={stop.color}
              onChange={(e) => updateStop(i, { color: e.target.value })}
              disabled={disabled}
              style={{
                width: 32,
                height: 32,
                border: "1px solid var(--aqb-border)",
                borderRadius: 4,
                cursor: "pointer",
              }}
            />
            <input
              type="number"
              value={stop.position}
              onChange={(e) =>
                updateStop(i, {
                  position: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)),
                })
              }
              disabled={disabled}
              min={0}
              max={100}
              style={{
                flex: 1,
                padding: "6px 8px",
                background: "var(--aqb-bg-dark)",
                border: "1px solid var(--aqb-border)",
                borderRadius: 4,
                color: "var(--aqb-text-primary)",
                fontSize: 12,
              }}
            />
            <span style={{ fontSize: 12, color: "var(--aqb-text-muted)" }}>%</span>
            {stops.length > 2 && (
              <button
                onClick={() => removeStop(i)}
                disabled={disabled}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--aqb-text-muted)",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GradientPicker;

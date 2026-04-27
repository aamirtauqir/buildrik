import { Button } from "@/shared/ui/Button";
/**
 * Button Group controls — ported to .bdi-seg per comp-inspector.v1.
 * ButtonGroup = full-row segmented control. CompactButtonGroup = dense variant.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

// ============================================================================
// BUTTON GROUP (segmented, sits in a .bdi-row-ctrl row when labeled)
// ============================================================================

export interface ButtonGroupProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; icon?: React.ReactNode | string }[];
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({ label, value, onChange, options }) => {
  const segment = (
    <div
      className="bdi-seg"
      style={{
        gridAutoColumns: `repeat(${options.length}, 1fr)`,
      }}
    >
      {options.map((opt) => (
        <Button
          key={opt.value}
          type="button"
          className={value === opt.value ? "on" : ""}
          onClick={() => onChange(opt.value)}
          title={opt.label}
          aria-label={opt.label}
          aria-pressed={value === opt.value}
        >
          {opt.icon ? (
            <span className="bdi-ico" aria-hidden="true">
              {typeof opt.icon === "string" ? opt.icon : opt.icon}
            </span>
          ) : (
            opt.label
          )}
        </Button>
      ))}
    </div>
  );

  if (!label) return segment;

  return (
    <div className="bdi-row-ctrl">
      <label className="bdi-lb">{label}</label>
      <div className="bdi-row-content">{segment}</div>
    </div>
  );
};

// ============================================================================
// COMPACT BUTTON GROUP (short inline variant)
// ============================================================================

export interface CompactButtonGroupProps {
  label?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  labelWidth?: number;
}

export const CompactButtonGroup: React.FC<CompactButtonGroupProps> = ({
  label,
  value,
  options,
  onChange,
}) => {
  const segment = (
    <div
      className="bdi-seg"
      style={{
        gridAutoColumns: `repeat(${options.length}, 1fr)`,
        height: 22,
      }}
    >
      {options.map((opt) => (
        <Button
          key={opt.value}
          type="button"
          className={value === opt.value ? "on" : ""}
          onClick={() => onChange(opt.value)}
          title={opt.label}
          aria-label={opt.label}
          aria-pressed={value === opt.value}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );

  if (!label) return segment;

  return (
    <div className="bdi-row-ctrl">
      <label className="bdi-lb">{label}</label>
      <div className="bdi-row-content">{segment}</div>
    </div>
  );
};

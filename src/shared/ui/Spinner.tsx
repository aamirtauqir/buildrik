/**
 * Aquibra Spinner Component
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface SpinnerProps {
  size?: "sm" | "md" | "lg" | number;
  color?: string;
  thickness?: number;
}

const sizeMap = { sm: 16, md: 24, lg: 40 };

export const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  color = "var(--aqb-primary)",
  thickness = 2,
}) => {
  const pixelSize = typeof size === "number" ? size : sizeMap[size];

  return (
    <svg
      className="aqb-spinner"
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: "aqb-spin 1s linear infinite" }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth={thickness}
        strokeLinecap="round"
        strokeDasharray="60 30"
      />
    </svg>
  );
};

export default Spinner;

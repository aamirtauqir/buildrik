// PHASE 5 DELETE — Phase 4 adapter shim. Legacy/vibcoder shapes diverge;
// translation deferred. Marker reserves the file as the canonical
// `@/shared/ui/Spinner` route during the Phase 4 → Phase 5 swap.
/**
 * Aquibra Spinner Component
 *
 * Legacy prop surface (preserved by this shim):
 *   size: "sm" | "md" | "lg" | number  (legacy — pixel-precise; vibcoder = "sm" | "lg")
 *   color: string (legacy — vibcoder relies on CSS accent token, no color prop)
 *   thickness: number (legacy — vibcoder uses fixed 2px border)
 *
 * Existing consumers (e.g., Button.tsx) pass `color="currentColor"` and a
 * numeric `size`. Until Phase 5 lands a vibcoder-only Spinner, the legacy
 * implementation stays — the shim's job here is to be the single import
 * route (`@/shared/ui/Spinner`) so the codemod-emitted imports resolve.
 *
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
  color = "var(--buildrick-accent)",
  thickness = 2,
}) => {
  const pixelSize = typeof size === "number" ? size : sizeMap[size];

  return (
    <svg
      className="buildrick-spinner"
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: "buildrick-spin 1s linear infinite" }}
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

// PHASE 5 DELETE — Phase 4 adapter shim. Replaces hand-rolled Spinner.
/**
 * Adapter shim — translates legacy Spinner API to vibcoder Spinner.
 *
 * Strategy: bridge. Renders `<VibcoderSpinner>` (`<span class="bd-spinner">`)
 * internally and maps the legacy prop surface onto vibcoder's narrower one.
 *
 * Prop translations (Phase 4 Q4 mapping):
 *   size:
 *     "sm"    → vibcoder size="sm"
 *     "md"    → vibcoder undefined (base 14px — no modifier)
 *     "lg"    → vibcoder size="lg"
 *     number  → vibcoder undefined + style={{ width: N, height: N }}
 *               (pixel-precise size — vibcoder doesn't model arbitrary px,
 *               so we override the CSS-driven size with inline style)
 *   color:
 *     string  → style={{ color }} (vibcoder CSS uses `currentColor` for
 *               the spinner border, so setting `color` cascades correctly)
 *   thickness:
 *     defined → throws-at-render. Vibcoder spinner uses a fixed 2px border
 *               in the vendored CSS (atoms/spinner.css). There is no token
 *               or modifier to vary the stroke width, and faking it via
 *               inline style would mis-paint at non-default sizes.
 *
 * Existing consumers (e.g., Button.tsx) pass `size={n}` + `color="currentColor"`
 * — both translate cleanly through inline style. Verified by
 * Button.adapter.test.tsx's loading-state assertions.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Spinner as VibcoderSpinner } from "@/editor/shared/vibcoder";

export interface SpinnerProps {
  size?: "sm" | "md" | "lg" | number;
  color?: string;
  thickness?: number;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  color,
  thickness,
}) => {
  if (thickness !== undefined) {
    throw new Error(
      "Spinner: `thickness` prop is not translatable — vibcoder Spinner uses a fixed 2px border with no modifier or token override. Drop the prop or migrate the consumer to vibcoder Spinner directly."
    );
  }

  let mappedSize: "sm" | "lg" | undefined;
  let pixelOverride: { width: number; height: number } | undefined;
  if (typeof size === "number") {
    mappedSize = undefined;
    pixelOverride = { width: size, height: size };
  } else if (size === "sm") {
    mappedSize = "sm";
  } else if (size === "lg") {
    mappedSize = "lg";
  } else {
    mappedSize = undefined; // md = base default
  }

  const style: React.CSSProperties | undefined =
    color || pixelOverride
      ? { ...(color ? { color } : {}), ...(pixelOverride ?? {}) }
      : undefined;

  return <VibcoderSpinner size={mappedSize} style={style} />;
};

export default Spinner;

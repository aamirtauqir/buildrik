/**
 * MixedValueIndicator — "Mixed" beside a control that cannot draw it itself
 * (the legacy Position / Overflow segment rows). Reads the field context, so
 * nothing threads `mixedKeys` down to it; the shared controls (number,
 * select, colour, font, sliders, segmented) draw Mixed on their own and need
 * no indicator.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { InspectorFieldContext } from "./InspectorFieldContext";

interface MixedValueIndicatorProps {
  /** One property, or several read as one group ("Position offset"). */
  property: string | readonly string[];
}

export const MixedValueIndicator: React.FC<MixedValueIndicatorProps> = ({ property }) => {
  const { mixedKeys } = React.useContext(InspectorFieldContext);
  const props = typeof property === "string" ? [property] : property;
  if (!props.some((p) => mixedKeys.has(p))) return null;
  return (
    <span className="tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-muted)]" title="Mixed values across the selection">
      Mixed
    </span>
  );
};

import * as React from "react";
import { MixedValueBadge } from "../MixedValueBadge";

interface MixedValueIndicatorProps {
  prop: string;
  mixedKeys?: ReadonlySet<string>;
  offsetLeft?: number;
}

export const MixedValueIndicator: React.FC<MixedValueIndicatorProps> = ({
  prop,
  mixedKeys,
  offsetLeft = 56,
}) => {
  if (!mixedKeys?.has(prop)) return null;
  return (
    <span style={{ position: "absolute", top: "50%", left: offsetLeft, transform: "translateY(-50%)", zIndex: 1 }}>
      <MixedValueBadge compact />
    </span>
  );
};
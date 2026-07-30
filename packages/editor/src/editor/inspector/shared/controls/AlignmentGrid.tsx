/**
 * AlignmentGrid — 9-dot justify/align picker. Ported to .bdi-pad per
 * comp-inspector.html v2 mock. Shows a pad + kv meta block side-by-side.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "flowbite-react";

export interface AlignmentGridProps {
  justifyItems: string;
  alignItems: string;
  onChange: (property: string, value: string) => void;
}

const POSITIONS: { ji: string; ai: string }[] = [
  { ji: "start", ai: "start" },
  { ji: "center", ai: "start" },
  { ji: "end", ai: "start" },
  { ji: "start", ai: "center" },
  { ji: "center", ai: "center" },
  { ji: "end", ai: "center" },
  { ji: "start", ai: "end" },
  { ji: "center", ai: "end" },
  { ji: "end", ai: "end" },
];

export const AlignmentGrid: React.FC<AlignmentGridProps> = ({
  justifyItems,
  alignItems,
  onChange,
}) => (
  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
    <div className="bdi-pad" title="Align items · justify-content">
      {POSITIONS.map((pos, i) => {
        const isActive =
          justifyItems === pos.ji && alignItems === pos.ai;
        return (
          <Button
            key={i}
            type="button"
            className={`bdi-d${isActive ? " on" : ""}`}
            onClick={() => {
              onChange("justify-items", pos.ji);
              onChange("align-items", pos.ai);
            }}
            title={`justify: ${pos.ji}, align: ${pos.ai}`}
            aria-label={`justify: ${pos.ji}, align: ${pos.ai}`}
            aria-pressed={isActive}
          />
        );
      })}
    </div>
    <div className="bdi-pad-meta">
      <div className="bdi-pad-kv">
        <span className="bdi-pk">justify</span>
        <span className="bdi-pv">{justifyItems || "—"}</span>
      </div>
      <div className="bdi-pad-kv">
        <span className="bdi-pk">items</span>
        <span className="bdi-pv">{alignItems || "—"}</span>
      </div>
    </div>
  </div>
);

export default AlignmentGrid;

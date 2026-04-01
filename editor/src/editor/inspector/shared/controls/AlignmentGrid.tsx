/**
 * AlignmentGrid - 3x3 visual alignment picker
 * @license BSD-3-Clause
 */

import * as React from "react";

// ============================================================================
// ALIGNMENT GRID
// ============================================================================

export interface AlignmentGridProps {
  justifyItems: string;
  alignItems: string;
  onChange: (property: string, value: string) => void;
}

export const AlignmentGrid: React.FC<AlignmentGridProps> = ({
  justifyItems,
  alignItems,
  onChange,
}) => {
  const positions = [
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

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 2,
        padding: 8,
        background: "rgba(0,0,0,0.2)",
        borderRadius: 6,
        marginBottom: 8,
      }}
    >
      {positions.map((pos, i) => {
        const isActive = justifyItems === pos.ji && alignItems === pos.ai;
        return (
          <button
            key={i}
            onClick={() => {
              onChange("justify-items", pos.ji);
              onChange("align-items", pos.ai);
            }}
            style={{
              width: 24,
              height: 24,
              background: isActive ? "#0073E6" : "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: 3,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title={`justify: ${pos.ji}, align: ${pos.ai}`}
          >
            <div
              style={{
                width: 6,
                height: 6,
                background: isActive ? "#fff" : "#71717a",
                borderRadius: 1,
              }}
            />
          </button>
        );
      })}
    </div>
  );
};

export default AlignmentGrid;

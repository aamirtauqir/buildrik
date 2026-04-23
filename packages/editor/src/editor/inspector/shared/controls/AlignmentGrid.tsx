/**
 * AlignmentGrid — 3x3 visual justify/align picker. Ported to --bd-* tokens.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

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
        padding: 4,
        background: "var(--bd-bg-subtle)",
        borderRadius: 4,
      }}
    >
      {positions.map((pos, i) => {
        const isActive = justifyItems === pos.ji && alignItems === pos.ai;
        return (
          <button
            key={i}
            type="button"
            onClick={() => {
              onChange("justify-items", pos.ji);
              onChange("align-items", pos.ai);
            }}
            style={{
              width: 22,
              height: 22,
              background: isActive ? "var(--bd-accent)" : "#fff",
              border: "none",
              borderRadius: 3,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 120ms",
            }}
            title={`justify: ${pos.ji}, align: ${pos.ai}`}
            aria-label={`justify: ${pos.ji}, align: ${pos.ai}`}
            aria-pressed={isActive}
          >
            <div
              style={{
                width: 6,
                height: 6,
                background: isActive ? "#fff" : "var(--bd-fg-muted)",
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

/**
 * DraftChip — shows saved / unsaved state indicator
 * @license BSD-3-Clause
 */

import * as React from "react";

type DraftState = "saved" | "dirty";

export const DraftChip: React.FC<{ state: DraftState; count: number }> = ({ state, count }) => {
  if (state === "saved") {
    return (
      <span
        style={{
          fontSize: 12,
          color: "var(--aqb-color-success)",
          fontWeight: 500,
          padding: "2px 8px",
          borderRadius: 20,
          background: "rgba(34,197,94,0.1)",
          border: "1px solid rgba(34,197,94,0.2)",
        }}
      >
        All saved
      </span>
    );
  }
  return (
    <span
      style={{
        fontSize: 12,
        color: "#f59e0b",
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 20,
        background: "rgba(245,158,11,0.1)",
        border: "1px solid rgba(245,158,11,0.3)",
        display: "flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "#f59e0b",
          animation: "aqb-dot-pulse 1.5s infinite",
        }}
      />
      {count} previewing
    </span>
  );
};

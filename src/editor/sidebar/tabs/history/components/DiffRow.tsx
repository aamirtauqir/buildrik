/**
 * DiffRow Component
 * Displays a single change in the history diff view
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { HistoryChange } from "../../../../../engine/HistoryManager";
import { diffRowStyles, diffOpStyles, diffPropertyStyles, diffDescStyles } from "../styles";

interface DiffRowProps {
  change: HistoryChange;
}

const opColors: Record<string, string> = {
  add: "var(--aqb-success, #10b981)",
  remove: "var(--aqb-error, #ef4444)",
  replace: "var(--aqb-primary, #7c7dff)",
  info: "var(--aqb-text-muted)",
};

const opIcons: Record<string, string> = {
  add: "+",
  remove: "-",
  replace: "~",
  info: "...",
};

export const DiffRow = React.memo<DiffRowProps>(({ change }) => {
  return (
    <div style={diffRowStyles}>
      <span
        style={{
          ...diffOpStyles,
          color: opColors[change.operation],
        }}
      >
        {opIcons[change.operation]}
      </span>
      <span style={diffPropertyStyles}>{change.property}</span>
      <span style={diffDescStyles}>{change.description}</span>
    </div>
  );
});

/**
 * DiffRow Component
 * Displays a single change in the history diff view
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { HistoryChange } from "../../../../../engine/HistoryManager";

interface DiffRowProps {
  change: HistoryChange;
}

const opColors: Record<string, string> = {
  add: "var(--bd-success)",
  remove: "var(--bd-error)",
  replace: "var(--bd-accent, var(--bd-accent))",
  info: "var(--bd-fg-muted)",
};

const opIcons: Record<string, string> = {
  add: "+",
  remove: "-",
  replace: "~",
  info: "...",
};

export const DiffRow = React.memo<DiffRowProps>(({ change }) => {
  return (
    <div>
      <span
       
        style={{ color: opColors[change.operation] }}
      >
        {opIcons[change.operation]}
      </span>
      <span>{change.property}</span>
      <span>{change.description}</span>
    </div>
  );
});

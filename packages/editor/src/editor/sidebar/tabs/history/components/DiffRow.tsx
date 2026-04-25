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
  add: "var(--bd-success, #22c55e)",
  remove: "var(--bd-error, #ef4444)",
  replace: "var(--bd-accent, var(--bd-accent))",
  info: "var(--bd-fg-muted, #908D85)",
};

const opIcons: Record<string, string> = {
  add: "+",
  remove: "-",
  replace: "~",
  info: "...",
};

export const DiffRow = React.memo<DiffRowProps>(({ change }) => {
  return (
    <div className="buildrick-ht-diff__row">
      <span
        className="buildrick-ht-diff__op"
        style={{ color: opColors[change.operation] }}
      >
        {opIcons[change.operation]}
      </span>
      <span className="buildrick-ht-diff__property">{change.property}</span>
      <span className="buildrick-ht-diff__desc">{change.description}</span>
    </div>
  );
});

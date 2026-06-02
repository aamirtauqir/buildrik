import * as React from "react";
import type { DiffEdit } from "./types";

/**
 * Renders the field-level deltas of an AI edit. Until now the editor parsed
 * the edit chunk but never displayed it (ChatMessage dropped `edit`); this is
 * the missing diff surface. `from` is usually empty for in-canvas set-style
 * edits (the server does not read the live element), so a row shows the
 * property and its proposed value.
 */
export const DiffRows: React.FC<{ edit: DiffEdit }> = ({ edit }) => {
  if (edit.rows.length === 0) {
    return <div className="bd-ai-diff-empty">{edit.summary}</div>;
  }
  return (
    <ul className="bd-ai-diff-rows" aria-label="Proposed changes">
      {edit.rows.map((r, i) => (
        <li key={`${r.field}-${i}`} className="bd-ai-diff-row">
          <span className="bd-ai-diff-field">{r.field}</span>
          {r.from ? <span className="bd-ai-diff-from">{r.from}</span> : null}
          <span className="bd-ai-diff-to">{r.to}</span>
        </li>
      ))}
    </ul>
  );
};

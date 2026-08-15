import * as React from "react";
import type { AIScope, AIScopeStatus } from "./types";

export interface ScopeChipProps {
  scope: AIScope;
  status: AIScopeStatus;
}

function describeScope(scope: AIScope): string {
  if (scope.kind === "element") return scope.label;
  if (scope.kind === "multi") return `${scope.count} selected`;
  return "Whole page";
}

/* Every AI board opens the panel with a tinted band reading "Scope: <what>"
   — what the run is allowed to touch, in the run's own words. The old chip
   said "Scoped to <x>" with a status dot. */
export const ScopeChip: React.FC<ScopeChipProps> = ({ scope, status }) => {
  return (
    <div className="bd-ai-scope" role="status" aria-live="polite">
      <span className="bd-ai-scope-text">
        Scope: <span className="bd-ai-scope-target">{describeScope(scope)}</span>
      </span>
      {status === "locked" && (
        <span className="bd-ai-scope-lock" aria-label="Scope locked during prompt">
          🔒
        </span>
      )}
    </div>
  );
};

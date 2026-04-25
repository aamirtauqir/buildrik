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

export const ScopeChip: React.FC<ScopeChipProps> = ({ scope, status }) => {
  return (
    <div className="bd-ai-scope" role="status" aria-live="polite">
      <span className="bd-ai-scope-dot" aria-hidden="true" />
      <span className="bd-ai-scope-text">
        Scoped to <span className="bd-ai-scope-target">{describeScope(scope)}</span>
      </span>
      {status === "locked" && (
        <span className="bd-ai-scope-lock" aria-label="Scope locked during prompt">
          🔒
        </span>
      )}
    </div>
  );
};

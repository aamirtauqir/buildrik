// The model list is server-owned. This file used to declare its own copy of the
// union plus its own DEFAULT_MODEL, which drifted from the server's: both named
// Claude models that the server could never call. One source now.
export { DEFAULT_MODEL, type AIModel } from "@buildrik/shared/schemas/ai";

/** What a run may touch. `element` is one element (a one-step run); every
 *  other kind is a planned run over a pool of elements — the selection
 *  (`multi`), the elements of the selected one's type on this page
 *  (`similar`, board 6891:73760), the page, or every page (`site`, 6891:73974).
 *  `name` is what the run's copy calls the element ("restores Hero"). */
export type AIScope =
  | { kind: "element"; id: string; label: string; name: string }
  | { kind: "multi"; ids: string[] }
  | { kind: "similar"; ids: string[]; noun: string }
  | { kind: "page" }
  | { kind: "site"; pages: number };

export type AIScopeStatus = "idle" | "locked";

export interface DiffEdit {
  target: string;
  summary: string;
  rows: Array<{ field: string; from: string; to: string }>;
  applyOps: {
    preview: Record<string, unknown>;
    commit: Record<string, unknown>;
  };
  state: "pending" | "applied" | "rejected" | "invalid";
}

export type DrillInScreen = "a11y" | "layout" | "color" | null;

export interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  drillTo?: DrillInScreen;
}

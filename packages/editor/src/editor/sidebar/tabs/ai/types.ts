// The model list is server-owned. This file used to declare its own copy of the
// union plus its own DEFAULT_MODEL, which drifted from the server's: both named
// Claude models that the server could never call. One source now.
export { DEFAULT_MODEL, type AIModel } from "@buildrik/shared/schemas/ai";

export type AIScope =
  | { kind: "element"; id: string; label: string }
  | { kind: "page" }
  | { kind: "multi"; count: number };

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

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  streaming?: boolean;
  stopped?: boolean;
  edit?: DiffEdit;
  error?: string;
  createdAt: number;
}

export type DrillInScreen = "a11y" | "layout" | "color" | null;

export interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  drillTo?: DrillInScreen;
}

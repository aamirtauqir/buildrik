export type AIModel =
  | "claude-opus-4-7"
  | "claude-sonnet-4-6"
  | "claude-haiku-4-5"
  | "gpt-4o-mini";

export const DEFAULT_MODEL: AIModel = "claude-sonnet-4-6";

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

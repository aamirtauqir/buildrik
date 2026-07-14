import type { AIModel } from "@buildrik/shared/schemas/ai";

export interface TokenChunk {
  type: "text" | "edit" | "done";
  text?: string;
  edit?: ProposedEdit;
}

export interface ProposedEdit {
  target: string;
  summary: string;
  rows: Array<{ field: string; from: string; to: string }>;
  applyOps: {
    preview: Record<string, unknown>;
    commit: Record<string, unknown>;
  };
}

export interface AIProvider {
  stream(
    prompt: string,
    model: AIModel,
    signal: AbortSignal,
  ): AsyncIterable<TokenChunk>;
  generate(prompt: string, model: AIModel): Promise<string>;
}

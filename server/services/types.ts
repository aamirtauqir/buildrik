import { z } from "zod";

export const modelSchema = z.enum([
  "claude-opus-4-7",
  "claude-sonnet-4-6",
  "claude-haiku-4-5",
  "gpt-4o-mini",
]);

export type AIModel = z.infer<typeof modelSchema>;

export const DEFAULT_MODEL: AIModel = "claude-sonnet-4-6";

export function isClaudeModel(model: AIModel): boolean {
  return model.startsWith("claude-");
}

export function isOpenAIModel(model: AIModel): boolean {
  return model.startsWith("gpt-");
}

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

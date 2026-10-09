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

/** The provider's endpoint refused the connection (L5-001: OLLAMA_BASE_URL set,
 *  nothing listening). Distinct from a provider error so the router can answer
 *  "not available" instead of a generic failure. */
export class AIProviderUnreachableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIProviderUnreachableError";
  }
}

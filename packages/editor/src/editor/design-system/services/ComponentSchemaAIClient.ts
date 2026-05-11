import type { AIClient } from "./AIAssistService";

interface MutateArgs {
  prompt: string;
  model?: string;
}

interface MutateResult {
  raw: string;
}

export type ComponentSchemaMutate = (
  args: MutateArgs,
  options: { signal: AbortSignal | undefined },
) => Promise<MutateResult>;

export interface ComponentSchemaAIClientDeps {
  mutate: ComponentSchemaMutate;
  model?: string;
}

/**
 * Single-shot AIClient adapter for the Phase C.2 ai.componentSchema tRPC
 * mutation. Server returns `{ raw: string }` (the model output, fence-stripped);
 * AIAssistService consumes it through the existing JSON.parse + Zod-validation
 * pipeline, mapping malformed output to D14 AIInvalidSchemaError.
 *
 * Prefer this over StreamPromptAIClient for component-schema generation —
 * single-shot avoids prompt-engineering fragility around streamed text.
 */
export class ComponentSchemaAIClient implements AIClient {
  constructor(private readonly deps: ComponentSchemaAIClientDeps) {}

  async generate(input: { prompt: string; signal?: AbortSignal }): Promise<string> {
    const args: MutateArgs = { prompt: input.prompt };
    if (this.deps.model) args.model = this.deps.model;
    const result = await this.deps.mutate(args, { signal: input.signal });
    return result.raw;
  }
}

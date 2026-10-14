import type { AIClient } from "./AIAssistService";
import type { AIModel } from "@buildrik/shared/schemas/ai";

interface MutateArgs {
  prompt: string;
  /* The server's model enum, not `string` — a string here is what forced the
     `as any` at the tRPC call site (DQ-032). */
  model?: AIModel;
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
  model?: AIModel;
}

/**
 * Single-shot AIClient adapter for the Phase C.2 ai.componentSchema tRPC
 * mutation. Server returns `{ raw: string }` (the model output, fence-stripped);
 * AIAssistService consumes it through the existing JSON.parse + Zod-validation
 * pipeline, mapping malformed output to D14 AIInvalidSchemaError.
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

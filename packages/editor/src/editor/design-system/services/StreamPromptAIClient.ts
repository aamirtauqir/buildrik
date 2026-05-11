import type { AIClient } from "./AIAssistService";

export interface StreamOpener {
  open(input: { prompt: string; signal?: AbortSignal }): AsyncIterable<string>;
}

export class StreamPromptAIClient implements AIClient {
  constructor(private readonly opener: StreamOpener) {}

  async generate(input: { prompt: string; signal?: AbortSignal }): Promise<string> {
    const parts: string[] = [];
    for await (const chunk of this.opener.open(input)) {
      parts.push(chunk);
    }
    return parts.join("");
  }
}

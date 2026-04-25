import Anthropic from "@anthropic-ai/sdk";
import type { AIModel, AIProvider, TokenChunk } from "./types";

let _anthropic: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

export class AnthropicProvider implements AIProvider {
  async *stream(
    prompt: string,
    model: AIModel,
    signal: AbortSignal,
  ): AsyncIterable<TokenChunk> {
    const sdkStream = getClient().messages.stream({
      model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    for await (const event of sdkStream) {
      if (signal.aborted) return;
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield { type: "text", text: event.delta.text };
      }
      if (event.type === "message_stop") {
        yield { type: "done" };
        return;
      }
    }
  }

  async generate(prompt: string, model: AIModel): Promise<string> {
    const response = await getClient().messages.create({
      model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });
    const block = response.content[0];
    return block?.type === "text" ? block.text : "";
  }
}

export const anthropicProvider = new AnthropicProvider();

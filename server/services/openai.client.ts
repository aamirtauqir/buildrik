import OpenAI from "openai";
import type { AIModel } from "@buildrik/shared/schemas/ai";
import type { AIProvider, TokenChunk } from "./types";

/**
 * The one OpenAI client. Every paid AI call in the product goes through here:
 * in-editor AI (via `getProvider`), onboarding site drafts, and alt-text vision.
 *
 * They used to each construct their own SDK client — ai.service held a private
 * `getOpenAI()`, and alt-text.service held a private Anthropic one. That is how
 * two of the three AI features ended up bypassing the provider abstraction
 * entirely, and how alt-text stayed pointed at a provider we have never had a
 * key for.
 */

/** Per request, until the response headers arrive (the SDK clears its timer
 *  then, so a stream that has started is not cut off). The SDK default is
 *  10 minutes with 2 retries — ~30 minutes for one hung call. */
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 1;

let _client: OpenAI | undefined;
export function getOpenAI(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: REQUEST_TIMEOUT_MS,
      maxRetries: MAX_RETRIES,
    });
  }
  return _client;
}

export function isOpenAIConfigured(): boolean {
  return (process.env.OPENAI_API_KEY ?? "").length > 0;
}

class OpenAIProvider implements AIProvider {
  async *stream(
    prompt: string,
    model: AIModel,
    signal: AbortSignal,
  ): AsyncIterable<TokenChunk> {
    const sdkStream = await getOpenAI().chat.completions.create({
      model,
      stream: true,
      messages: [{ role: "user", content: prompt }],
    });
    for await (const event of sdkStream) {
      if (signal.aborted) return;
      const text = event.choices[0]?.delta?.content;
      if (text) yield { type: "text", text };
      if (event.choices[0]?.finish_reason) {
        yield { type: "done" };
        return;
      }
    }
  }

  async generate(prompt: string, model: AIModel): Promise<string> {
    const res = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
    });
    return res.choices[0]?.message?.content ?? "";
  }
}

export const openAIProvider: AIProvider = new OpenAIProvider();

import OpenAI from "openai";
import type { AIModel } from "@buildrik/shared/schemas/ai";
import { AIProviderUnreachableError, type AIProvider, type TokenChunk } from "./types";

/**
 * Local Ollama provider via its OpenAI-compatible endpoint. Lets the editor run
 * AI features against a self-hosted model (e.g. qwen3.5, on Apple Silicon
 * qwen3.5:9b-mlx) with no paid API key. Enabled by setting OLLAMA_BASE_URL
 * (e.g. http://localhost:11434); the model name is OLLAMA_MODEL. The AIModel
 * passed in is the "ollama" placeholder — the real model name comes from env.
 */

export const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen3.5";

// Local models can be slow to (re)load into memory, especially large ones, so
// allow a generous timeout. Override with OLLAMA_TIMEOUT_MS.
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS ?? 300_000);

let _client: OpenAI | undefined;
function getOllamaClient(): OpenAI {
  if (!_client) {
    const base = (process.env.OLLAMA_BASE_URL ?? "").replace(/\/$/, "");
    _client = new OpenAI({
      baseURL: `${base}/v1`,
      apiKey: "ollama", // Ollama ignores the key, but the SDK requires one.
      timeout: OLLAMA_TIMEOUT_MS,
      maxRetries: 1,
    });
  }
  return _client;
}

/* A refused connection means no local model is running — not a model error.
   A timeout is excluded: the server answered the connect and is just slow. */
function unreachableOr(e: unknown): unknown {
  if (e instanceof OpenAI.APIConnectionError && !(e instanceof OpenAI.APIConnectionTimeoutError)) {
    return new AIProviderUnreachableError(
      `Local AI (Ollama) isn't reachable at ${process.env.OLLAMA_BASE_URL}. Start it, or unset OLLAMA_BASE_URL to use OpenAI.`,
    );
  }
  return e;
}

class OllamaProvider implements AIProvider {
  async *stream(
    prompt: string,
    _model: AIModel,
    signal: AbortSignal,
  ): AsyncIterable<TokenChunk> {
    const sdkStream = await getOllamaClient()
      .chat.completions.create({
        model: OLLAMA_MODEL,
        stream: true,
        messages: [{ role: "user", content: prompt }],
      })
      .catch((e: unknown) => {
        throw unreachableOr(e);
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

  async generate(prompt: string, _model: AIModel): Promise<string> {
    const res = await getOllamaClient()
      .chat.completions.create({
        model: OLLAMA_MODEL,
        messages: [{ role: "user", content: prompt }],
      })
      .catch((e: unknown) => {
        throw unreachableOr(e);
      });
    return res.choices[0]?.message?.content ?? "";
  }
}

export const ollamaProvider: AIProvider = new OllamaProvider();

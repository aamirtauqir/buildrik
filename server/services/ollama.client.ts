import OpenAI from "openai";
import type { AIModel, AIProvider, TokenChunk } from "./types";

/**
 * Local Ollama provider via its OpenAI-compatible endpoint. Lets the editor run
 * AI features against a self-hosted model (e.g. qwen3.5, on Apple Silicon
 * qwen3.5:9b-mlx) with no paid API key. Enabled by setting OLLAMA_BASE_URL
 * (e.g. http://localhost:11434); the model name is OLLAMA_MODEL. The AIModel
 * passed in is the "ollama" placeholder — the real model name comes from env.
 */

export const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen3.5";

export function isOllamaConfigured(): boolean {
  return (process.env.OLLAMA_BASE_URL ?? "").length > 0;
}

let _client: OpenAI | undefined;
function getOllamaClient(): OpenAI {
  if (!_client) {
    const base = (process.env.OLLAMA_BASE_URL ?? "").replace(/\/$/, "");
    _client = new OpenAI({
      baseURL: `${base}/v1`,
      apiKey: "ollama", // Ollama ignores the key, but the SDK requires one.
    });
  }
  return _client;
}

class OllamaProvider implements AIProvider {
  async *stream(
    prompt: string,
    _model: AIModel,
    signal: AbortSignal,
  ): AsyncIterable<TokenChunk> {
    const sdkStream = await getOllamaClient().chat.completions.create({
      model: OLLAMA_MODEL,
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

  async generate(prompt: string, _model: AIModel): Promise<string> {
    const res = await getOllamaClient().chat.completions.create({
      model: OLLAMA_MODEL,
      messages: [{ role: "user", content: prompt }],
    });
    return res.choices[0]?.message?.content ?? "";
  }
}

export const ollamaProvider: AIProvider = new OllamaProvider();

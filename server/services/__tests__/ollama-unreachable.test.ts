// @vitest-environment node
/**
 * L5-001: with OLLAMA_BASE_URL set and nothing listening, every streamPrompt
 * flow failed as a generic INTERNAL "Edit generation failed" — indistinguishable
 * from a provider bug. A refused connection is now its own domain error, which
 * the router answers as PRECONDITION_FAILED (the panel's "not available" state).
 */
import { describe, it, expect, beforeAll } from "vitest";
import { AIProviderUnreachableError } from "@/server/services/types";

beforeAll(() => {
  // Port 1 on loopback: nothing listens, the connect is refused at once.
  process.env.OLLAMA_BASE_URL = "http://127.0.0.1:1";
});

describe("ollamaProvider with nothing listening", () => {
  it("generate throws AIProviderUnreachableError", async () => {
    const { ollamaProvider } = await import("@/server/services/ollama.client");
    await expect(ollamaProvider.generate("hi", "ollama")).rejects.toBeInstanceOf(AIProviderUnreachableError);
  }, 15_000);

  it("stream throws AIProviderUnreachableError", async () => {
    const { ollamaProvider } = await import("@/server/services/ollama.client");
    const run = async () => {
      for await (const _ of ollamaProvider.stream("hi", "ollama", new AbortController().signal)) void _;
    };
    await expect(run()).rejects.toBeInstanceOf(AIProviderUnreachableError);
  }, 15_000);
});

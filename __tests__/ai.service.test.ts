import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProvider } from "@server/services/ai.service";
import { openAIProvider } from "@server/services/openai.client";
import { ollamaProvider } from "@server/services/ollama.client";

vi.mock("openai", () => ({
  default: class MockOpenAI {
    chat = { completions: { create: vi.fn() } };
  },
}));

/**
 * There is one paid provider. This used to assert that `claude-*` models routed
 * to an AnthropicProvider — a provider we have never held a key for, naming
 * models that were not real Anthropic API ids. Both are gone.
 */
describe("getProvider", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "k";
  });

  it("routes gpt-* to the OpenAI provider", () => {
    expect(getProvider("gpt-4o-mini")).toBe(openAIProvider);
  });

  it("routes the local placeholder to the Ollama provider", () => {
    expect(getProvider("ollama")).toBe(ollamaProvider);
  });

  it("returns something that satisfies the provider contract", () => {
    const provider = getProvider("gpt-4o-mini");
    expect(typeof provider.stream).toBe("function");
    expect(typeof provider.generate).toBe("function");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProvider } from "@server/services/ai.service";
import { AnthropicProvider } from "@server/services/anthropic.client";

vi.mock("openai", () => ({
  default: class MockOpenAI {
    chat = { completions: { create: vi.fn() } };
  },
}));

describe("getProvider", () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "k";
    process.env.OPENAI_API_KEY = "k";
  });

  it("returns AnthropicProvider for claude-* models", () => {
    expect(getProvider("claude-opus-4-7")).toBeInstanceOf(AnthropicProvider);
    expect(getProvider("claude-sonnet-4-6")).toBeInstanceOf(AnthropicProvider);
    expect(getProvider("claude-haiku-4-5")).toBeInstanceOf(AnthropicProvider);
  });

  it("returns a non-Anthropic provider for gpt-* models", () => {
    const provider = getProvider("gpt-4o-mini");
    expect(provider).not.toBeInstanceOf(AnthropicProvider);
    expect(typeof provider.stream).toBe("function");
    expect(typeof provider.generate).toBe("function");
  });
});

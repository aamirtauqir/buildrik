import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnthropicProvider } from "@server/services/anthropic.client";

const mockStream = vi.fn();
vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { stream: mockStream },
  })),
}));

describe("AnthropicProvider", () => {
  beforeEach(() => {
    mockStream.mockReset();
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  it("yields text chunks from the SDK stream", async () => {
    async function* fakeStream() {
      yield { type: "content_block_delta", delta: { type: "text_delta", text: "Hello " } };
      yield { type: "content_block_delta", delta: { type: "text_delta", text: "world" } };
      yield { type: "message_stop" };
    }
    mockStream.mockReturnValueOnce(fakeStream());

    const provider = new AnthropicProvider();
    const ctrl = new AbortController();
    const chunks: string[] = [];
    for await (const chunk of provider.stream("hi", "claude-sonnet-4-6", ctrl.signal)) {
      if (chunk.type === "text" && chunk.text) chunks.push(chunk.text);
    }
    expect(chunks).toEqual(["Hello ", "world"]);
  });

  it("yields a done chunk at the end", async () => {
    async function* fakeStream() {
      yield { type: "content_block_delta", delta: { type: "text_delta", text: "x" } };
      yield { type: "message_stop" };
    }
    mockStream.mockReturnValueOnce(fakeStream());

    const provider = new AnthropicProvider();
    const ctrl = new AbortController();
    const types: string[] = [];
    for await (const chunk of provider.stream("hi", "claude-sonnet-4-6", ctrl.signal)) {
      types.push(chunk.type);
    }
    expect(types).toEqual(["text", "done"]);
  });

  it("aborts when signal is fired", async () => {
    async function* fakeStream() {
      yield { type: "content_block_delta", delta: { type: "text_delta", text: "a" } };
      await new Promise((r) => setTimeout(r, 50));
      yield { type: "content_block_delta", delta: { type: "text_delta", text: "b" } };
    }
    mockStream.mockReturnValueOnce(fakeStream());

    const provider = new AnthropicProvider();
    const ctrl = new AbortController();
    const collected: string[] = [];
    const reader = (async () => {
      for await (const chunk of provider.stream("hi", "claude-sonnet-4-6", ctrl.signal)) {
        if (chunk.type === "text" && chunk.text) collected.push(chunk.text);
      }
    })();
    setTimeout(() => ctrl.abort(), 10);
    await reader;
    expect(collected).toEqual(["a"]);
  });
});

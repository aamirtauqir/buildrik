import { describe, it, expect } from "vitest";
import { StreamPromptAIClient } from "../StreamPromptAIClient";

async function* stubStream(chunks: string[]): AsyncGenerator<string> {
  for (const c of chunks) yield c;
}

describe("StreamPromptAIClient", () => {
  it("accumulates streamed chunks into final string", async () => {
    const client = new StreamPromptAIClient({
      open: () => stubStream(["hel", "lo ", "world"]),
    });
    const out = await client.generate({ prompt: "hi" });
    expect(out).toBe("hello world");
  });

  it("forwards AbortSignal to the stream opener", async () => {
    const seen: Array<AbortSignal | undefined> = [];
    const ac = new AbortController();
    const client = new StreamPromptAIClient({
      open: ({ signal }) => {
        seen.push(signal);
        return stubStream(["ok"]);
      },
    });
    await client.generate({ prompt: "p", signal: ac.signal });
    expect(seen[0]).toBe(ac.signal);
  });

  it("propagates errors thrown mid-stream", async () => {
    async function* bombStream(): AsyncGenerator<string> {
      yield "partial";
      throw new Error("upstream boom");
    }
    const client = new StreamPromptAIClient({ open: () => bombStream() });
    await expect(client.generate({ prompt: "p" })).rejects.toThrow("upstream boom");
  });
});

import { describe, it, expect, vi } from "vitest";
import { createStreamPromptOpener } from "../createStreamPromptOpener";
import { StreamPromptAIClient } from "../StreamPromptAIClient";

type Chunk = { type: "text"; text: string } | { type: "edit"; edit: unknown } | { type: "done" };
type Callbacks = { onData: (c: Chunk) => void; onError: (e: { message?: string }) => void };

describe("createStreamPromptOpener", () => {
  it("yields only text chunks and terminates on 'done'", async () => {
    let cbs!: Callbacks;
    const subscribe = vi.fn((_args: unknown, callbacks: Callbacks) => {
      cbs = callbacks;
      // Emit chunks asynchronously to mimic real tRPC subscription
      queueMicrotask(() => {
        cbs.onData({ type: "text", text: "hel" });
        cbs.onData({ type: "edit", edit: { skipped: true } });
        cbs.onData({ type: "text", text: "lo" });
        cbs.onData({ type: "done" });
      });
      return { unsubscribe: vi.fn() };
    });

    const opener = createStreamPromptOpener({ subscribe });
    const client = new StreamPromptAIClient(opener);
    const out = await client.generate({ prompt: "hi" });

    expect(out).toBe("hello");
    expect(subscribe).toHaveBeenCalledOnce();
    expect(subscribe.mock.calls[0][0]).toMatchObject({
      prompt: "hi",
      scope: { kind: "page" },
    });
  });

  it("rejects with error message on onError", async () => {
    const subscribe = vi.fn((_args: unknown, callbacks: Callbacks) => {
      queueMicrotask(() => callbacks.onError({ message: "rate limited" }));
      return { unsubscribe: vi.fn() };
    });
    const opener = createStreamPromptOpener({ subscribe });
    const client = new StreamPromptAIClient(opener);

    await expect(client.generate({ prompt: "p" })).rejects.toThrow("rate limited");
  });

  it("unsubscribes when AbortSignal fires", async () => {
    const unsub = vi.fn();
    let cbs!: Callbacks;
    const subscribe = vi.fn((_args: unknown, callbacks: Callbacks) => {
      cbs = callbacks;
      // never emits 'done' on its own — abort must close it
      return { unsubscribe: unsub };
    });
    const opener = createStreamPromptOpener({ subscribe });
    const client = new StreamPromptAIClient(opener);

    const ac = new AbortController();
    const promise = client.generate({ prompt: "p", signal: ac.signal });
    // queueMicrotask so subscribe has registered abort listener
    await Promise.resolve();
    ac.abort();
    await promise;

    expect(unsub).toHaveBeenCalled();
  });

  it("threads model option through to subscribe", async () => {
    const subscribe = vi.fn((_args: unknown, callbacks: Callbacks) => {
      queueMicrotask(() => callbacks.onData({ type: "done" }));
      return { unsubscribe: vi.fn() };
    });
    const opener = createStreamPromptOpener({ subscribe, model: "sonnet" });
    const client = new StreamPromptAIClient(opener);
    await client.generate({ prompt: "p" });

    expect(subscribe.mock.calls[0][0]).toMatchObject({ model: "sonnet" });
  });
});

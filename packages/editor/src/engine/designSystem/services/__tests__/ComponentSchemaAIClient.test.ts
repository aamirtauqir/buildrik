import { describe, it, expect, vi } from "vitest";
import { ComponentSchemaAIClient } from "../ComponentSchemaAIClient";
import type { ComponentSchemaMutate } from "../ComponentSchemaAIClient";

describe("ComponentSchemaAIClient", () => {
  it("returns the raw string from the mutate function", async () => {
    const mutate = vi.fn<ComponentSchemaMutate>(async () => ({ raw: '{"componentTypeId":"x","variants":[],"bindings":{}}' }));
    const client = new ComponentSchemaAIClient({ mutate });
    const out = await client.generate({ prompt: "make a button" });

    expect(out).toBe('{"componentTypeId":"x","variants":[],"bindings":{}}');
    expect(mutate).toHaveBeenCalledWith({ prompt: "make a button" }, { signal: undefined });
  });

  it("forwards the AbortSignal to mutate", async () => {
    const mutate = vi.fn<ComponentSchemaMutate>(async () => ({ raw: "{}" }));
    const ac = new AbortController();
    const client = new ComponentSchemaAIClient({ mutate });
    await client.generate({ prompt: "p", signal: ac.signal });

    expect(mutate.mock.calls[0][1]).toEqual({ signal: ac.signal });
  });

  it("threads model option through", async () => {
    const mutate = vi.fn<ComponentSchemaMutate>(async () => ({ raw: "{}" }));
    const client = new ComponentSchemaAIClient({ mutate, model: "gpt-4o-mini" });
    await client.generate({ prompt: "p" });

    expect(mutate.mock.calls[0][0]).toEqual({ prompt: "p", model: "gpt-4o-mini" });
  });

  it("propagates mutate errors", async () => {
    const mutate = vi.fn(async () => {
      throw new Error("rate limit");
    });
    const client = new ComponentSchemaAIClient({ mutate });
    await expect(client.generate({ prompt: "p" })).rejects.toThrow("rate limit");
  });
});

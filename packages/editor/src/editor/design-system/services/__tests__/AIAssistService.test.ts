import { describe, it, expect, vi } from "vitest";
import { AIAssistService } from "../AIAssistService";
import type { AIClient } from "../AIAssistService";
import {
  AITimeoutError,
  AIInvalidSchemaError,
  AIPromptRejectedError,
} from "../aiErrors";
import type { EventEmitter } from "../../../../engine/EventEmitter";

function makeEvents() {
  return {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as EventEmitter & { emit: ReturnType<typeof vi.fn> };
}

const VALID_SCHEMA = {
  componentTypeId: "button",
  variants: [{ name: "primary", bindings: { bg: "color-primary" } }],
  bindings: { color: "color-text" },
};

describe("AIAssistService.generateComponentSchema", () => {
  it("returns parsed schema on valid AI JSON output", async () => {
    const client: AIClient = { generate: async () => JSON.stringify(VALID_SCHEMA) };
    const events = makeEvents();
    const svc = new AIAssistService(events, client);

    const result = await svc.generateComponentSchema("create a button");

    expect(result).toEqual(VALID_SCHEMA);
    expect(events.emit).toHaveBeenCalledWith("ai:generate:started", expect.any(Object));
    expect(events.emit).toHaveBeenCalledWith(
      "ai:generate:complete",
      expect.objectContaining({ componentTypeId: "button" })
    );
  });

  it("throws AIPromptRejectedError on empty prompt", async () => {
    const events = makeEvents();
    const svc = new AIAssistService(events, { generate: async () => "" });
    await expect(svc.generateComponentSchema("")).rejects.toBeInstanceOf(AIPromptRejectedError);
    await expect(svc.generateComponentSchema("   ")).rejects.toBeInstanceOf(AIPromptRejectedError);
  });

  it("throws AIPromptRejectedError when no client configured", async () => {
    const events = makeEvents();
    const svc = new AIAssistService(events, null);
    await expect(svc.generateComponentSchema("anything")).rejects.toBeInstanceOf(AIPromptRejectedError);
  });

  it("throws AIInvalidSchemaError on non-JSON AI output", async () => {
    const client: AIClient = { generate: async () => "not json at all" };
    const events = makeEvents();
    const svc = new AIAssistService(events, client);

    await expect(svc.generateComponentSchema("create x")).rejects.toBeInstanceOf(AIInvalidSchemaError);
    expect(events.emit).toHaveBeenCalledWith(
      "ai:generate:failed",
      expect.objectContaining({ error: "AIInvalidSchemaError" })
    );
  });

  it("throws AIInvalidSchemaError when shape missing required fields", async () => {
    const client: AIClient = {
      generate: async () => JSON.stringify({ componentTypeId: "button" }),
    };
    const events = makeEvents();
    const svc = new AIAssistService(events, client);
    await expect(svc.generateComponentSchema("create x")).rejects.toBeInstanceOf(AIInvalidSchemaError);
  });

  it("throws AITimeoutError when AI client exceeds timeoutMs", async () => {
    const client: AIClient = {
      generate: () => new Promise(() => { /* never resolves */ }),
    };
    const events = makeEvents();
    const svc = new AIAssistService(events, client);

    await expect(
      svc.generateComponentSchema("create x", { timeoutMs: 50 })
    ).rejects.toBeInstanceOf(AITimeoutError);
    expect(events.emit).toHaveBeenCalledWith(
      "ai:generate:failed",
      expect.objectContaining({ error: "AITimeoutError" })
    );
  });

  it("propagates underlying AIClient errors as-is when not a known error class", async () => {
    const underlying = new Error("network down");
    const client: AIClient = { generate: async () => { throw underlying; } };
    const events = makeEvents();
    const svc = new AIAssistService(events, client);

    await expect(svc.generateComponentSchema("create x")).rejects.toBe(underlying);
    expect(events.emit).toHaveBeenCalledWith(
      "ai:generate:failed",
      expect.objectContaining({ error: "Error" })
    );
  });

  it("emits started → complete events in order on success", async () => {
    const client: AIClient = { generate: async () => JSON.stringify(VALID_SCHEMA) };
    const events = makeEvents();
    const svc = new AIAssistService(events, client);

    await svc.generateComponentSchema("button");

    const calls = events.emit.mock.calls.map((c) => c[0]);
    expect(calls.indexOf("ai:generate:started")).toBeLessThan(calls.indexOf("ai:generate:complete"));
  });
});

/**
 * runPromptOnce — the promise wrapper over the ai.streamPrompt subscription.
 * The subscription client is stubbed so each test drives the link callbacks
 * the way @trpc/client's httpSubscriptionLink does.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

interface Handlers {
  onData: (chunk: unknown) => void;
  onError: (err: unknown) => void;
  onConnectionStateChange: (state: unknown) => void;
}

const unsubscribe = vi.fn();
let handlers: Handlers | null = null;
const subscribe = vi.fn((_input: unknown, h: Handlers) => {
  handlers = h;
  return { unsubscribe };
});
vi.mock("@/services/ai/subscriptionClient", () => ({
  getAiSubscriptionClient: () => ({ ai: { streamPrompt: { subscribe } } }),
}));

import { runPromptOnce, AiRunError } from "../runPromptOnce";

const args = { prompt: "p", scope: { kind: "page" as const }, model: "gpt-4o-mini" as const, intent: "style-command" as const };

beforeEach(() => {
  handlers = null;
  subscribe.mockClear();
  unsubscribe.mockClear();
});

describe("runPromptOnce", () => {
  it("resolves with the edit on done and unsubscribes", async () => {
    const p = runPromptOnce(args);
    const edit = { target: "page", summary: "1 change", rows: [], applyOps: { preview: {}, commit: {} } };
    handlers!.onData({ type: "edit", edit });
    handlers!.onData({ type: "done" });
    await expect(p).resolves.toEqual({ text: "", edit, plan: null });
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  describe("abort", () => {
    it("unsubscribes and rejects when the signal aborts mid-flight", async () => {
      const ac = new AbortController();
      const p = runPromptOnce({ ...args, signal: ac.signal });
      ac.abort();
      await expect(p).rejects.toBeInstanceOf(AiRunError);
      expect(unsubscribe).toHaveBeenCalledTimes(1);
      // A late chunk after the abort is ignored, not resolved.
      handlers!.onData({ type: "done" });
      expect(unsubscribe).toHaveBeenCalledTimes(1);
    });

    it("never subscribes when the signal is already aborted", async () => {
      const ac = new AbortController();
      ac.abort();
      await expect(runPromptOnce({ ...args, signal: ac.signal })).rejects.toBeInstanceOf(AiRunError);
      expect(subscribe).not.toHaveBeenCalled();
    });
  });

  describe("reconnects", () => {
    /* The link turns a server INTERNAL_SERVER_ERROR into a "connecting" state
       and reconnects, which RE-RUNS the procedure (a second provider call).
       The server already answered: fail on the first one. */
    it("fails on the first server error instead of letting the link re-run the procedure", async () => {
      const p = runPromptOnce(args);
      handlers!.onConnectionStateChange({
        state: "connecting",
        error: { message: "Edit generation failed", data: { code: "INTERNAL_SERVER_ERROR" } },
      });
      await expect(p).rejects.toMatchObject({ message: "Edit generation failed", kind: "other" });
      expect(unsubscribe).toHaveBeenCalledTimes(1);
    });

    it("tolerates one transport blip (no server answer) before failing", async () => {
      const p = runPromptOnce(args);
      handlers!.onConnectionStateChange({ state: "connecting", error: { message: "network" } });
      expect(unsubscribe).not.toHaveBeenCalled();
      handlers!.onConnectionStateChange({ state: "connecting", error: { message: "network" } });
      await expect(p).rejects.toBeInstanceOf(AiRunError);
      expect(unsubscribe).toHaveBeenCalledTimes(1);
    });
  });
});

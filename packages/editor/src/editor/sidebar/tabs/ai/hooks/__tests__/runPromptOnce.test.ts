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

import { runPromptOnce, AiRunError, AI_URL_BUDGET } from "../runPromptOnce";

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

/* L2-037: the subscription is an SSE GET, so the whole input rides in the URL.
   A site with a full brand token set sent ~17 KB (9.5 KB of tokens) and the
   server refused the request line — 431 — which the panel can only draw as
   "The AI service didn't respond". The scope is trimmed to fit, recall lists
   first (tokens, then assets), the site's own tokens kept longest. */
describe("runPromptOnce — the request fits in a URL (L2-037)", () => {
  const token = (i: number) => ({ id: `tok-${i}`, name: `Colour ${i} long descriptive name`, value: "#1A56DB", type: "color" });
  const asset = (i: number) => ({ id: `a-${i}`, url: `https://example.com/media/${"x".repeat(60)}-${i}.jpg`, name: `asset ${i}` });
  const encodedLength = (input: unknown) => encodeURIComponent(JSON.stringify(input)).length;

  it("leaves a small scope untouched", () => {
    const scope = { kind: "element" as const, id: "el-1", tokens: [token(1)], assets: [asset(1)] };
    void runPromptOnce({ ...args, scope });
    expect(subscribe.mock.calls[0][0]).toMatchObject({ scope });
  });

  it("trims recall lists until the encoded input fits the budget, keeping the first tokens", () => {
    const scope = {
      kind: "element" as const,
      id: "el-1",
      context: { type: "heading", text: "Product Designer" },
      tokens: Array.from({ length: 120 }, (_, i) => token(i)),
      assets: Array.from({ length: 100 }, (_, i) => asset(i)),
    };
    expect(encodedLength(scope)).toBeGreaterThan(AI_URL_BUDGET);
    void runPromptOnce({ ...args, scope });
    const sent = subscribe.mock.calls[0][0] as { scope: typeof scope };
    expect(encodedLength(sent)).toBeLessThanOrEqual(AI_URL_BUDGET);
    expect(sent.scope.id).toBe("el-1");
    expect(sent.scope.context).toEqual(scope.context);
    expect(sent.scope.tokens.length).toBeGreaterThan(0);
    expect(sent.scope.tokens[0]).toEqual(token(0));
  });
});

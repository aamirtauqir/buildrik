/**
 * A provider failure must reach the user, not loop forever.
 *
 * tRPC's SSE client lists INTERNAL_SERVER_ERROR in `retryableRpcCodes`
 * (@trpc/server codes), so it answers that code by moving the connection back
 * to "connecting" and reopening the stream — `onError` is never called. Every
 * provider failure arrives with exactly that code, because the `streamPrompt`
 * generator rethrows whatever OpenAI/Ollama threw.
 *
 * Measured against a real dev server before the fix: one EventSource, five
 * opens, five errors, zero data chunks, sixteen seconds, and the panel still
 * reading "Thinking…". The raw SSE body carried
 * `event: serialized-error … "code":"INTERNAL_SERVER_ERROR" … "Connection error."`
 * from `OllamaProvider.stream`.
 *
 * @license BSD-3-Clause
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const subscribe = vi.fn();
vi.mock("@/services/ai/subscriptionClient", () => ({
  getAiSubscriptionClient: () => ({ ai: { streamPrompt: { subscribe } } }),
}));

import { useStreamPrompt } from "../useStreamPrompt";

const ARGS = { prompt: "Make the hero warmer", scope: { kind: "page" as const }, model: "gpt-4o-mini" as const };

/** Hand back the observer the hook registered, plus a spy on unsubscribe. */
function capture() {
  const unsubscribe = vi.fn();
  subscribe.mockImplementation((_input: unknown, obs: Record<string, (a: unknown) => void>) => {
    (capture as unknown as { obs: typeof obs }).obs = obs;
    return { unsubscribe };
  });
  return { unsubscribe, get obs() { return (capture as unknown as { obs: Record<string, (a: unknown) => void> }).obs; } };
}

beforeEach(() => subscribe.mockReset());

describe("useStreamPrompt — a retryable server error still reaches the user", () => {
  it("surfaces the error once the reconnect budget is spent", () => {
    const cap = capture();
    const { result } = renderHook(() => useStreamPrompt());
    act(() => result.current.start(ARGS));
    expect(result.current.streaming).toBe(true);

    // The link reports a retryable failure as a move BACK to "connecting"
    // carrying the error — this is what an INTERNAL_SERVER_ERROR looks like.
    act(() => cap.obs.onConnectionStateChange({ state: "connecting", error: { message: "Connection error." } }));
    expect(result.current.streaming, "one blip is allowed to retry").toBe(true);

    act(() => cap.obs.onConnectionStateChange({ state: "connecting", error: { message: "Connection error." } }));
    expect(result.current.streaming).toBe(false);
    expect(result.current.errorKind).toBe("other");
    expect(result.current.error).toBe("Connection error.");
  });

  it("stops the subscription instead of leaving it reconnecting", () => {
    const cap = capture();
    const { result } = renderHook(() => useStreamPrompt());
    act(() => result.current.start(ARGS));
    act(() => cap.obs.onConnectionStateChange({ state: "connecting", error: { message: "x" } }));
    act(() => cap.obs.onConnectionStateChange({ state: "connecting", error: { message: "x" } }));
    expect(cap.unsubscribe).toHaveBeenCalled();
  });

  it("ignores the connecting state the link emits with no error", () => {
    const cap = capture();
    const { result } = renderHook(() => useStreamPrompt());
    act(() => result.current.start(ARGS));
    act(() => cap.obs.onConnectionStateChange({ state: "connecting", error: null }));
    act(() => cap.obs.onConnectionStateChange({ state: "connecting", error: null }));
    act(() => cap.obs.onConnectionStateChange({ state: "pending", error: null }));
    expect(result.current.streaming).toBe(true);
    expect(result.current.errorKind).toBeNull();
  });

  it("gives each prompt its own budget", () => {
    const cap = capture();
    const { result } = renderHook(() => useStreamPrompt());
    act(() => result.current.start(ARGS));
    act(() => cap.obs.onConnectionStateChange({ state: "connecting", error: { message: "x" } }));

    act(() => result.current.start(ARGS));
    act(() => cap.obs.onConnectionStateChange({ state: "connecting", error: { message: "x" } }));
    expect(result.current.streaming, "the previous prompt's retry must not count here").toBe(true);
  });

  it("still lets a non-retryable error through onError untouched", () => {
    const cap = capture();
    const { result } = renderHook(() => useStreamPrompt());
    act(() => result.current.start(ARGS));
    act(() => cap.obs.onError({ message: "Daily limit reached (20).", data: { code: "TOO_MANY_REQUESTS" } }));
    expect(result.current.errorKind).toBe("quota");
    expect(result.current.streaming).toBe(false);
  });
});

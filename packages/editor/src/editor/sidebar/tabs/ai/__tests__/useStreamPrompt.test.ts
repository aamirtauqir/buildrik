import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useStreamPrompt } from "../hooks/useStreamPrompt";

const subscribe = vi.fn();
vi.mock("@/services/ai/subscriptionClient", () => ({
  getAiSubscriptionClient: () => ({
    ai: {
      streamPrompt: { subscribe: (...args: unknown[]) => subscribe(...args) },
    },
  }),
}));

describe("useStreamPrompt", () => {
  beforeEach(() => { subscribe.mockReset(); });

  it("appends text chunks to the streaming message", async () => {
    let onData: (c: { type: string; text?: string }) => void = () => {};
    subscribe.mockImplementation((_input: unknown, opts: { onData: typeof onData }) => {
      onData = opts.onData;
      return { unsubscribe: vi.fn() };
    });
    const { result } = renderHook(() => useStreamPrompt());
    act(() => { result.current.start({ prompt: "hi", scope: { kind: "page" }, model: "claude-sonnet-4-6" }); });
    act(() => { onData({ type: "text", text: "Hello " }); });
    act(() => { onData({ type: "text", text: "world" }); });
    await waitFor(() => expect(result.current.text).toBe("Hello world"));
  });

  it("transitions streaming false when 'done' chunk arrives", async () => {
    let onData: (c: { type: string }) => void = () => {};
    subscribe.mockImplementation((_input: unknown, opts: { onData: typeof onData }) => {
      onData = opts.onData;
      return { unsubscribe: vi.fn() };
    });
    const { result } = renderHook(() => useStreamPrompt());
    act(() => { result.current.start({ prompt: "hi", scope: { kind: "page" }, model: "claude-sonnet-4-6" }); });
    expect(result.current.streaming).toBe(true);
    act(() => { onData({ type: "done" }); });
    await waitFor(() => expect(result.current.streaming).toBe(false));
  });

  it("stop() aborts and unsubscribes", async () => {
    const unsubscribe = vi.fn();
    subscribe.mockImplementation(() => ({ unsubscribe }));
    const { result } = renderHook(() => useStreamPrompt());
    act(() => { result.current.start({ prompt: "hi", scope: { kind: "page" }, model: "claude-sonnet-4-6" }); });
    act(() => { result.current.stop(); });
    expect(unsubscribe).toHaveBeenCalled();
    expect(result.current.streaming).toBe(false);
    expect(result.current.stopped).toBe(true);
  });

  it("captures the edit chunk and returns it on done", async () => {
    let onData: (c: { type: string; edit?: { target: string; summary: string; rows: never[]; applyOps: { preview: object; commit: object } } }) => void = () => {};
    subscribe.mockImplementation((_input: unknown, opts: { onData: typeof onData }) => {
      onData = opts.onData;
      return { unsubscribe: vi.fn() };
    });
    const { result } = renderHook(() => useStreamPrompt());
    act(() => { result.current.start({ prompt: "hi", scope: { kind: "page" }, model: "claude-sonnet-4-6" }); });
    const serverEdit = { target: "Hero.copy", summary: "tighten", rows: [], applyOps: { preview: {}, commit: {} } };
    act(() => { onData({ type: "edit", edit: serverEdit }); });
    act(() => { onData({ type: "done" }); });
    await waitFor(() => expect(result.current.edit).toMatchObject({ ...serverEdit, state: "pending" }));
  });
});

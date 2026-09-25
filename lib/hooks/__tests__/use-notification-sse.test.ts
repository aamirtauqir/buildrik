/**
 * D-13: the SSE reconnect was a fixed 5s retry forever, including once the
 * session had expired — the /api/sse/notifications route requires auth, so
 * a signed-out tab retried a request that could never succeed, once every
 * 5 seconds, indefinitely. Backoff now grows (5s, 10s, 20s, ... capped at
 * 60s, plus jitter) and a stopped tab checks /api/auth/session before
 * reconnecting and gives up once there's no session.
 *
 * No @testing-library/react — see use-debounced-value.test.ts for why.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createElement } from "react";

// trpc.useUtils() just needs to return something with the two invalidate
// calls the hook fires on "unread" — not exercised directly by these cases.
vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    useUtils: () => ({
      notifications: {
        unreadCount: { invalidate: vi.fn() },
        recent: { invalidate: vi.fn() },
      },
    }),
  },
}));

import { useNotificationSSE } from "../use-notification-sse";

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  onerror: (() => void) | null = null;
  listeners: Record<string, (() => void)[]> = {};
  closed = false;
  constructor(public url: string) {
    FakeEventSource.instances.push(this);
  }
  addEventListener(type: string, cb: () => void) {
    (this.listeners[type] ??= []).push(cb);
  }
  close() { this.closed = true; }
  fail() { this.onerror?.(); }
}

function mount() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  function Harness() { useNotificationSSE(); return null; }
  act(() => root.render(createElement(Harness)));
  return { unmount: () => act(() => root.unmount()) };
}

describe("useNotificationSSE reconnect", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeEventSource.instances = [];
    // @ts-expect-error test stub
    global.EventSource = FakeEventSource;
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ user: { id: "u1" } }),
    }) as unknown as typeof fetch;
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("backs off with a growing delay instead of a fixed 5s retry", async () => {
    const hook = mount();
    await act(async () => { await Promise.resolve(); });
    expect(FakeEventSource.instances).toHaveLength(1);

    FakeEventSource.instances[0].fail();
    // First retry: base 5000ms * 2^0, with jitter in [0.5, 1] -> [2500, 5000).
    await act(async () => { vi.advanceTimersByTime(2499); await Promise.resolve(); });
    expect(FakeEventSource.instances).toHaveLength(1);
    await act(async () => { vi.advanceTimersByTime(2600); await Promise.resolve(); });
    expect(FakeEventSource.instances).toHaveLength(2);

    FakeEventSource.instances[1].fail();
    // Second retry window has doubled: base * 2^1, floor 5000ms even with
    // minimum jitter — strictly more than the first window ever needed.
    await act(async () => { vi.advanceTimersByTime(4999); await Promise.resolve(); });
    expect(FakeEventSource.instances).toHaveLength(2);

    hook.unmount();
  });

  it("resets the backoff counter once a connection opens successfully", async () => {
    const hook = mount();
    await act(async () => { await Promise.resolve(); });
    const first = FakeEventSource.instances[0];
    first.fail();
    await act(async () => { vi.advanceTimersByTime(10000); await Promise.resolve(); });
    expect(FakeEventSource.instances).toHaveLength(2);

    // Signal a successful open — this should reset attempt back to 0, so the
    // NEXT failure's retry window is short again (base delay), not doubled.
    FakeEventSource.instances[1].listeners["open"]?.forEach((cb) => cb());
    FakeEventSource.instances[1].fail();
    await act(async () => { vi.advanceTimersByTime(4999); await Promise.resolve(); });
    // Minimum jitter floor is 2500ms, so by 4999ms a reset-to-base retry must
    // already have fired.
    expect(FakeEventSource.instances).toHaveLength(3);

    hook.unmount();
  });

  it("stops reconnecting once the session is gone", async () => {
    const hook = mount();
    await act(async () => { await Promise.resolve(); });
    FakeEventSource.instances[0].fail();
    await act(async () => { vi.advanceTimersByTime(5000); await Promise.resolve(); });
    expect(FakeEventSource.instances).toHaveLength(2);

    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ user: null }) }) as unknown as typeof fetch;
    FakeEventSource.instances[1].fail();
    await act(async () => { vi.advanceTimersByTime(60000); await Promise.resolve(); });
    // No third connection — the session check found nobody logged in.
    expect(FakeEventSource.instances).toHaveLength(2);

    hook.unmount();
  });
});

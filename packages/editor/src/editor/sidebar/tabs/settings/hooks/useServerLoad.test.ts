/**
 * useServerLoad — the state machine behind every S1 screen's load card. The
 * screens' own tests drive loading / error / Try again through the UI; this
 * covers what they cannot see: the stale guard and the no-site path.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@/services/api-client", () => ({
  getBuildrikClient: () => ({}),
}));

import { useServerLoad } from "./useServerLoad";

describe("useServerLoad", () => {
  it("is ready at once with no site to read, and reports it", () => {
    const read = vi.fn();
    const onLoadStateChange = vi.fn();
    const { result } = renderHook(() =>
      useServerLoad(null, read, () => {}, { onLoadStateChange }),
    );
    expect(result.current.state).toBe("ready");
    expect(read).not.toHaveBeenCalled();
    expect(onLoadStateChange).toHaveBeenCalledWith("ready");
  });

  it("reports loading, applies the row, then reports ready", async () => {
    let resolve!: (row: { name: string }) => void;
    const read = vi.fn(() => new Promise<{ name: string }>((r) => { resolve = r; }));
    const apply = vi.fn();
    const onLoadStateChange = vi.fn();
    const { result } = renderHook(() => useServerLoad("s1", read, apply, { onLoadStateChange }));

    expect(result.current.state).toBe("loading");
    expect(onLoadStateChange).toHaveBeenLastCalledWith("loading");
    await act(async () => { resolve({ name: "Acme" }); });
    expect(apply).toHaveBeenCalledWith({ name: "Acme" });
    expect(result.current.state).toBe("ready");
    expect(onLoadStateChange).toHaveBeenLastCalledWith("ready");
  });

  /* A read that lands after the screen is gone — or after a retry started a
     newer one — must not write into a field the user is no longer looking at. */
  it("drops a result that lands after unmount", async () => {
    let resolve!: (row: unknown) => void;
    const read = vi.fn(() => new Promise((r) => { resolve = r; }));
    const apply = vi.fn();
    const onLoadStateChange = vi.fn();
    const { unmount } = renderHook(() => useServerLoad("s1", read, apply, { onLoadStateChange }));
    unmount();
    await act(async () => { resolve({}); });
    expect(apply).not.toHaveBeenCalled();
    expect(onLoadStateChange).not.toHaveBeenCalledWith("ready");
  });

  it("retry re-reads and a newer read supersedes the older one", async () => {
    const resolvers: Array<(row: { n: number }) => void> = [];
    const read = vi.fn(() => new Promise<{ n: number }>((r) => { resolvers.push(r); }));
    const apply = vi.fn();
    const { result } = renderHook(() => useServerLoad("s1", read, apply, {}));

    act(() => result.current.retry());
    expect(read).toHaveBeenCalledTimes(2);
    await act(async () => { resolvers[0]({ n: 1 }); });
    expect(apply).not.toHaveBeenCalled();
    await act(async () => { resolvers[1]({ n: 2 }); });
    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledWith({ n: 2 });
    expect(result.current.state).toBe("ready");
  });

  it("registers its retry with the shell and clears it on unmount", () => {
    const registerRetryLoad = vi.fn();
    const { result, unmount } = renderHook(() =>
      useServerLoad("s1", () => new Promise(() => {}), () => {}, { registerRetryLoad }),
    );
    expect(registerRetryLoad).toHaveBeenCalledWith(result.current.retry);
    unmount();
    expect(registerRetryLoad).toHaveBeenLastCalledWith(null);
  });
});

/* L3-035 (owner, 2026-10-10): one silent auto-retry for a transient read, a
   failure that names auth/permission problems for what they are, and the
   loaded data kept on screen while a retry runs. */
describe("useServerLoad · L3-035 failure handling", () => {
  const trpcError = (code: string, httpStatus: number) =>
    Object.assign(new Error(code), { data: { code, httpStatus } });

  it("retries a transient failure once, silently, and lands ready", async () => {
    vi.useFakeTimers();
    try {
      const read = vi
        .fn()
        .mockRejectedValueOnce(trpcError("INTERNAL_SERVER_ERROR", 500))
        .mockResolvedValueOnce({ ok: true });
      const apply = vi.fn();
      const onLoadStateChange = vi.fn();
      const { result } = renderHook(() => useServerLoad("s1", read, apply, { onLoadStateChange }));
      await act(async () => { await Promise.resolve(); });
      expect(result.current.state).toBe("loading");
      expect(onLoadStateChange).not.toHaveBeenCalledWith("error");
      await act(async () => { await vi.runAllTimersAsync(); });
      expect(read).toHaveBeenCalledTimes(2);
      expect(apply).toHaveBeenCalledWith({ ok: true });
      expect(result.current.state).toBe("ready");
      expect(onLoadStateChange).not.toHaveBeenCalledWith("error");
    } finally {
      vi.useRealTimers();
    }
  });

  it("a network failure that fails twice reports the generic failure, once retried", async () => {
    vi.useFakeTimers();
    try {
      const read = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
      const { result } = renderHook(() => useServerLoad("s1", read, () => {}, {}));
      await act(async () => { await vi.runAllTimersAsync(); });
      expect(read).toHaveBeenCalledTimes(2);
      expect(result.current.state).toBe("error");
      expect(result.current.failure).toBe("failed");
    } finally {
      vi.useRealTimers();
    }
  });

  it("an auth or permission refusal is not retried and says which it is", async () => {
    const signedOut = vi.fn().mockRejectedValue(trpcError("UNAUTHORIZED", 401));
    const a = renderHook(() => useServerLoad("s1", signedOut, () => {}, {}));
    await act(async () => { await Promise.resolve(); });
    expect(signedOut).toHaveBeenCalledTimes(1);
    expect(a.result.current.state).toBe("error");
    expect(a.result.current.failure).toBe("signed-out");

    const forbidden = vi.fn().mockRejectedValue(trpcError("FORBIDDEN", 403));
    const b = renderHook(() => useServerLoad("s1", forbidden, () => {}, {}));
    await act(async () => { await Promise.resolve(); });
    expect(forbidden).toHaveBeenCalledTimes(1);
    expect(b.result.current.failure).toBe("forbidden");
  });

  it("a retry after a successful load keeps the loaded screen instead of a loading card", async () => {
    const resolvers: Array<(row: { n: number }) => void> = [];
    const read = vi.fn(() => new Promise<{ n: number }>((r) => { resolvers.push(r); }));
    const { result } = renderHook(() => useServerLoad("s1", read, () => {}, {}));
    await act(async () => { resolvers[0]({ n: 1 }); });
    expect(result.current.state).toBe("ready");
    act(() => result.current.retry());
    expect(result.current.state).toBe("ready");
  });
});

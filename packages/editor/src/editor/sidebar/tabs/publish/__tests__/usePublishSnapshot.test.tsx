// @vitest-environment jsdom
/**
 * usePublishSnapshot — board 641:2652's "SINCE LAST DEPLOY" claim.
 *
 * The section's entire claim is "what would go out if you published now", so a
 * count that does not move when the user edits is worse than no count.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

const fetchPublishHistory = vi.fn();
vi.mock("@/services/PublishService", () => ({
  fetchPublishHistory: (siteId: string) => fetchPublishHistory(siteId),
}));

import { usePublishSnapshot } from "../usePublishSnapshot";

type Entry = { id: string; label: string; timestamp: number };

function makeComposer(stack: Entry[]) {
  const handlers = new Map<string, Set<() => void>>();
  return {
    on: (ev: string, fn: () => void) => {
      if (!handlers.has(ev)) handlers.set(ev, new Set());
      handlers.get(ev)!.add(fn);
    },
    off: (ev: string, fn: () => void) => handlers.get(ev)?.delete(fn),
    /** Drives the real signal: the engine announces every stack change. */
    emit: (ev: string) => handlers.get(ev)?.forEach((fn) => fn()),
    history: { getHistoryStack: () => stack },
    elements: { getAllPages: () => [{ id: "p1" }] },
  } as never;
}

beforeEach(() => {
  fetchPublishHistory.mockReset().mockResolvedValue([]);
});

describe("usePublishSnapshot — the change list tracks the undo stack", () => {
  it("recounts after an edit lands", async () => {
    const stack: Entry[] = [{ id: "e1", label: "First edit", timestamp: Date.now() }];
    const composer = makeComposer(stack);

    const { result, rerender } = renderHook(() => usePublishSnapshot(composer, "site_1", null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.changeCount).toBe(1);

    /* The user edits: the engine pushes onto the same stack the panel reads
       and announces it. A re-render alone must NOT be what makes the number
       right — that was the bug (a memo keyed on deps the stack never touches). */
    stack.unshift({ id: "e2", label: "Second edit", timestamp: Date.now() });
    act(() => {
      (composer as unknown as { emit(e: string): void }).emit("history:recorded");
    });
    rerender();

    expect(result.current.changeCount).toBe(2);
    expect(result.current.changes.map((c) => c.label)).toContain("Second edit");
  });

  it("counts only what came after the last deploy", async () => {
    const deployedAt = new Date("2026-08-14T10:00:00Z");
    fetchPublishHistory.mockResolvedValue([
      { id: "j1", version: 4, completedAt: deployedAt, deploymentId: "d", rollbackable: true, rolledBackFrom: null },
    ]);
    const composer = makeComposer([
      { id: "after", label: "After deploy", timestamp: deployedAt.getTime() + 1000 },
      { id: "before", label: "Before deploy", timestamp: deployedAt.getTime() - 1000 },
    ]);

    const { result } = renderHook(() => usePublishSnapshot(composer, "site_1", null));

    await waitFor(() => expect(result.current.lastDeploy?.version).toBe(4));
    expect(result.current.changeCount).toBe(1);
    expect(result.current.changes[0].label).toBe("After deploy");
  });
});

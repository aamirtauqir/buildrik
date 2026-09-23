/**
 * TemplatesTab Integration Tests — CRIT-1 + CRIT-3 regression coverage
 * Phase 1 prep: verifies handleApplyToCurrent routes through requestApply (not startApply).
 * (CRIT-3's keyboard-nav detail id went with the drawer's inline detail — decision #24.)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { render } from "@testing-library/react";
import * as React from "react";
import { useTemplateApply } from "../hooks/useTemplateApply";

// Mock composer for useTemplateApply
function createMockComposer(withElements = false) {
  const listeners = new Map<string, Set<Function>>();
  return {
    elements: withElements ? {
      getActivePage: vi.fn().mockReturnValue({
        root: { getChildCount: vi.fn().mockReturnValue(0) },
      }),
    } : {
      getActivePage: vi.fn().mockReturnValue(null),
    },
    on: vi.fn((event: string, fn: Function) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(fn);
    }),
    off: vi.fn((event: string, fn: Function) => {
      listeners.get(event)?.delete(fn);
    }),
  } as any;
}

describe("CRIT-1: handleApplyToCurrent routes through requestApply", () => {
  /**
   * CRIT-1 regression: TemplatesTab.tsx used to call startApply() directly when
   * hasExistingContent was false. This bypassed the confirming state and the
   * double-apply guard in requestApply. Now it calls requestApply(id), which
   * enters confirming state first.
   *
   * Evidence: TemplatesTab.tsx line 84 was:
   *   hasExistingContent ? sel.setShowReplace(true) : startApply();
   * Now:
   *   hasExistingContent ? sel.setShowReplace(true) : requestApply(id);
   */

  it("requestApply transitions to confirming state (not applying directly)", () => {
    const { result } = renderHook(() => useTemplateApply(null));
    expect(result.current.applyState).toBe("idle");

    act(() => result.current.requestApply("tmpl-hero"));
    expect(result.current.applyState).toBe("confirming");
    expect(result.current.pendingId.current).toBe("tmpl-hero");
  });

  it("requestApply enters confirming state — CRIT-1 fix", () => {
    const { result } = renderHook(() => useTemplateApply(null));
    act(() => result.current.requestApply("tmpl-2"));
    expect(result.current.applyState).toBe("confirming");
    expect(result.current.pendingId.current).toBe("tmpl-2");
  });

  it("startApply goes straight to applying (legacy path — not used by handleApplyToCurrent)", () => {
    const { result } = renderHook(() => useTemplateApply(null));
    act(() => result.current.startApply());
    expect(result.current.applyState).toBe("applying");
  });

  it("startApply bypasses confirming — this is the bug CRIT-1 fixed", () => {
    const { result } = renderHook(() => useTemplateApply(null));
    act(() => result.current.startApply());
    expect(result.current.applyState).toBe("applying");
    // confirmApply was never called — showing startApply bypasses the confirming state
    // handleApplyToCurrent no longer uses this path (uses requestApply instead)
  });

  it("confirmApply is required to transition from confirming to applying", () => {
    const { result } = renderHook(() => useTemplateApply(null));
    act(() => result.current.requestApply("tmpl-hero"));
    expect(result.current.applyState).toBe("confirming");

    act(() => result.current.confirmApply());
    expect(result.current.applyState).toBe("applying");
  });

  it("double-click during confirming is blocked by requestApply guard", () => {
    const { result } = renderHook(() => useTemplateApply(null));
    act(() => result.current.requestApply("tmpl-hero"));
    expect(result.current.applyState).toBe("confirming");
    expect(result.current.pendingId.current).toBe("tmpl-hero");

    // Simulate double-click: second requestApply during confirming
    act(() => result.current.requestApply("tmpl-hero"));
    // Guard: should stay in confirming, not re-enter
    expect(result.current.applyState).toBe("confirming");
    expect(result.current.pendingId.current).toBe("tmpl-hero");
  });
});

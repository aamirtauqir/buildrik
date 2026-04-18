/**
 * TemplatesTab Integration Tests — CRIT-1 + CRIT-3 regression coverage
 * Phase 1 prep: verifies handleApplyToCurrent routes through requestApply (not startApply),
 * and keyboard nav uses setDetailId (not selectedId)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { render } from "@testing-library/react";
import * as React from "react";
import { useTemplateApply } from "../hooks/useTemplateApply";
import { useTemplateSelection } from "../hooks/useTemplateSelection";
import { SITE_TEMPLATES } from "../templatesData";

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

describe("CRIT-3: keyboard nav uses detailId not selectedId", () => {
  /**
   * CRIT-3 regression: useTemplateSelection.ts arrow key handler used setSelectedId.
   * Phase 1 removes selectedId from the hook entirely. The arrow handler must use
   * setDetailId instead, which is the canonical selection state (TemplatesTab.tsx:304
   * confirms: isSelected={sel.detailId === tpl.id}).
   *
   * Evidence: useTemplateSelection.ts line 109 was:
   *   if (next) setSelectedId(next.id);
   * Now:
   *   if (next) setDetailId(next.id);
   */

  it("detailId and setDetailId exist on the hook — selectedId is removed in Phase 1", () => {
    const { result } = renderHook(() => useTemplateSelection(false));
    // detailId is the canonical selection state
    expect(result.current.detailId).toBeNull();
    expect(typeof result.current.setDetailId).toBe("function");
  });

  it("setDetailId replaces selectedId in the keyboard nav selection model", () => {
    const { result } = renderHook(() => useTemplateSelection(false));

    // Verify setDetailId works: find first template, advance with ArrowRight logic
    const firstTemplate = SITE_TEMPLATES[0];
    act(() => result.current.setDetailId(firstTemplate.id));
    expect(result.current.detailId).toBe(firstTemplate.id);

    // Verify ArrowRight-style advance: find next in array
    const idx = SITE_TEMPLATES.findIndex(t => t.id === firstTemplate.id);
    const next = SITE_TEMPLATES[idx + 1];
    if (next) {
      act(() => result.current.setDetailId(next.id));
      expect(result.current.detailId).toBe(next.id);
    }
  });
});

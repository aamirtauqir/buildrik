/**
 * L1-029 (owner, 2026-10-10): ONE tip queue owns every automatic tip.
 *   - at most one automatic tip per session;
 *   - shown only when the user is idle (no input for TIP_IDLE_MS, no button
 *     held, no editor popup open);
 *   - never takes focus;
 *   - seen/dismissed persisted with the L1-015 per-site state;
 *   - dismissing a tip completes no checklist step.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, renderHook, act, fireEvent } from "@testing-library/react";

const svc = vi.hoisted(() => ({ markEditorTip: vi.fn(async () => null) }));
vi.mock("@/services/OnboardingService", () => svc);

import { useAutoTip, primeTipQueue, resetTipQueueForTests, TIP_IDLE_MS } from "../tipQueue";

const SITE = "site-1";

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  sessionStorage.clear();
  resetTipQueueForTests();
});
afterEach(() => vi.useRealTimers());

function idle(ms = TIP_IDLE_MS + 300) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("useAutoTip", () => {
  it("shows nothing until the site's tip memory has loaded", () => {
    const { result } = renderHook(() => useAutoTip(["rail-coach"], true));
    idle();
    expect(result.current.tipId).toBeNull();
  });

  it("waits for the user to be idle, then shows the first unseen tip and records it as seen", () => {
    act(() => primeTipQueue(SITE, []));
    const { result } = renderHook(() => useAutoTip(["build-tip-1", "build-tip-2"], true));
    act(() => {
      vi.advanceTimersByTime(TIP_IDLE_MS - 400);
    });
    fireEvent.keyDown(document, { key: "a" });
    act(() => {
      vi.advanceTimersByTime(TIP_IDLE_MS - 400);
    });
    expect(result.current.tipId).toBeNull();
    idle();
    expect(result.current.tipId).toBe("build-tip-1");
    expect(svc.markEditorTip).toHaveBeenCalledWith(SITE, "build-tip-1", "seen");
  });

  it("skips tips this site has already seen", () => {
    act(() => primeTipQueue(SITE, ["build-tip-1"]));
    const { result } = renderHook(() => useAutoTip(["build-tip-1", "build-tip-2"], true));
    idle();
    expect(result.current.tipId).toBe("build-tip-2");
  });

  it("never while a pointer button is held (a drag) or an editor popup is open", () => {
    act(() => primeTipQueue(SITE, []));
    const { result } = renderHook(() => useAutoTip(["rail-coach"], true));
    fireEvent.pointerDown(document);
    idle(TIP_IDLE_MS * 3);
    expect(result.current.tipId).toBeNull();
    fireEvent.pointerUp(document);

    const menu = document.createElement("div");
    menu.setAttribute("role", "menu");
    document.body.appendChild(menu);
    idle(TIP_IDLE_MS * 3);
    expect(result.current.tipId).toBeNull();
    menu.remove();
    idle();
    expect(result.current.tipId).toBe("rail-coach");
  });

  it("at most ONE automatic tip per session, across every caller", () => {
    act(() => primeTipQueue(SITE, []));
    const coach = renderHook(() => useAutoTip(["rail-coach"], true));
    idle();
    expect(coach.result.current.tipId).toBe("rail-coach");
    act(() => coach.result.current.close());
    const build = renderHook(() => useAutoTip(["build-tip-1"], true));
    idle(TIP_IDLE_MS * 5);
    expect(build.result.current.tipId).toBeNull();
  });

  it("the session cap survives a reload of the editor in the same tab", () => {
    act(() => primeTipQueue(SITE, []));
    const first = renderHook(() => useAutoTip(["rail-coach"], true));
    idle();
    first.unmount();
    resetTipQueueForTests({ keepSession: true });
    act(() => primeTipQueue(SITE, []));
    const second = renderHook(() => useAutoTip(["build-tip-1"], true));
    idle(TIP_IDLE_MS * 5);
    expect(second.result.current.tipId).toBeNull();
  });

  it("close() records the dismissal", () => {
    act(() => primeTipQueue(SITE, []));
    const { result } = renderHook(() => useAutoTip(["rail-coach"], true));
    idle();
    act(() => result.current.close());
    expect(result.current.tipId).toBeNull();
    expect(svc.markEditorTip).toHaveBeenLastCalledWith(SITE, "rail-coach", "dismissed");
  });

  it("disabled asks for nothing", () => {
    act(() => primeTipQueue(SITE, []));
    const { result } = renderHook(() => useAutoTip(["rail-coach"], false));
    idle(TIP_IDLE_MS * 3);
    expect(result.current.tipId).toBeNull();
    expect(svc.markEditorTip).not.toHaveBeenCalled();
  });

  it("with no site (standalone demo) it works in memory and writes nothing", () => {
    act(() => primeTipQueue(null, []));
    const { result } = renderHook(() => useAutoTip(["rail-coach"], true));
    idle();
    expect(result.current.tipId).toBe("rail-coach");
    expect(svc.markEditorTip).not.toHaveBeenCalled();
  });

  it("showing a tip never moves focus", () => {
    act(() => primeTipQueue(SITE, []));
    function Host() {
      const tip = useAutoTip(["rail-coach"], true);
      return (
        <>
          <input data-testid="field" />
          {tip.tipId ? <div role="note">tip</div> : null}
        </>
      );
    }
    const { getByTestId, getByRole } = render(<Host />);
    getByTestId("field").focus();
    idle();
    expect(getByRole("note")).toBeTruthy();
    expect(document.activeElement).toBe(getByTestId("field"));
  });
});

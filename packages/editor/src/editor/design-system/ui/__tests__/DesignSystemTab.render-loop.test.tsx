/**
 * Regression test for the "Maximum update depth exceeded" infinite loop that
 * fires when DesignSystemTab mounts with a composer whose project already has
 * saved designTokens (length > 0).
 *
 * The full integration repro (rendering DesignSystemTab with non-empty
 * designTokens under StrictMode) hangs the test process in a sync render
 * loop — the assertion below pins the *root cause* directly: the identity
 * of `useResetAllKinds` must remain stable across re-renders of the
 * provider, otherwise any consumer that puts it in a useCallback dep array
 * (DesignSystemTab.loadFromComposer + the effect that calls it
 * synchronously) will recreate its own callback every render, re-fire the
 * effect, re-fire setState, and pin the React update queue.
 *
 * Pre-fix: each `useXTokens` returns a fresh object per render → 14
 * registries rotate identity → `useResetAllKinds`'s useCallback deps fail →
 * returned callable rotates identity → first === second fails below.
 *
 * Post-fix: registries pinned via useRef inside `useResetAllKinds`; the
 * returned callable has empty-deps identity → first === second passes.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as React from "react";
import { TokenRegistryProvider } from "../../state/TokenRegistryContext";
import { useResetAllKinds } from "../../state/TokenRegistryContext";
import { StylePresetRegistryProvider } from "../../state/StylePresetRegistryContext";
import { useResetAllPresets } from "../../state/StylePresetRegistryContext";

const PROJECT_ID = "render-loop-test";

beforeEach(() => {
  localStorage.clear();
});

describe("useResetAllKinds / useResetAllPresets identity stability", () => {
  it("useResetAllKinds returns a stable callable across re-renders", () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <TokenRegistryProvider projectId={PROJECT_ID}>
        {children}
      </TokenRegistryProvider>
    );
    const { result, rerender } = renderHook(() => useResetAllKinds(), {
      wrapper,
    });

    const first = result.current;
    rerender();
    const second = result.current;
    rerender();
    const third = result.current;

    // Each useXTokens hook returns a fresh object each render — listing
    // those 14 registries in the useCallback deps would make this callable
    // rotate identity every render, which destabilises every downstream
    // useCallback / useEffect that lists it as a dependency. The
    // DesignSystemTab loadFromComposer effect synchronously calls this
    // callable; instability there triggers an unbounded render loop.
    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  it("useResetAllKinds keeps stable identity across actual state mutations", () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <TokenRegistryProvider projectId={PROJECT_ID}>
        {children}
      </TokenRegistryProvider>
    );
    const { result, rerender } = renderHook(() => useResetAllKinds(), {
      wrapper,
    });

    const before = result.current;
    // Mutate registries by invoking the callable with an empty token list —
    // resetFromSaved / hydrateFromExternal commit setState on all 14 kinds.
    act(() => {
      result.current([]);
    });
    rerender();
    const after = result.current;
    expect(after).toBe(before);
  });

  it("useResetAllPresets returns a stable callable across re-renders", () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <StylePresetRegistryProvider projectId={PROJECT_ID}>
        {children}
      </StylePresetRegistryProvider>
    );
    const { result, rerender } = renderHook(() => useResetAllPresets(), {
      wrapper,
    });

    const first = result.current;
    rerender();
    const second = result.current;
    rerender();
    const third = result.current;

    expect(second).toBe(first);
    expect(third).toBe(first);
  });
});

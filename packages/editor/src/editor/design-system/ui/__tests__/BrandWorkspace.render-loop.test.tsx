/**
 * Regression net for the "Maximum update depth exceeded" loop that fired when
 * BrandWorkspace mounted over a project with saved designTokens.
 *
 * Its token half had a root cause in `useResetAllKinds` identity churn feeding
 * the workspace's load effect. Brand Part 1a (Task 10) deleted both: the
 * registries read the project themselves, so there is no load effect to loop.
 * What stays is a mount over saved tokens under StrictMode, and the preset
 * half — `useResetAllPresets` keeps the same ref-pinned shape.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import * as React from "react";
import { StylePresetRegistryProvider } from "@/editor/design-system/state/StylePresetRegistryContext";
import { useResetAllPresets } from "@/editor/design-system/state/StylePresetRegistryContext";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import { installDomShims, makeFakeComposer, renderWorkspace } from "./brandWorkspaceHarness";

const PROJECT_ID = "render-loop-test";

beforeEach(() => {
  installDomShims();
  localStorage.clear();
});

describe("BrandWorkspace mount + useResetAllPresets identity stability", () => {
  it("mounts over saved tokens without a render loop", () => {
    const composer = makeFakeComposer([...DEFAULT_TOKENS]);
    const utils = renderWorkspace(composer);
    expect(utils.getByTestId("brand-page-title").textContent).toBe("Colours");
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

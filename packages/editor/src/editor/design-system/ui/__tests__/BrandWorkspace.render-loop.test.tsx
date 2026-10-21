/**
 * Regression net for the "Maximum update depth exceeded" loop that fired when
 * BrandWorkspace mounted over a project with saved designTokens.
 *
 * Its token half had a root cause in `useResetAllKinds` identity churn feeding
 * the workspace's load effect. Brand Part 1a (Task 10) deleted both: the
 * registries read the project themselves, so there is no load effect to loop.
 * What stays is a mount over saved tokens. The preset half went the same way
 * (B-3): presets read the project too, and `useResetAllPresets` is gone.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import { installDomShims, makeFakeComposer, renderWorkspace } from "./brandWorkspaceHarness";

beforeEach(() => {
  installDomShims();
  localStorage.clear();
});

describe("BrandWorkspace mount", () => {
  it("mounts over saved tokens without a render loop", () => {
    const composer = makeFakeComposer([...DEFAULT_TOKENS]);
    const utils = renderWorkspace(composer);
    expect(utils.getByTestId("brand-page-title").textContent).toBe("Colours");
  });
});

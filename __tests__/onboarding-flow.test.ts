import { describe, it, expect } from "vitest";

describe("Onboarding Flow", () => {
  it("useOnboardingFlow hook is exported", async () => {
    const mod = await import("@/lib/hooks/use-onboarding-flow");
    expect(mod.useOnboardingFlow).toBeDefined();
  });
});

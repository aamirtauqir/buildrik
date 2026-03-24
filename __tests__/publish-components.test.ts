import { describe, it, expect } from "vitest";

describe("Publish Components", () => {
  it("PUBLISH_STEPS has 5 steps", async () => {
    const mod = await import("@/components/publish/publish-progress");
    expect(mod.PUBLISH_STEPS).toHaveLength(5);
    expect(mod.PUBLISH_STEPS).toEqual([
      "Generating pages",
      "Optimizing images",
      "Deploying to CDN",
      "Verifying SSL",
      "Performance check",
    ]);
  });

  it("PrePublishChecks component exists", async () => {
    const mod = await import("@/components/publish/pre-publish-checks");
    expect(mod.PrePublishChecks).toBeDefined();
  });

  it("PublishProgress component exists", async () => {
    const mod = await import("@/components/publish/publish-progress");
    expect(mod.PublishProgress).toBeDefined();
  });

  it("PublishSuccess component exists", async () => {
    const mod = await import("@/components/publish/publish-success");
    expect(mod.PublishSuccess).toBeDefined();
  });
});

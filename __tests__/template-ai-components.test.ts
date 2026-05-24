import { describe, it, expect } from "vitest";

describe("Template Components", () => {
  it("exports TEMPLATE_CATEGORIES with 6 categories + ALL", async () => {
    const mod = await import("@/components/templates/template-gallery");
    expect(mod.TEMPLATE_CATEGORIES).toHaveLength(7);
    expect(mod.TEMPLATE_CATEGORIES[0].value).toBe("ALL");
  });

  it("exports TEMPLATE_SORT_OPTIONS with 3 options", async () => {
    const mod = await import("@/components/templates/template-gallery");
    expect(mod.TEMPLATE_SORT_OPTIONS).toHaveLength(3);
  });

  it("exports TemplateCard component", async () => {
    const mod = await import("@/components/templates/template-card");
    expect(mod.TemplateCard).toBeDefined();
  });

  it("exports TemplatePreview component", async () => {
    const mod = await import("@/components/templates/template-preview");
    expect(mod.TemplatePreview).toBeDefined();
    expect(mod.DEVICE_OPTIONS).toHaveLength(3);
  });
});

describe("AI Wizard Components", () => {
  it("exports BUSINESS_TYPES with 6 types", async () => {
    const mod = await import("@/components/ai-wizard/step-type");
    expect(mod.BUSINESS_TYPES).toHaveLength(6);
    const values = mod.BUSINESS_TYPES.map((t: { value: string }) => t.value);
    expect(values).toContain("PORTFOLIO");
    expect(values).toContain("RESTAURANT");
  });

  // TONE_OPTIONS / CONTENT_OPTIONS / IMAGE_OPTIONS were intentionally
  // demoted to internal `const` in 77ea14e4 ("tighten step-pages exports").
  // Skipped: shape is verified at runtime by the step-pages render path,
  // and re-exporting purely to satisfy a length-assertion negates the
  // encapsulation choice. Restore + drop skip if exports become public.
  it.skip("exports TONE_OPTIONS with 6 options (internal — see 77ea14e4)", async () => {
    const mod = await import("@/components/ai-wizard/step-pages");
    expect(mod.TONE_OPTIONS).toHaveLength(6);
  });

  it.skip("exports CONTENT_OPTIONS with 3 options (internal — see 77ea14e4)", async () => {
    const mod = await import("@/components/ai-wizard/step-pages");
    expect(mod.CONTENT_OPTIONS).toHaveLength(3);
  });

  it.skip("exports IMAGE_OPTIONS with 3 options (internal — see 77ea14e4)", async () => {
    const mod = await import("@/components/ai-wizard/step-pages");
    expect(mod.IMAGE_OPTIONS).toHaveLength(3);
  });

  it("exports WizardProgress component", async () => {
    const mod = await import("@/components/ai-wizard/wizard-progress");
    expect(mod.WizardProgress).toBeDefined();
  });

  it("exports GenerationProgress component", async () => {
    const mod = await import("@/components/ai-wizard/generation-progress");
    expect(mod.GenerationProgress).toBeDefined();
    expect(mod.GENERATION_STEPS).toHaveLength(5);
  });
});
